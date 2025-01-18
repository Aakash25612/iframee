import React, { useState, useEffect } from "react";
import moment from "moment";
import {
  BanIcon,
  CalendarDays,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import IsMarketHours from "../../utils/isMarketHours";
import server from "../../utils/serverConfig";
// import { FaFire } from "react-icons/fa";
import DdpiModal from "./DdpiModal";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
const NewStockCard = ({
  id,
  isSelected,
  symbol,
  date,
  Quantity,
  action,
  orderType,
  rationale,
  recommendationStock,
  setRecommendationStock,
  setStockDetails,
  stockDetails,
  exchange,
  funds,
  setOpenReviewTrade,
  Price,
  setOpenIgnoreTradeModel,
  setStockIgnoreId,
  advisedRangeLower,
  advisedRangeHigher,
  tradeId,
  setOpenTokenExpireModel,
  todayDate,
  expireTokenDate,
  brokerStatus,
  setBrokerModel,
  broker,
  setOpenZerodhaModel,
  getCartAllStocks,
  setSingleStockSelectState,
  getAllFunds,
  getLTPForSymbol,
  edisStatus,
  dhanEdisStatus,
  allBuy,
  allSell,
  isMixed,
  setShowAngleOneTpinModel,
  setShowDhanTpinModel,
  onOpenDhanTpinModal,
  filteredTrades,
  userDetails,
}) => {
  const [isLtpLoading, setLtpIsLoading] = useState(true);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const ltp = getLTPForSymbol(symbol);
  const [user] = useAuthState(auth);

  const userEmail = user && user.email;

  useEffect(() => {
    if (ltp !== undefined) {
      setLtpIsLoading(false);
    }
  }, [ltp]);

  useEffect(() => {
    const skeletonTimer = setTimeout(() => {
      setIsSkeletonVisible(false);
    }, 300);

    return () => {
      clearTimeout(skeletonTimer);
    };
  }, []);

  const handleIncreaseStockQty = (symbol, tradeId) => {
    const newData = recommendationStock.map((stock) => {
      if (stock.Symbol === symbol && stock.tradeId === tradeId) {
        const newQuantity = stock.Quantity + 1;

        // Update the cart with the new quantity
        axios
          .post(`${server.server.baseUrl}api/cart/update`, {
            tradeId,
            Quantity: newQuantity,
          })
          .then(() => {
            console.log("Cart updated with new quantity");
            getCartAllStocks(); // Refresh the cart data
          })
          .catch((error) => {
            console.error("Error updating cart:", error);
          });

        return { ...stock, Quantity: newQuantity };
      }
      return stock;
    });

    setRecommendationStock(newData);
  };

  const handleDecreaseStockQty = (symbol, tradeId) => {
    const newData = recommendationStock.map((stock) => {
      if (stock.Symbol === symbol && stock.tradeId === tradeId) {
        const newQuantity = Math.max(stock.Quantity - 1, 0);

        // Update the cart with the new quantity
        axios
          .post(`${server.server.baseUrl}api/cart/update`, {
            tradeId,
            Quantity: newQuantity,
          })
          .then(() => {
            console.log("Cart updated with new quantity");
            getCartAllStocks(); // Refresh the cart data
          })
          .catch((error) => {
            console.error("Error updating cart:", error);
          });

        return { ...stock, Quantity: newQuantity };
      }
      return stock;
    });

    setRecommendationStock(newData);
  };

  const handleSelectStock = async (tradeId) => {
    getAllFunds();
    console.log("sele", tradeId);
    const isSelected = stockDetails.some(
      (selectedStock) => selectedStock.tradeId === tradeId
    );
    if (isSelected) {
      setStockDetails(
        stockDetails.filter(
          (selectedStock) => selectedStock.tradeId !== tradeId
        )
      );
      try {
        await axios.post(
          `${server.server.baseUrl}api/cart/cart-items/remove/remove-from-cart`,
          {
            tradeId,
          }
        );
        getCartAllStocks();
      } catch (error) {
        console.error("Error removing stock from cart:", error);
      }
    } else {
      const updatedStock = recommendationStock.find(
        (item) => item.tradeId === tradeId
      );
      if (updatedStock) {
        const newStock = {
          user_email: updatedStock.user_email,
          trade_given_by: updatedStock.trade_given_by,
          tradingSymbol:
            (updatedStock.Exchange === "NFO" ||
              updatedStock.Exchange === "BFO") &&
            broker === "Zerodha"
              ? updatedStock.zerodhaSymbol
              : updatedStock.Symbol,
          transactionType: updatedStock.Type,
          exchange: updatedStock.Exchange,
          segment: updatedStock.Segment,
          productType:
            updatedStock.Exchange === "NFO" || updatedStock.Exchange === "BFO"
              ? "CARRYFORWARD"
              : updatedStock.ProductType,
          orderType: updatedStock.OrderType,
          price: updatedStock.Price,
          quantity: updatedStock.Quantity,
          priority: updatedStock.Priority || 1,
          tradeId: updatedStock.tradeId,
          user_broker: broker,
        };
        if (
          broker === "Zerodha" &&
          (updatedStock.Exchange === "NFO" || updatedStock.Exchange === "BFO")
        ) {
          try {
            const payload = {
              userEmail: userEmail, // Include the user's email
              symbols: [
                {
                  symbol: updatedStock.Symbol, // Add the symbol from updatedStock
                  transactionType: updatedStock.Type, // Set transactionType dynamically, default to "BUY"
                },
              ],
            };
            const response = await axios.post(
              `${server.ccxtServer.baseUrl}zerodha/fno/symbol-lotsize`,
              payload
            );

            if (response.data && response.data.results) {
              const lotSizeData = response.data.results.find(
                (item) => item.previous_symbol === updatedStock.Symbol
              );
              if (lotSizeData) {
                // Update the stock details with the returned symbol and lot size
                newStock.tradingSymbol = lotSizeData.new_symbol;
                newStock.quantity = lotSizeData.lotsize * newStock.quantity;
              }
            }
          } catch (error) {
            console.error("Error fetching lot size:", error);
          }
        }
        setStockDetails((prevStockDetails) => [...prevStockDetails, newStock]);

        try {
          await axios.post(`${server.server.baseUrl}api/cart`, { tradeId });
          getCartAllStocks();
        } catch (error) {
          console.error("Error adding stock to cart:", error);
        }
      }
    }
  };

  const handleQuantityInputChange = (symbol, value, tradeId) => {
    if (!value || value === "") {
      const newData = recommendationStock.map((stock) =>
        stock.Symbol === symbol && stock.tradeId === tradeId
          ? { ...stock, Quantity: "" }
          : stock
      );
      setRecommendationStock(newData);
    } else {
      const newData = recommendationStock.map((stock) =>
        stock.Symbol === symbol && stock.tradeId === tradeId
          ? { ...stock, Quantity: parseInt(value) }
          : stock
      );
      setRecommendationStock(newData);
    }
    axios
      .post(`${server.server.baseUrl}api/cart/update`, {
        tradeId,
        Quantity: parseInt(value) || 0,
      })
      .then(() => {
        console.log("Cart updated with new quantity");
        getCartAllStocks(); // Refresh the cart data
      })
      .catch((error) => {
        console.error("Error updating cart:", error);
      });
  };

  useEffect(() => {
    // Sync the stockDetails with the updated data
    const updatedSelectedStocks = stockDetails.map((selectedStock) => {
      const updatedStock = recommendationStock.find(
        (stock) =>
          stock.Symbol === selectedStock.tradingSymbol &&
          stock.tradeId === selectedStock.tradeId
      );
      return updatedStock
        ? { ...selectedStock, quantity: updatedStock.Quantity }
        : selectedStock;
    });
    setStockDetails(updatedSelectedStocks);
  }, [recommendationStock]);

  const updateTradeTypeInLocalStorage = (isBuy, isSell) => {
    const newTradeType = {
      allBuy: isBuy,
      allSell: isSell,
    };
    localStorage.setItem("storedTradeType", JSON.stringify(newTradeType));
  };

  const [showDdpiModal, setShowDdpiModal] = useState(false);

  const handleSingleSelectStock = async (tradeId) => {
    getAllFunds();
    const isMarketHours = IsMarketHours();
    const isFundsEmpty = funds?.status === false || funds?.status === 1;
    const currentBroker = userDetails?.user_broker;
    const currentBrokerRejectedCount = parseInt(
      localStorage.getItem(
        `rejectedCount${currentBroker?.replace(/ /g, "")}`
      ) || "0"
    );
    //     const rejectedCountKey = `rejectedCount${currentBroker?.replace(/ /g, "")}`;
    console.log("currentBrokerRejectedCount", currentBrokerRejectedCount);
    // console.log(`${rejectedCountKey}: ${currentBrokerRejectedCount}`);

    // if (!isMarketHours) {
    //   toast.error("Orders cannot be placed outside Market hours.", {
    //     duration: 3000,
    //     style: {
    //       background: "white",
    //       color: "#1e293b",
    //       maxWidth: "500px",
    //       fontWeight: 600,
    //       fontSize: "13px",
    //       padding: "10px 20px",
    //     },
    //     iconTheme: {
    //       primary: "#e43d3d",
    //       secondary: "#FFFAEE",
    //     },
    //   });
    //   return;
    // }

    if (broker === "Zerodha") {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
      } else {
        const isSelected = stockDetails.some(
          (selectedStock) => selectedStock.tradeId === tradeId
        );
        if (isSelected) {
          setStockDetails([]);
          // Make an API call to set add_to_cart to false for the deselected stock
          axios
            .post(
              `{server.server.baseUrl}api/cart/cart-items/remove/remove-from-cart`,
              { tradeId }
            )
            .then(() => {})
            .catch((error) => {
              console.error("Error removing stock from cart:", error);
            });
        } else {
          const updatedStock = recommendationStock.find(
            (item) => item.tradeId === tradeId
          );
          if (updatedStock) {
            const newStock = {
              user_email: updatedStock.user_email,
              trade_given_by: updatedStock.trade_given_by,
              tradingSymbol:
                (updatedStock.Exchange === "NFO" ||
                  updatedStock.Exchange === "BFO") &&
                broker === "Zerodha"
                  ? updatedStock.zerodhaSymbol
                  : updatedStock.Symbol,
              transactionType: updatedStock.Type,
              exchange: updatedStock.Exchange,
              segment: updatedStock.Segment,
              productType:
                updatedStock.Exchange === "NFO" ||
                updatedStock.Exchange === "BFO"
                  ? "CARRYFORWARD"
                  : updatedStock.ProductType,
              orderType: updatedStock.OrderType,
              price: updatedStock.Price,
              quantity: updatedStock.Quantity,
              priority: updatedStock.Priority || 1,
              tradeId: updatedStock.tradeId,
              user_broker: broker,
            };
            if (
              broker === "Zerodha" &&
              (updatedStock.Exchange === "NFO" ||
                updatedStock.Exchange === "BFO")
            ) {
              try {
                const payload = {
                  userEmail: userEmail, // Include the user's email
                  symbols: [
                    {
                      symbol: updatedStock.Symbol, // Add the symbol from updatedStock
                      transactionType: updatedStock.Type || "BUY", // Set transactionType dynamically, default to "BUY"
                    },
                  ],
                };
                const response = await axios.post(
                  `${server.ccxtServer.baseUrl}zerodha/fno/symbol-lotsize`,
                  payload
                );

                if (response.data && response.data.results) {
                  const lotSizeData = response.data.results.find(
                    (item) => item.previous_symbol === updatedStock.Symbol
                  );
                  console.log("lotsizeData", lotSizeData);
                  if (lotSizeData) {
                    // Update the stock details with the returned symbol and lot size
                    newStock.tradingSymbol = lotSizeData.new_symbol;
                    newStock.quantity = lotSizeData.lotsize * newStock.quantity;
                    console.log("Updated newStock:", newStock);
                  }
                }
              } catch (error) {
                console.error("Error fetching lot size:", error);
              }
            }

            //added section for ddpi check
            const isBuyOrder = action.toUpperCase() === "BUY";
            const isSellOrder = action.toUpperCase() === "SELL";
            updateTradeTypeInLocalStorage(isBuyOrder, isSellOrder);

            if (isSellOrder) {
              console.log("hit 1");

              if (
                userDetails.ddpi_status === "consent" ||
                userDetails.ddpi_status === "physical"
              ) {
                console.log("hit 3");
                setShowDdpiModal(false); // Don't show DDPI Modal
                setOpenZerodhaModel(true); // Show Zerodha Model
                setSingleStockSelectState(true);
                setStockDetails([newStock]);
                return; // Exit to prevent further execution
              }

              if (
                !userDetails.ddpi_status ||
                userDetails.ddpi_status === "empty" ||
                (!["consent", "physical"].includes(userDetails.ddpi_status) &&
                  currentBrokerRejectedCount > 0)
              ) {
                console.log("hit 2");
                setShowDdpiModal(true); // Show DDPI Modal
                return; // Exit to prevent further execution
              }
            }

            if (isBuyOrder) {
              console.log("hit 4");
              setOpenZerodhaModel(true); // Show Zerodha Model for BUY
              setSingleStockSelectState(true);
              setStockDetails((prevStockDetails) => [
                ...prevStockDetails,
                newStock,
              ]);
              return; // Exit to prevent further execution
            }

            // Fallback condition (if none of the above conditions match)
            console.log("hit 5");
            setOpenZerodhaModel(true);
            setSingleStockSelectState(true);
            setStockDetails((prevStockDetails) => [
              ...prevStockDetails,
              newStock,
            ]);

            axios
              .post(`${server.server.baseUrl}api/cart`, {
                tradeId,
                Quantity: updatedStock.Quantity,
              })
              .then((response) => {
                const trade = response.data.trade; //added section for ddpi check
                console.log("Stock added to cart for Zerodha:", response.data);
              })

              .catch((error) => {
                console.error("Error adding stock to cart:", error);
              });
          }
        }
      }
    } else {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      } else {
        const isSelected = stockDetails.some(
          (selectedStock) =>
            selectedStock.Symbol === symbol && selectedStock.tradeId === tradeId
        );

        if (isSelected) {
          setStockDetails([]);
          // Make an API call to set add_to_cart to false for the deselected stock
          axios
            .post(
              `${server.server.baseUrl}api/cart/cart-items/remove/remove-from-cart`,
              { tradeId }
            )
            .then(() => {})
            .catch((error) => {
              console.error("Error removing stock from cart:", error);
            });
        } else {
          const updatedStock = recommendationStock.find(
            (item) => item.Symbol === symbol && item.tradeId === tradeId
          );
          if (updatedStock) {
            const newStock = {
              user_email: updatedStock.user_email,
              trade_given_by: updatedStock.trade_given_by,
              tradingSymbol: updatedStock.Symbol,
              transactionType: updatedStock.Type,
              exchange: updatedStock.Exchange,
              segment: updatedStock.Segment,
              productType:
                updatedStock.Exchange === "NFO" ||
                updatedStock.Exchange === "BFO"
                  ? "CARRYFORWARD"
                  : updatedStock.ProductType,
              orderType: updatedStock.OrderType,
              price: updatedStock.Price,
              quantity: updatedStock.Quantity,
              priority: updatedStock.Priority || 1,
              tradeId: updatedStock.tradeId,
              user_broker: broker,
            };

            if (broker === "Dhan") {
              const singleStockTypeAndSymbol = {
                type: updatedStock.Type,
                symbol: updatedStock.Symbol,
              };
              // onOpenDhanTpinModal(singleStockTypeAndSymbol);
            }

            // console.log("SingleStockTypeAndSymbol",singleStockTypeAndSymbol)

            const isBuyOrder = action.toUpperCase() === "BUY";
            const isSellOrder = action.toUpperCase() === "SELL";
            updateTradeTypeInLocalStorage(isBuyOrder, isSellOrder);

            // Check if broker is Angel One and if stock is not BUY
            if (broker === "Angel One") {
              if (edisStatus && edisStatus.edis === true) {
                if (isBuyOrder) {
                  // Logic for all BUY trades with Angel One
                  console.log("All trades are BUY for Angel One.");
                  setOpenReviewTrade(true);
                  setSingleStockSelectState(true);
                  setStockDetails([newStock]); // Open review trade modal for BUY
                } else if (isSellOrder) {
                  // Logic for all SELL trades with Angel One
                  console.log("All trades are SELL for Angel One.");
                  setOpenReviewTrade(true);
                  setSingleStockSelectState(true);
                  setStockDetails([newStock]); // Open review trade modal for SELL
                }
              } else if (
                edisStatus &&
                edisStatus.edis === false &&
                isSellOrder &&
                currentBrokerRejectedCount > 0
              ) {
                console.log(
                  "edisStatus is missing or not valid for Angel One."
                );
                setShowAngleOneTpinModel(true); // Show TPIN modal if edisStatus is not valid
              } else {
                setStockDetails([newStock]);

                setOpenReviewTrade(true);
                setSingleStockSelectState(true);
              }
            }

            //   }
            else if (broker === "Dhan") {
              if (isBuyOrder) {
                // Logic for all BUY trades with Dhan
                console.log("All trades are BUY for Dhan.");
                setStockDetails([newStock]);

                setOpenReviewTrade(true); // Open the review trade modal for BUY
                setSingleStockSelectState(true);
              } else if (isSellOrder) {
                console.log("hit 1");

                if (dhanEdisStatus?.data?.[0]?.edis === true) {
                  console.log("hit 3");

                  // Logic for SELL trades when `edis` is true
                  console.log(
                    "All trades are SELL for Dhan, and edis is true."
                  );
                  setStockDetails([newStock]);

                  setOpenReviewTrade(true); // Open the review trade modal
                  setSingleStockSelectState(true);
                } else if (
                  dhanEdisStatus?.data?.[0]?.edis === false &&
                  currentBrokerRejectedCount === 0
                ) {
                  setStockDetails([newStock]);
                  setOpenReviewTrade(true);
                  setSingleStockSelectState(true);
                } else if (!userDetails?.is_authorized_for_sell) {
                  console.log("hit 4");

                  // Logic for SELL trades when `edis` is false
                  console.log(
                    "All trades are SELL for Dhan, and edis is false."
                  );
                  setShowDhanTpinModel(true); // Open the TPIN modal
                }
              } else {
                console.log("hit 6");

                // Fallback: Open the review trade modal
                console.log(
                  "Fallback condition met: Opening review trade modal."
                );
                setStockDetails([newStock]);

                setOpenReviewTrade(true);
                setSingleStockSelectState(true);
              }
            } else {
              // If broker is not Angel One, proceed with default behavior
              setStockDetails([newStock]);

              setOpenReviewTrade(true);
              setSingleStockSelectState(true);
            }

            // API call to add stock to cart
            axios
              .post(`${server.server.baseUrl}api/cart`, { tradeId })
              .then((response) => {
                console.log("Stock added to cart:", response.data);
              })
              .catch((error) => {
                console.error("Error adding stock to cart:", error);
              });
          }
        }
      }
    }
  };

  const handleCloseDdpiModal = () => {
    setShowDdpiModal(false);
  };

  const handleLimitOrderInputChange = (symbol, value, tradeId) => {
    let formattedValue = value;

    // Allow only valid numbers with up to two decimal places
    if (value) {
      const regex = /^\d*\.?\d{0,2}$/;
      if (regex.test(value)) {
        formattedValue = value;
      } else {
        return; // If the input value doesn't match the regex, do nothing
      }
    }

    const newData = recommendationStock.map((stock) =>
      stock.Symbol === symbol && stock.tradeId === tradeId
        ? { ...stock, Price: formattedValue }
        : stock
    );
    setRecommendationStock(newData);

    // Update the limit price in the database
    axios
      .post(`${server.server.baseUrl}api/cart/update`, {
        tradeId,
        price: formattedValue,
      })
      .then(() => {
        console.log("Cart updated with new price");
        getCartAllStocks(); // Refresh the cart data if necessary
      })
      .catch((error) => {
        console.error("Error updating cart:", error);
      });
  };

  const [rationaleModal, setRationaleModal] = useState(false);

  const openRationaleModal = () => {
    setRationaleModal(true);
  };

  const closeRationaleModal = () => {
    setRationaleModal(false);
  };
  const alwaysEnabledAdvisors = ["MagnusHathaway"];
  // console.log("advisor_name", recommendationStock[0].advisor_name);
  const advisedRangeCondition =
    // alwaysEnabledAdvisors.includes(recommendationStock?.advisor_name) ||
    (advisedRangeHigher === 0 && advisedRangeLower === 0) ||
    (advisedRangeHigher === null && advisedRangeLower === null) ||
    (advisedRangeHigher > 0 &&
      advisedRangeLower > 0 &&
      parseFloat(advisedRangeHigher) >= parseFloat(ltp) &&
      parseFloat(ltp) >= parseFloat(advisedRangeLower)) ||
    (advisedRangeHigher > 0 &&
      advisedRangeLower === 0 &&
      advisedRangeLower === null &&
      parseFloat(advisedRangeHigher) >= parseFloat(ltp)) ||
    (advisedRangeLower > 0 &&
      advisedRangeHigher === 0 &&
      advisedRangeHigher === null &&
      parseFloat(advisedRangeLower) <= parseFloat(ltp));

  return (
    <div
      key={id}
      className={`relative font-poppins w-full rounded-xl bg-white border-[1px] border-[#000000]/10 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.06)]  py-4`}
    >
      {/* Tooltip Modal  */}

      {rationaleModal && (
        <div className="fixed -inset-[0px] flex items-center justify-center bg-black bg-opacity-75 z-50 px-[10px]">
          <div className="relative">
            <div
              className="absolute right-2 top-4  text-[#000000]/80 font-bold hover:text-[#ff0000] cursor-pointer "
              onClick={closeRationaleModal}
            >
              <XIcon className="w-6 h-6 mr-2" />
            </div>
            <div className="w-full px-4 py-8 sm:w-[550px] md:w-[620px] md:px-10 md:py-10 bg-white  border-[#000000]/20 rounded-md">
              <h3 className=" text-[#000000] text-[18px] lg:text-[28px] font-semibold font-poppins leading-[18px] lg:leading-[24px]">
                Rationale for {symbol}
              </h3>

              <p className=" mt-6 text-[14px] md:text-[16px] text-[#95989C] font-medium font-poppins text-left ">
                {rationale === "" ? (
                  <>
                    This recommendation is based on a comprehensive analysis of
                    the company's growth potential and value metrics. This
                    recommendation also accounts for potential future risks,
                    ensuring a balanced approach to maximizing returns while
                    mitigating uncertainties. Please contact your advisor for
                    any queries.
                  </>
                ) : (
                  rationale
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-col  items-start justify-between  px-5`}>
        <div
          className={`${
            !advisedRangeCondition &&
            !alwaysEnabledAdvisors.includes(
              recommendationStock[0]?.advisor_name
            )
              ? "opacity-60"
              : "opacity-100"
          } w-full group relative flex items-start justify-between text-base text-[#000000]/80  font-poppins font-semibold`}
        >
          {isSkeletonVisible ? (
            <>
              <span>
                <Skeleton height={20} width={80} />
              </span>
            </>
          ) : (
            <div className="flex">
              <p className=" truncate max-w-[250px]"> {symbol} </p>

              <span className="ml-[2px] pt-[3px] text-[10px] text-[#000000]/80 font-normal">
                {exchange}
              </span>

              {symbol.length >= 18 && (
                <div className="hidden group-hover:flex absolute max-w-[250px] top-[24px] text-[13px] left-0 rounded-[4px]  text-center px-3 pt-1 bg-[#ffffff] border-[1px] border-[#000000]/10 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)] text-[#000000]/80 ">
                  <p className="max-w-[250px] text-[#000000]/80"> {symbol} </p>
                  <span className="ml-[2px] pt-[3px] text-[8px] text-[#000000]/80 font-normal">
                    {exchange}
                  </span>
                  <div className="absolute -top-1 left-[20px] transform -translate-x-1/2 w-2 h-2 bg-[#ffffff] border-t-[1px] border-l-[1px] border-[#000000]/10 rotate-45"></div>
                </div>
              )}
            </div>
          )}
          {isSkeletonVisible ? (
            <>
              <span>
                <Skeleton height={25} width={60} />
              </span>
            </>
          ) : (
            <div
              className={`${
                action?.toLowerCase() === "buy"
                  ? "bg-[#16A085]/10 text-[#16A085] "
                  : "bg-[#EA2D3F]/10 text-[#EA2D3F]"
              } flex items-center px-3 py-[1px] rounded-md
            ${
              !advisedRangeCondition &&
              !alwaysEnabledAdvisors.includes(
                recommendationStock[0]?.advisor_name
              )
                ? "opacity-60"
                : "opacity-100"
            } 
            `}
            >
              <span className=" text-[14px] lg:text-[12px] px-2 lg:px-2 py-0  font-poppins font-semibold">
                {action}
              </span>
            </div>
          )}
        </div>

        <div className="w-full flex  items-center justify-between">
          {isLtpLoading ? (
            <Skeleton width={60} height={18} />
          ) : (
            <span
              className={`
              ${
                !advisedRangeCondition &&
                !alwaysEnabledAdvisors.includes(
                  recommendationStock[0]?.advisor_name
                )
                  ? "opacity-60"
                  : "opacity-100"
              } flex text-base text-[#000000]/80  font-poppins font-semibold   items-center`}
            >
              {" "}
              {symbol ? `₹ ${getLTPForSymbol(symbol)}` : "-"}
            </span>
          )}
          <div>
            {!advisedRangeCondition && (
              <div className="opacity-100 flex flex-row justify-end mt-[0px] text-[9px] text-[#E43D3D] font-semibold font-poppins leading-[18px]">
                **Price is out of advised range
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={`${
          !advisedRangeCondition &&
          !alwaysEnabledAdvisors.includes(recommendationStock[0]?.advisor_name)
            ? "opacity-60"
            : "opacity-100"
        } flex items-start mt-[4px] h-[28px]`}
      >
        {isSkeletonVisible ? (
          <div className="flex items-center px-5">
            <Skeleton height={15} width={300} />
          </div>
        ) : (
          <p className="inline-block text-[10px] text-[#95989C] font-normal  px-5">
            <span className=" text-[10px] text-[#000000]/70 font-medium font-poppins">
              Rationale :{" "}
            </span>

            {rationale?.length < 100 ? (
              rationale
            ) : (
              <>
                {rationale?.slice(0, 65)}...
                <span
                  onClick={openRationaleModal}
                  className="cursor-pointer text-[10px] text-[#55A7F1] flex-shrink-0 ml-1"
                >
                  View More
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <div
        className={`${
          !advisedRangeCondition &&
          !alwaysEnabledAdvisors.includes(recommendationStock[0]?.advisor_name)
            ? "opacity-60"
            : "opacity-100"
        } flex w-full   mt-[6px] border-t-[1px] border-b-[1px] border-[#000000]/10 `}
      >
        {isSkeletonVisible ? (
          <>
            <div className="flex flex-col items-start w-1/3 py-1.5 pl-5 lg:pl-5 border-r-[1px] border-[#000000]/10">
              <Skeleton height={10} width={80} />
              <Skeleton height={20} width={30} />
            </div>

            <div className="flex flex-col w-1/3 items-center py-1.5 lg:px-2 border-r-[1px] border-[#000000]/10">
              <Skeleton height={10} width={50} />
              <div className="flex flex-row items-center">
                <Skeleton height={5} width={20} />
                <Skeleton height={15} width={45} className="mx-1" />
                <Skeleton height={5} width={20} />
              </div>
            </div>

            <div className="flex flex-col  w-1/3 items-center py-1.5 lg:px-1 rounded-md">
              <Skeleton height={10} width={80} />
              <Skeleton height={15} width={50} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-start space-y-1 w-1/3  py-1.5 pl-5 lg:pl-5 border-r-[1px] border-[#000000]/10">
              <div className="text-[10px] text-[#000000]/70 font-normal font-poppins capitalize">
                {orderType?.toLowerCase()} Order
              </div>
              <div className="text-[13px] font-poppins font-semibold text-[#000000] ">
                {orderType === "MARKET" ? (
                  "---"
                ) : (
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-[12px] text-gray-500 font-poppins">
                      ₹
                    </span>
                    <input
                      type="text"
                      value={Price}
                      onChange={(e) =>
                        handleLimitOrderInputChange(
                          symbol,
                          e.target.value,
                          tradeId
                        )
                      }
                      className="flex py-1 w-[60%]  h-[20px] font-poppins text-[12px] text-center border border-gray-300 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-1 w-1/3 items-center  py-1.5 lg:px-2  border-r-[1px] border-[#000000]/10">
              <div className="text-[10px] text-[#000000]/70 font-normal font-poppins text-center">
                Quantity
              </div>

              <div className="flex  flex-row items-center   text-[12px] text-[#000000]/80 font-poppins font-semibold">
                <button
                  onClick={() => handleDecreaseStockQty(symbol, tradeId)}
                  disabled={Quantity <= 1}
                  className=" cursor-pointer disabled:cursor-not-allowed hover:bg-black hover:text-white px-1 rounded-[4px]"
                >
                  -
                </button>

                <input
                  type="text"
                  value={Quantity}
                  onChange={(e) =>
                    handleQuantityInputChange(symbol, e.target.value, tradeId)
                  }
                  className="flex flex-1 items-center justify-center  w-[45px] h-[20px] font-poppins text-[12px] mx-1 text-center border border-gray-300 rounded selection:bg-transparent"
                />
                <button
                  onClick={() => handleIncreaseStockQty(symbol, tradeId)}
                  className=" cursor-pointer hover:bg-black hover:text-white px-1 rounded-[4px]"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col space-y-1 w-1/3 items-center   py-1.5 lg:px-1   rounded-md">
              <div className="text-[10px] text-[#000000]/70 font-normal font-poppins">
                Advised Range
              </div>
              <div className="text-[11px] text-[#000000] font-poppins font-semibold">
                {advisedRangeLower && advisedRangeHigher ? (
                  <span>
                    ₹{advisedRangeLower}- ₹{advisedRangeHigher}
                  </span>
                ) : advisedRangeLower ? (
                  <span> ₹{advisedRangeLower}</span>
                ) : advisedRangeHigher ? (
                  <span>₹{advisedRangeHigher}</span>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className={`${
          !advisedRangeCondition &&
          !alwaysEnabledAdvisors.includes(recommendationStock[0]?.advisor_name)
            ? "opacity-60"
            : "opacity-100"
        } flex flex-row items-center justify-between mt-3  pb-1 px-5`}
      >
        <div className="text-[#000000]80 text-xs  font-medium flex flex-row items-center">
          {isSkeletonVisible ? (
            <>
              <Skeleton circle={true} height={16} width={16} />
              <span className="ml-2">
                <Skeleton height={13} width={80} />
              </span>
              <span className="mx-2">
                <Skeleton height={15} width={5} />
              </span>
              <span>
                <Skeleton height={13} width={60} />
              </span>
            </>
          ) : (
            <>
              <CalendarDays size={16} className="" />
              <span className="ml-2">{moment(date).format("Do MMM YYYY")}</span>
              <span className="mx-2">|</span>
              <span>{moment(date).format("HH:mm A")}</span>
            </>
          )}
        </div>
      </div>

      <div
        className={`${
          !advisedRangeCondition &&
          !alwaysEnabledAdvisors.includes(recommendationStock[0]?.advisor_name)
            ? "opacity-60"
            : "opacity-100"
        } flex mt-[6px] px-5`}
      >
        {isSkeletonVisible ? (
          <div className="flex space-x-0.5 w-full">
            <Skeleton width={40} height={29} className="rounded-md" />

            <Skeleton width={120} height={29} className="rounded-md" />

            <Skeleton width={120} height={29} className="rounded-md" />
          </div>
        ) : (
          <>
            {isSelected ? (
              <div className="flex space-x-2 w-full">
                <button
                  className=" flex items-center justify-center bg-gray-200 py-2.5 px-3 rounded-md"
                  onClick={() => {
                    setOpenIgnoreTradeModel(true);
                    setStockIgnoreId(id);
                  }}
                >
                  <BanIcon
                    strokeWidth={2}
                    className="text-[#1D1D1FCC] w-5 h-5 "
                  />
                </button>

                <button
                  className="w-full  py-2.5 px-1 rounded-md bg-white border-[#000000]/20 border-[2px] text-black text-xs sm:text-[15px] lg:text-xs xxl:text-[15px] font-poppins font-medium  "
                  onClick={() => handleSingleSelectStock(tradeId)}
                >
                  Trade Now
                </button>
                <button
                  className="w-full flex items-center justify-center  py-2.5 px-1 rounded-md bg-[#E6626F] text-white text-xs sm:text-[15px] lg:text-xs xxl:text-[15px] font-poppins font-medium  "
                  onClick={() => {
                    handleSelectStock(tradeId);
                  }}
                >
                  <MinusIcon
                    strokeWidth={2}
                    className="text-[#ffffff] w-3 xl:w-5 h-3 xl:h-5 mr-1 lg:mr-0"
                  />
                  Undo Add
                </button>
              </div>
            ) : (
              <div className="flex space-x-1 sm:space-x-2 md:space-x-1 xxl:space-x-2 w-full">
                <button
                  className=" flex items-center justify-center bg-gray-200 py-1 px-3 rounded-md"
                  onClick={() => {
                    setOpenIgnoreTradeModel(true);
                    setStockIgnoreId(id);
                  }}
                >
                  <BanIcon
                    strokeWidth={2}
                    className="text-[#1D1D1FCC] w-5 h-5 "
                  />
                </button>
                {!advisedRangeCondition &&
                !alwaysEnabledAdvisors.includes(
                  recommendationStock[0]?.advisor_name
                ) ? (
                  <button className="cursor-not-allowed w-full  py-2.5 px-1 rounded-md bg-grey border-[#000000]/20 border-[2px] text-black text-xs sm:text-[15px] lg:text-xs xxl:text-[15px] font-poppins font-medium  ">
                    Trade Now
                  </button>
                ) : (
                  <button
                    className="w-full  py-2.5 px-1 rounded-md bg-white border-[#000000]/20 border-[2px] text-black text-xs sm:text-[15px] lg:text-xs xxl:text-[15px] font-poppins font-medium  "
                    onClick={() => handleSingleSelectStock(tradeId)}
                  >
                    Trade Now
                  </button>
                )}
                {!advisedRangeCondition &&
                !alwaysEnabledAdvisors.includes(
                  recommendationStock[0]?.advisor_name
                ) ? (
                  <button className="cursor-not-allowed w-full flex items-center justify-center  py-2 px-1 rounded-md bg-black text-white text-xs sm:text-[15px] lg:text-xs xxl:text-[15px] font-poppins font-medium  ">
                    <PlusIcon
                      strokeWidth={2}
                      className="text-[#ffffff] w-3 xl:w-5 h-3 xl:h-5 mr-1 lg:mr-0"
                    />
                    Add to Cart
                  </button>
                ) : (
                  <button
                    className="w-full flex items-center justify-center  py-2 px-1 rounded-md bg-black text-white text-xs sm:text-[15px] lg:text-xs xxl:text-[15px] font-poppins font-medium "
                    onClick={() => handleSelectStock(tradeId)}
                  >
                    <PlusIcon
                      strokeWidth={2}
                      className="text-[#ffffff] w-3 xl:w-5 h-3 xl:h-5 mr-1 lg:mr-0"
                    />
                    Add to Cart
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {showDdpiModal && (
        <DdpiModal
          isOpen={showDdpiModal}
          setIsOpen={handleCloseDdpiModal}
          userDetails={userDetails}
        />
      )}
    </div>
  );
};

export default NewStockCard;
