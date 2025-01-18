import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { XIcon } from "lucide-react";
import { io } from "socket.io-client";

import { useMediaQuery } from "../../hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "../../components/ui/dialog";

import LoadingSpinner from "../../components/LoadingSpinner";
import server from "../../utils/serverConfig";
import formatCurrency from "../../utils/formatCurrency";
import { fetchFunds } from "../../FunctionCall/fetchFunds";
import toast from "react-hot-toast";
import DdpiModal from "../StockRecommendation/DdpiModal";

const UpdateRebalanceModal = ({
  userEmail,
  getUserDetails,
  openRebalanceModal,
  setOpenRebalanceModal,
  data,
  calculatedPortfolioData,
  broker,
  apiKey,
  jwtToken,
  secretKey,
  clientCode,
  sid,
  serverId,
  viewToken,
  setOpenSucessModal,
  setOrderPlacementResponse,
  modelPortfolioModelId,
  modelPortfolioRepairTrades,
  getRebalanceRepair,
  storeModalName,
  getModelPortfolioStrategyDetails,
  setShowOtherBrokerModel,
  isReturningFromOtherBrokerModal,
  userDetails,
  setShowDdpiModal,
  setIsReturningFromOtherBrokerModal,
  setShowDhanTpinModel,
  setShowAngleOneTpinModel,
  edisStatus,
  dhanEdisStatus,
  selectNonBroker,
  setShowFyersTpinModal,
  reopenRebalanceModal,
}) => {
  const appURL = process.env.REACT_APP_URL;
  const ccxtUrl = process.env.REACT_APP_CCXT_SERVER_WEBSOCKET_URL;
  const zerodhaApiKey = process.env.REACT_APP_ZERODHA_API_KEY;
  const advisorTag = process.env.REACT_APP_ADVISOR_SPECIFIC_TAG;
  const isDesktop = useMediaQuery("(min-width: 830px)");
  const [loading, setLoading] = useState();

  const checkValidApiAnSecret = (details) => {
    try {
      const bytesKey = CryptoJS.AES.decrypt(details, "ApiKeySecret");
      const Key = bytesKey.toString(CryptoJS.enc.Utf8); // Convert to UTF-8 string

      if (Key) {
        return Key;
      } else {
        throw new Error("Decryption failed or invalid key.");
      }
    } catch (error) {
      return null;
    }
  };

  const filteredData = data.filter(
    (item) => item.model_name === storeModalName
  );

  // Now, let's find the matching repair trade
  const matchingRepairTrade =
    modelPortfolioRepairTrades &&
    modelPortfolioRepairTrades?.find(
      (trade) => trade.modelId === modelPortfolioModelId
    );

  const repairStatus =
    matchingRepairTrade &&
    matchingRepairTrade.failedTrades &&
    matchingRepairTrade.failedTrades.length > 0;

  // Check if modelPortfolioRepairTrades exists and has trades
  let dataArray = [];

  if (repairStatus) {
    dataArray = matchingRepairTrade.failedTrades.map((trade) => ({
      symbol: trade.advSymbol,
      qty: parseInt(trade.advQTY, 10),
      orderType: trade.transactionType.toUpperCase(),
      exchange: trade.advExchange,
    }));
  } else if (calculatedPortfolioData && calculatedPortfolioData?.length !== 0) {
    dataArray =
      calculatedPortfolioData?.length !== 0
        ? [
            ...calculatedPortfolioData?.buy.map((item) => ({
              symbol: item.symbol,
              qty: item.quantity, // Adjust according to the API response
              orderType: "BUY",
              exchange: item.exchange, // Use directly from the API response
            })),
            ...calculatedPortfolioData?.sell.map((item) => ({
              symbol: item.symbol,
              qty: item.quantity, // Adjust according to the API response
              orderType: "SELL",
              exchange: item.exchange, // Based on your condition
            })),
          ]
        : [];
  }

  const [ltp, setLtp] = useState([]);
  const socketRef = useRef(null);
  const subscribedSymbolsRef = useRef(new Set());
  const failedSubscriptionsRef = useRef({});
  const MAX_RETRY_ATTEMPTS = 3;
  const webListingUrl = process.env.REACT_APP_WEBSOCKET_LISTENING_URL;

  useEffect(() => {
    socketRef.current = io(`${webListingUrl}`, {
      transports: ["websocket"],
      query: { EIO: "4" },
    });

    socketRef.current.on("market_data", (data) => {
      setLtp((prev) => {
        const index = prev.findIndex(
          (item) => item.tradingSymbol === data.stockSymbol
        );
        if (index !== -1) {
          const newLtp = [...prev];
          newLtp[index] = {
            ...newLtp[index],
            lastPrice: data.last_traded_price,
          };
          return newLtp;
        } else {
          return [
            ...prev,
            {
              tradingSymbol: data.stockSymbol,
              lastPrice: data.last_traded_price,
            },
          ];
        }
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const getCurrentPrice = useCallback(() => {
    if (!dataArray || dataArray.length === 0) return;

    const symbolsToSubscribe = dataArray.filter(
      (trade) =>
        !subscribedSymbolsRef.current.has(trade.symbol) &&
        (!failedSubscriptionsRef.current[trade.symbol] ||
          failedSubscriptionsRef.current[trade.symbol] < MAX_RETRY_ATTEMPTS)
    );

    symbolsToSubscribe.forEach((trade) => {
      const data = { symbol: trade.symbol, exchange: trade.exchange };

      axios
        .post(`${ccxtUrl}websocket/subscribe`, data)
        .then(() => {
          subscribedSymbolsRef.current.add(trade.symbol);
          delete failedSubscriptionsRef.current[trade.symbol];
        })
        .catch((error) => {
          failedSubscriptionsRef.current[trade.symbol] =
            (failedSubscriptionsRef.current[trade.symbol] || 0) + 1;
        });
    });
  }, [dataArray]);

  useEffect(() => {
    if (dataArray && dataArray.length > 0) {
      getCurrentPrice();
    }
  }, [dataArray, getCurrentPrice]);

  const getLTPForSymbol = useCallback(
    (symbol) => {
      const ltpItem = ltp.find((item) => item.tradingSymbol === symbol);
      return ltpItem ? ltpItem.lastPrice : null;
    },
    [ltp]
  );

  const totalInvestmentValue = dataArray
    .filter((item) => item.orderType === "BUY")
    .reduce((total, item) => {
      const currentPrice = getLTPForSymbol(item.symbol);
      const investment = item.qty * currentPrice;
      return total + investment;
    }, 0);

  const convertResponse = (dataArray) => {
    return dataArray.map((item) => {
      return {
        transactionType: item.orderType,
        exchange: item.exchange || "",
        segment: "EQUITY",
        productType: "DELIVERY",
        orderType: "MARKET",
        price: 0,
        tradingSymbol: item.symbol,
        quantity: item.qty,
        priority: 0,
        user_broker: broker,
      };
    });
  };

  const stockDetails = convertResponse(dataArray);

  const isMixed =
    stockDetails.some((item) => item.transactionType === "BUY") &&
    stockDetails.some((item) => item.transactionType === "SELL");

  const allSell = stockDetails.every((item) => item.transactionType === "SELL");

  const allBuy = stockDetails.every((item) => item.transactionType === "BUY");
  const placeOrder = async () => {
    setLoading(true);
    const hasExchangeEmpty = stockDetails.some((item) => item.exchange === " ");
    if (hasExchangeEmpty) {
      toast.error("Error in exchange information, please try again", {
        duration: 3000,
        style: {
          background: "white",
          color: "#1e293b",
          maxWidth: "500px",
          fontWeight: 600,
          fontSize: "14px",
          padding: "10px 20px",
        },
        iconTheme: {
          primary: "#e43d3d",
          secondary: "#FFFAEE",
        },
      });
      setLoading(false);
      return;
    }

    const matchingRepairTrade =
      modelPortfolioRepairTrades &&
      modelPortfolioRepairTrades?.find(
        (trade) => trade.modelId === modelPortfolioModelId
      );

    const getBasePayload = () => ({
      user_broker: broker,
      user_email: userEmail,
      trades: stockDetails,
      model_id: modelPortfolioModelId,
    });

    const getBrokerSpecificPayload = () => {
      switch (broker) {
        case "IIFL Securities":
          return { clientCode };
        case "ICICI Direct":
        case "Upstox":
          return {
            apiKey: checkValidApiAnSecret(apiKey),
            secretKey: checkValidApiAnSecret(secretKey),
            [broker === "Upstox" ? "accessToken" : "sessionToken"]: jwtToken,
          };
        case "Angel One":
          return { apiKey, jwtToken };
        case "Hdfc Securities":
          return {
            apiKey: checkValidApiAnSecret(apiKey),
            accessToken: jwtToken,
          };
        case "Dhan":
          return {
            clientId: clientCode,
            accessToken: jwtToken,
          };
        case "Kotak":
          return {
            consumerKey: checkValidApiAnSecret(apiKey),
            consumerSecret: checkValidApiAnSecret(secretKey),
            accessToken: jwtToken,
            viewToken: viewToken,
            sid: sid,
            serverId: serverId,
          };
        case "AliceBlue":
          return {
            clientId: clientCode,
            accessToken: jwtToken,
            apiKey: apiKey,
          };
        case "Fyers":
          return {
            clientId: clientCode,
            accessToken: jwtToken,
          };
        default:
          return {};
      }
    };

    const getAdditionalPayload = () => {
      if (matchingRepairTrade) {
        return {
          modelName: matchingRepairTrade.modelName,
          advisor: advisorTag,
          unique_id: matchingRepairTrade?.uniqueId,
        };
      } else {
        return {
          modelName: filteredData[0]["model_name"],
          advisor: advisorTag,
          unique_id: calculatedPortfolioData?.uniqueId,
        };
      }
    };

    const payload = {
      ...getBasePayload(),
      ...getBrokerSpecificPayload(),
      ...getAdditionalPayload(),
    };

    const specialBrokers = [
      // "Dhan",
      "IIFL Securities",
      "ICICI Direct",
      "Upstox",
      "Kotak",
      "Hdfc Securities",
      "AliceBlue",
    ];

    const config = {
      method: "post",
      url: `${server.ccxtServer.baseUrl}rebalance/process-trade`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(payload),
    };

    await axios
      .request(config)
      .then(async (response) => {
        const checkData = response?.data?.results;
        setOrderPlacementResponse(response?.data?.results);

        const isMixed =
          checkData?.some((stock) => stock.transactionType === "BUY") &&
          checkData?.some((stock) => stock.transactionType === "SELL");
        const allBuy = checkData?.every(
          (stock) => stock.transactionType === "BUY"
        );
        const allSell = checkData?.every(
          (stock) => stock.transactionType === "SELL"
        );

        const rejectedSellCount = response.data.results.reduce(
          (count, order) => {
            return (order?.orderStatus === "Rejected" ||
              order?.orderStatus === "rejected" ||
              order?.orderStatus === "Rejected" ||
              order?.orderStatus === "cancelled" ||
              order?.orderStatus === "CANCELLED" ||
              order?.orderStatus === "Cancelled") &&
              order.transactionType === "SELL"
              ? count + 1
              : count;
          },
          0
        );

        const successCount = response.data.results.reduce((count, order) => {
          return (order?.orderStatus === "COMPLETE" ||
            order?.orderStatus === "Complete" ||
            order?.orderStatus === "complete" ||
            order?.orderStatus === "COMPLETE" ||
            order?.orderStatus === "Placed" ||
            order?.orderStatus === "PLACED" ||
            order?.orderStatus === "Executed" ||
            order?.orderStatus === "Ordered" ||
            order?.orderStatus === "open" ||
            order?.orderStatus === "OPEN" ||
            order?.orderStatus === "Traded" ||
            order?.orderStatus === "TRADED" ||
            order?.orderStatus === "Transit" ||
            order?.orderStatus === "TRANSIT") &&
            (order.transactionType === "SELL" || isMixed)
            ? count + 1
            : count;
        }, 0);

        if (
          !isReturningFromOtherBrokerModal &&
          specialBrokers.includes(broker)
        ) {
          if (allBuy) {
            // Proceed with order placement for BUY
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
          } else if (
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setShowOtherBrokerModel(true);
            setOpenRebalanceModal(false);
            setLoading(false);
            return; // Exit the function early
          } else {
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
          }
        } else {
          if (
            broker === "Angel One" &&
            // edisStatus &&
            // edisStatus.edis === false &&
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setOpenSucessModal(false);
            setShowAngleOneTpinModel(true);
            return;
          } else if (
            broker === "Dhan" &&
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setShowDhanTpinModel(true);
            setOpenSucessModal(false);
            return;
          } else if (
            broker === "Fyers" &&
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setOpenSucessModal(false);
            setShowFyersTpinModal(true);
          } else {
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
            // try {
            //   await axios.put(
            //     `${server.server.baseUrl}api/update-edis-status`,
            //     {
            //       uid: userDetails?._id,
            //       ddpi_enabled: true,
            //       user_broker: userDetails?.user_broker,
            //     }
            //   );
            //   // Optionally, update the state to reflect the changes in the UI
            //   getUserDetails();
            // } catch (error) {}
          }
        }

        getRebalanceRepair();
        const updateData = {
          modelId: modelPortfolioModelId,
          orderResults: response.data.results,
          userEmail: userEmail,
          modelName: filteredData[0]["model_name"],
        };

        return axios.post(
          `${server.server.baseUrl}api/model-portfolio-db-update`,
          updateData
        );
      })
      .then(() => {
        setLoading(false);
        setOpenRebalanceModal(false);
        getModelPortfolioStrategyDetails();
      })
      .catch((error) => {
        setLoading(false);
      });
    setIsReturningFromOtherBrokerModal(false);
  };

  const handleClose = () => {
    getModelPortfolioStrategyDetails();
    setOpenRebalanceModal(false);
  };

  const getAdditionalPayload = () => {
    if (matchingRepairTrade) {
      return {
        modelName: matchingRepairTrade.modelName,
        advisor: matchingRepairTrade.advisorName,
        unique_id: matchingRepairTrade?.uniqueId,
        model_id: modelPortfolioModelId,
        broker: broker,
      };
    } else {
      return {
        modelName: filteredData[0]["model_name"],
        advisor: filteredData[0]["advisor"],
        unique_id: calculatedPortfolioData?.uniqueId,
        model_id: modelPortfolioModelId,
        broker: broker,
      };
    }
  };
  const additionalPayload = getAdditionalPayload();

  const handleZerodhaPlaceOrder = async () => {
    setShowDdpiModal(false); // Hide DDPI Modal

    localStorage.setItem(
      "additionalPayload",
      JSON.stringify(additionalPayload)
    );

    const apiKey = zerodhaApiKey;
    const basket = stockDetails.map((stock) => {
      let baseOrder = {
        variety: "regular",
        tradingsymbol: stock.tradingSymbol,
        exchange: stock.exchange,
        transaction_type: stock.transactionType,
        order_type: stock.orderType,
        quantity: stock.quantity,
        readonly: false,
      };

      // Get the LTP for the current stock
      const ltp = getLTPForSymbol(stock.tradingSymbol);

      // If LTP is available and not '-', use it as the price
      if (ltp !== "-") {
        baseOrder.price = parseFloat(ltp);
      }

      // If it's a LIMIT order, use the LTP as the price
      if (stock.orderType === "LIMIT" || stock.orderType === "STOP") {
        // For LIMIT orders, always use the limit price specified
        baseOrder.price = parseFloat(stock.price || 0);
      } else if (stock.orderType === "MARKET") {
        // For MARKET orders, get LTP
        const ltp = getLTPForSymbol(stock.tradingSymbol);
        if (ltp !== "-") {
          baseOrder.price = parseFloat(ltp);
          baseOrder.variety = "regular";
        } else {
          baseOrder.variety = "regular";
          baseOrder.price = stock.limitPrice || 0; // Use limitPrice if available, or set to 0
        }
      }

      if (stock.quantity > 100) {
        baseOrder.readonly = true;
      }

      return baseOrder;
    });

    const form = document.createElement("form");
    form.method = "POST";

    form.action = `https://kite.zerodha.com/connect/basket`;

    // form.target = "_blank";

    const apiKeyInput = document.createElement("input");
    apiKeyInput.type = "hidden";
    apiKeyInput.name = "api_key";
    apiKeyInput.value = apiKey;

    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "data";
    dataInput.value = JSON.stringify(basket);

    const redirectParams = document.createElement("input");
    redirectParams.type = "hidden";
    redirectParams.name = "redirect_params";
    redirectParams.value = `${appURL},rebalance=true`;

    form.appendChild(apiKeyInput);
    form.appendChild(dataInput);
    form.appendChild(redirectParams);

    document.body.appendChild(form);

    const currentISTDateTime = new Date();
    try {
      // Update the database with the current IST date-time
      await axios
        .post(
          `${server.server.baseUrl}api/zerodha/model-portfolio/update-reco-with-zerodha-model-pf`,
          {
            stockDetails: stockDetails,
            leaving_datetime: currentISTDateTime,
            email: userEmail,
            trade_given_by: "demoadvisor@alphaquark.in",
          }
        )
        .then((res) => {
          const allStockDetails = res?.data?.data;
          const filteredStockDetails = allStockDetails.map((detail) => ({
            user_email: detail.user_email,
            trade_given_by: detail.trade_given_by,
            tradingSymbol: detail.Symbol,
            transactionType: detail.Type,
            exchange: detail.Exchange,
            segment: detail.Segment,
            productType: detail.ProductType,
            orderType: detail.OrderType,
            price: detail.Price,
            quantity: detail.Quantity,
            priority: detail.Priority,
            tradeId: detail.tradeId,
            user_broker: "Zerodha", // Manually adding this field
          }));

          setLoading(false);
          localStorage.setItem(
            "stockDetailsZerodhaOrder",
            JSON.stringify(filteredStockDetails)
          );
        })
        .catch((err) => {
          setLoading(false);
        });
      // Submit the form after the database is updated
      form.submit();
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleZerodhaRedirect = async () => {
    setLoading(true);
    if (allBuy) {
      handleZerodhaPlaceOrder();
    } else if (allSell || isMixed) {
      // Handle DDPI modal logic for SELL or mixed trades
      if (
        !userDetails?.ddpi_status || // No ddpi_status
        userDetails?.ddpi_status === "empty" || // ddpi_status is "empty"
        (["empty", "consent"].includes(userDetails?.ddpi_status) && // Either "empty" or "consent"
          !userDetails?.is_authorized_for_sell) // And not authorized for sell
      ) {
        setLoading(false);
        setOpenRebalanceModal(false);
        setShowDdpiModal(true); // Show DDPI Modal for invalid or missing status
      } else {
        setShowDdpiModal(false); // Hide DDPI Modal
        handleZerodhaPlaceOrder();
      }
    }
  };

  const [funds, setFunds] = useState({});

  const getAllFunds = async () => {
    const fetchedFunds = await fetchFunds(
      broker,
      clientCode,
      apiKey,
      jwtToken,
      secretKey
    );
    if (fetchedFunds) {
      setFunds(fetchedFunds);
    } else {
    }
  };
  useEffect(() => {
    // Call the function when the component mounts or when relevant props change
    if (broker && (clientCode || jwtToken)) {
      getAllFunds();
    }
  }, [broker, clientCode, apiKey, jwtToken, secretKey]);

  return (
    <Dialog open={openRebalanceModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[72vw] lg:max-w-[52vw] xl:max-w-[38vw] w-full p-0">
        <div className="flex flex-col w-full rounded-lg bg-white">
          <div className="px-4 sm:px-6 py-4 flex flex-col space-y-3 shadow-md">
            <div className="text-[22px] text-black font-bold leading-[40px] font-sans">
              {storeModalName} Rebalance
            </div>
          </div>
          <div className="">
            {selectNonBroker === true ? (
              <div className="px-2 flex flex-row py-2 bg-gray-50 text-gray-800 border">
                <div className="text-base font-semibold">Note:</div>
                <div className="ml-3 text-sm">
                  The initial allocation of model portfolio position is shown as
                  per your investment of ₹{totalInvestmentValue.toFixed(2)} in
                  this portfolio. Please ensure to keep these stocks in your
                  portfolio by buying manually. Please connect your broker in
                  the platform for seamless execution.
                </div>
              </div>
            ) : null}
            <div className=" w-full border-t-[1px]   border-[#000000]/10 h-[380px] overflow-auto custom-scroll">
              {dataArray?.length !== 0 ? (
                // <table className={`w-full  h-[80vh] sm:h-auto  overflow-auto custom-scroll`}>
                <table className={`w-full `}>
                  <thead className="bg-[#f5f5f5]  sticky top-0 z-20 ">
                    <tr className="border-b-[1px]   border-[#000000]/10">
                      <th className="text-[12px] lg:text-[13px] text-[#000000]/80 font-poppins font-medium text-left px-3 py-3 lg:py-3 lg:px-8">
                        Stocks
                      </th>

                      <th className="text-[12px] min-w-[120px] lg:text-[13px] text-[#000000]/80 font-poppins font-medium px-2 py-3 lg:py-3 lg:px-5 ">
                        Current Price (₹)
                      </th>

                      <th className="text-[12px] lg:text-[13px] text-[#000000]/80 font-poppins font-medium px-2 py-3 lg:py-3 lg:px-5 ">
                        Quantity
                      </th>
                      {/* <th className="text-[12px] min-w-[90px] lg:text-[13px] text-[#000000]/80 font-poppins font-medium px-2 py-3 lg:py-3 lg:px-5 ">
                          Order Type
                        </th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {dataArray?.map((item, i) => {
                      const currentLTP = getLTPForSymbol(item.symbol);

                      return (
                        <tr
                          className={`border-b-[1px]   border-[#000000]/10 last-of-type:border-none`}
                          key={i}
                        >
                          <td className="text-[14px] sm:text-sm  text-[#000000]/80 font-poppins font-medium text-left py-3 px-3 lg:py-4 lg:px-8 ">
                            <div className="flex flex-col items-start">
                              <span>{item.symbol}</span>

                              <span
                                className={`ml-1 ${
                                  item?.orderType?.toLowerCase() === "buy"
                                    ? "text-[#16A085] text-[14px] font-poppins font-semibold text-center  capitalize"
                                    : item?.orderType?.toLowerCase() === "sell"
                                    ? "text-[#EA2D3F] text-[14px] font-poppins font-semibold text-center  capitalize"
                                    : "text-[#000000]/80 text-[14px] font-poppins font-semibold text-center capitalize"
                                }`}
                              >
                                {item.orderType?.toLowerCase()}
                              </span>
                            </div>
                          </td>

                          <td className="text-[15px]  text-[#000000]/80 font-poppins font-normal text-center py-3 px-5 ">
                            ₹ {currentLTP}
                          </td>

                          <td className="text-[15px]  text-[#000000]/80 font-poppins font-medium text-center py-3 px-3 lg:py-4 lg:px-5 ">
                            {item.qty}
                          </td>
                          {/* <td
                              className={
                                item?.orderType?.toLowerCase() === "buy"
                                  ? "text-[#16A085] text-[14px] font-poppins font-semibold text-center py-3 px-3 lg:py-4 lg:px-5 capitalize"
                                  : item?.orderType?.toLowerCase() === "sell"
                                  ? "text-[#EA2D3F] text-[14px] font-poppins font-semibold text-center py-3 px-3 lg:py-4 lg:px-5 capitalize"
                                  : "text-[#000000]/80 text-[15px] font-poppins font-semibold text-center py-3 px-3 lg:py-4 lg:px-5 capitalize"
                              }
                            >
                              {item.orderType?.toLowerCase()}
                            </td> */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : calculatedPortfolioData?.status === 0 ? (
                <div className="pt-12 space-y-4">
                  <div className="w-full flex flex-row justify-center text-xl font-semibold text-center items-center">
                    Insufficient Funds
                  </div>
                  <div className="w-full flex flex-row justify-center text-base text-[#000000]/50 font-semibold text-center items-center">
                    {calculatedPortfolioData?.message}
                  </div>
                </div>
              ) : (
                <div className="pt-12 space-y-4">
                  <div className="w-full flex flex-row justify-center text-xl font-semibold text-center items-center">
                    Something Went Wrong
                  </div>
                  <div className="w-full flex flex-row justify-center text-base text-[#000000]/50 font-semibold text-center items-center">
                    We ran into an issue with your broker. Please try again
                    later in sometime.
                  </div>
                </div>
              )}
            </div>
          </div>
          {dataArray?.length !== 0 ? (
            <DialogFooter className="flex flex-row sm:flex-row sm:justify-between px-4 sm:px-6 py-4 border-t border-gray-200">
              {/* <div className="flex flex-col items-start mb-2 sm:mb-0">
              <div className="flex flex-row gap-4">
                <div className=" leading-[22px] font-poppins text-sm font-medium text-gray-700">
               Required Fund:
                </div>
                <div className="text-2xl font-poppins font-semibold text-gray-900 ">
                  ₹ {totalInvestmentValue.toFixed(2)}
                </div>
              </div>
              </div> */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-0 space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">
                    Required Fund
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹ {totalInvestmentValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">
                    Available Fund
                  </span>
                  <span
                    id="cash-balance-value"
                    className={`
                                   ${
                                     funds?.data?.availablecash > 0
                                       ? " text-[#16A085] "
                                       : funds?.data?.availablecash < 0
                                       ? " text-[#EA2D3F]"
                                       : "text-black"
                                   }
                                     text-lg font-semibold text-gray-900 font font-poppins`}
                  >
                    {funds?.data?.availablecash &&
                    !isNaN(funds?.data?.availablecash) ? (
                      <>
                        ₹
                        {formatCurrency(
                          parseFloat(funds?.data?.availablecash).toFixed(2)
                        )}
                      </>
                    ) : (
                      <span className="text-[13px] font-semibold text-gray-900 font font-poppins">
                        NA(Login to your broker for values)
                      </span>
                    )}
                  </span>
                </div>
              </div>{" "}
              {userDetails?.connect_broker_status === "connected" ? (
                <>
                  {broker === "Zerodha" ? (
                    <button
                      className="w-40 h-12 flex items-center justify-center bg-black text-white text-base font-medium rounded-md font-poppins"
                      onClick={handleZerodhaRedirect}
                    >
                      {loading === true ? (
                        <LoadingSpinner />
                      ) : (
                        <span className="text-[18px] font-medium text-[#ffffff] font-poppins ">
                          Place Order
                        </span>
                      )}
                    </button>
                  ) : (
                    <button
                      className="w-36 h-10 ml-auto sm:ml-0 flex items-center justify-center bg-black text-white text-base font-medium rounded-md font-poppins"
                      onClick={placeOrder}
                    >
                      {loading === true ? (
                        <LoadingSpinner />
                      ) : (
                        <span className="text-[15px]">Place Order</span>
                      )}
                    </button>
                  )}
                </>
              ) : null}
            </DialogFooter>
          ) : null}
        </div>

        <DdpiModal
          reopenRebalanceModal={reopenRebalanceModal}
          getUserDetails={getUserDetails}
          userDetails={userDetails}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateRebalanceModal;
