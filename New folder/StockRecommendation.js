import React, { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import axios from "axios";
import moment from "moment";
import { Link, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import CryptoJS from "crypto-js";
import { TrendingUp, Loader2, Info } from "lucide-react";

import Checked from "../../assests/checked.svg";
import { auth } from "../../firebase";
import server from "../../utils/serverConfig";

import NewStockCard from "./NewStockCard";
import BasketCard from "./BasketCard/BasketCard";
import BasketModal from "./BasketCard/BasketModal";

import StepGuideScreen from "./StepGuideScreen";
import StepGuideModal from "../RootSection/StepGuideModal";
import ConnectBroker from "../LivePortfolioSection/connectBroker";
import UpdateUserDeatils from "../LivePortfolioSection/UpdateUserDetails";
import ReviewTradeModel from "./ReviewTradeModel";
import useWebSocketCurrentPrice from "../../FunctionCall/useWebSocketCurrentPrice";
import RecommendationSuccessModal from "./RecommendationSuccessModal";
import ZerodhaReviewModal from "./ZerodhaReviewModal";
import { IgnoreTradeModal } from "./IgnoreTradeModal";
import TokenExpireBrokarModal from "../RootSection/TokenExpireBrokarModal";
import IsMarketHours from "../../utils/isMarketHours";
import RebalanceCard from "../ModelPortfolioSection/RebalanceCard";
import UpdateRebalanceModal from "../ModelPortfolioSection/UpdateRebalanceModal";
import { fetchFunds } from "../../FunctionCall/fetchFunds";
import { motion, AnimatePresence } from "framer-motion";
import DdpiModal from "./DdpiModal";
import ActivateNowModel from "./DdpiModal";
import { ActivateTopModel } from "./DdpiModal";
import { AngleOneTpinModal } from "./DdpiModal";
import { DhanTpinModal } from "./DdpiModal";
import { OtherBrokerModel } from "./DdpiModal";
import { AfterPlaceOrderDdpiModal } from "./DdpiModal";
import { FyersTpinModal } from "./DdpiModal";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import PurchasePrompt from "./PurchasePrompt";
import PaymentSuccessModal from "../PricingSection/PaymentSuccessModal";

const style = {
  selected:
    "flex items-center text-[12px] leading-[14px] lg:text-[16px]  font-poppins text-black font-bold lg:leading-[42px] border-b-[3px] border-black cursor-pointer",
  unselected:
    "flex items-center text-[12px] leading-[14px] font-medium font-poppins lg:text-[16px]  text-[#000000]/40 lg:leading-[42px] cursor-pointer",
  firstHeading: "text-sm text-[#00000099] text-left font-medium",
  inputBox:
    "w-full px-6 py-2.5  bg-white text-[18px]  peer text-gray-900 placeholder-transparent  font-medium rounded-md mt-3 ring-[1px] hover:ring-[2px] ring-gray-200    hover:ring-[#D9D9D9] focus:outline-none focus:ring-2 focus:ring-[#D9D9D9]  transition ease-in duration-200  ",

  labelFloat:
    " absolute px-1.5 top-0.5 left-3.5 text-[#808080] bg-white text-[16px] peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:top-6 peer-placeholder-shown:text-[#808080] transition-all peer-focus:top-0.5 peer-focus:text-[#00000099] peer-focus:text-xs",

  selectDiv:
    "flex items-center px-2 py-2 hover:first-of-type:rounded-t-lg hover:last-of-type:rounded-b-lg first-of-type:rounded-t-lg last-of-type:rounded-b-lg md-3 text-gray-900  hover:bg-[#D9D9D9] hover:text-gray-100  transition ease-in duration-200 cursor-pointer",
  inputStartDiv: "relative w-full  ",
};

const BROKER_ENDPOINTS = {
  "IIFL Securities": "iifl",
  Kotak: "kotak",
  Upstox: "upstox",
  "ICICI Direct": "icici",
  "Angel One": "angelone",
  Zerodha: "zerodha",
  Fyers: "fyers",
  AliceBlue: "aliceblue",
  Dhan: "dhan",
};
// Question - where is the 10th broker in the list

const showAdviceStatusDays = process.env.REACT_APP_ADVICE_SHOW_LATEST_DAYS;

const StockRecommendation = ({ getAllTradesUpdate }) => {
  // user details fetch
  const [user] = useAuthState(auth);
  const userEmail = user && user.email;
  const appURL = process.env.REACT_APP_URL;
  const zerodhaApiKey = process.env.REACT_APP_ZERODHA_API_KEY;
  const angelOneApiKey = process.env.REACT_APP_ANGEL_ONE_API_KEY;
  const brokerConnectRedirectURL =
    process.env.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
  const showAdvicePrompt = process.env.REACT_APP_PURCHASE_PROMPT;
  const advisorTag = process.env.REACT_APP_ADVISOR_SPECIFIC_TAG;
  const [userDetails, setUserDetails] = useState();
  const [singleStockTypeAndSymbol, setSingleStockTypeAndSymbol] =
    useState(null);
  const [showDhanTpinModal, setShowDhanTpinModal] = useState(false);

  const getUserDetails = () => {
    axios
      .get(`${server.server.baseUrl}api/user/getUser/${userEmail}`)
      .then((response) => {
        setUserDetails(response.data.User);
      })
      .catch((err) => console.log(err));
  };
  useEffect(() => {
    if (!userEmail) return;
    getUserDetails();
  }, [userEmail, server.server.baseUrl]);

  // BasketTrade Advice
  const [trades, setTrades] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState(null);

  useEffect(() => {
    axios
      .get(
        `${server.server.baseUrl}api/user/trade-reco-for-user?user_email=${userEmail}`
      )
      .then((response) => {
        const filteredTrades = response.data.trades.filter(
          (trade) => trade.Basket === true
        );
        setTrades(filteredTrades);

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching trades:", error);
        setLoading(false);
      });
  }, [userEmail]);

  const handleBasketAccept = (basket) => {
    setSelectedBasket(basket);
    setIsModalOpen(true);
  };
  const uniqueBasketIds = [...new Set(trades.map((trade) => trade.basketId))];
  // Sort baskets by date, latest first
  const sortedBasketIds = uniqueBasketIds.sort((a, b) => {
    const dateA = new Date(trades.find((trade) => trade.basketId === a).date);
    const dateB = new Date(trades.find((trade) => trade.basketId === b).date);
    return dateB - dateA;
  });

  const [brokerModel, setBrokerModel] = useState(null);
  const [brokerStatus, setBrokerStatus] = useState(
    userDetails ? userDetails.connect_broker_status : null
  );

  const [updateUserDetails, setUpdateUserDetails] = useState(false);
  useEffect(() => {
    if (userDetails && userDetails.user_broker !== undefined) {
      setBrokerStatus(userDetails && userDetails?.connect_broker_status);
    }
  }, [userDetails, brokerStatus]);

  // all recommendation filtered by date
  const [stockRecoNotExecuted, setStockRecoNotExecuted] = useState([]);
  const [ignoredTrades, setIgnoredTrades] = useState([]);
  const hasFetchedTrades = useRef(false);

  const getAllTrades = () => {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - showAdviceStatusDays);

    let config = {
      method: "get",
      url: `${server.server.baseUrl}api/user/trade-reco-for-user?user_email=${userEmail}`,
    };

    axios
      .request(config)
      .then((response) => {
        const filteredTrades = response?.data?.trades.filter((trade) => {
          const tradeDate = new Date(trade?.date); // Ensure reco_date is in a compatible format
          return (
            trade?.trade_place_status === "recommend" && tradeDate >= cutoffDate
          );
        });
        setStockRecoNotExecuted(filteredTrades);

        const filteredIgnoredTrades = response?.data?.trades.filter((trade) => {
          const tradeDate = new Date(trade?.date); // Ensure reco_date is in a compatible format
          return (
            trade?.trade_place_status === "ignored" && tradeDate >= cutoffDate
          );
        });
        setIgnoredTrades(filteredIgnoredTrades);
      })
      .catch((error) => {
        setStockRecoNotExecuted([]);
        setIgnoredTrades([]);
      });
  };
  useEffect(() => {
    if (!userEmail || hasFetchedTrades.current) return;
    hasFetchedTrades.current = true; // Mark as fetched
    getAllTrades();
  }, []);

  const [stockDetails, setStockDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const clientCode = userDetails && userDetails?.clientCode;
  const apiKey = userDetails && userDetails?.apiKey;
  const jwtToken = userDetails && userDetails?.jwtToken;

  const my2pin = userDetails && userDetails?.my2Pin;
  const secretKey = userDetails && userDetails?.secretKey;
  const viewToken = userDetails && userDetails?.viewToken;
  const sid = userDetails && userDetails?.sid;
  const serverId = userDetails && userDetails?.serverId;

  const panNumber = userDetails && userDetails?.panNumber;
  const [mobileNumber, setMobileNumber] = useState(
    userDetails ? userDetails?.phone_number : null
  );
  const [broker, setBroker] = useState("");
  const [openReviewTrade, setOpenReviewTrade] = useState(false);
  const [openSuccessModal, setOpenSucessModal] = useState(false);
  const [orderPlacementResponse, setOrderPlacementResponse] = useState();
  const [openTokenExpireModel, setOpenTokenExpireModel] = useState(null);
  const [storeDDpiStatus, setStoreDDpiStatus] = useState("");

  const [types, setTypes] = useState([]);

  useEffect(() => {
    if (userDetails) {
      setBroker(userDetails.user_broker);
      setMobileNumber(userDetails?.phone_number);
    }
  }, [userDetails]);

  const dateString = userDetails && userDetails.token_expire;
  // Format the moment object as desired
  const expireTokenDate = moment(dateString).format("YYYY-MM-DD HH:mm:ss");

  const today = new Date();
  const todayDate = moment(today).format("YYYY-MM-DD HH:mm:ss");
  const userId = userDetails && userDetails._id;
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
      console.error("Error during decryption:", error.message);
      return null;
    }
  };

  const updatePortfolioData = async (brokerName, userEmail) => {
    try {
      const endpoint = BROKER_ENDPOINTS[brokerName];
      if (!endpoint) {
        console.error(`Unsupported broker: ${brokerName}`);
        return;
      }

      const config = {
        method: "post",
        url: `${server.ccxtServer.baseUrl}${endpoint}/user-portfolio`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ user_email: userEmail }),
      };

      return await axios.request(config);
    } catch (error) {
      console.error(`Error updating portfolio for ${brokerName}:`, error);
    }
  };
  const [isReturningFromOtherBrokerModal, setIsReturningFromOtherBrokerModal] =
    useState(false);

  const [failedSellAttempts, setFailedSellAttempts] = useState(0);

  const placeOrder = async () => {
    setLoading(true);

    // Prepare the payload based on broker
    const getOrderPayload = () => {
      const basePayload = {
        trades: stockDetails,
        user_broker: broker, // Add user_broker to identify the broker
      };

      switch (broker) {
        case "IIFL Securities":
          return {
            ...basePayload,
            clientCode,
          };
        case "ICICI Direct":
          return {
            ...basePayload,
            apiKey,
            secretKey,
            jwtToken,
          };
        case "Upstox":
          return {
            ...basePayload,
            apiKey,
            jwtToken,
            secretKey,
          };
        case "Kotak":
          return {
            ...basePayload,
            apiKey,
            secretKey,
            jwtToken,
            viewToken,
            sid,
            serverId,
          };
        case "Hdfc Securities":
          return {
            ...basePayload,
            apiKey,
            jwtToken,
          };
        case "Dhan":
          return {
            ...basePayload,
            clientCode,
            jwtToken,
          };
        case "AliceBlue":
          return {
            ...basePayload,
            clientCode,
            jwtToken,
            apiKey,
          };
        case "Fyers":
          return {
            ...basePayload,
            clientCode,
            jwtToken,
          };

        case "Angel One":
          return {
            ...basePayload,
            apiKey: angelOneApiKey,
            secretKey,
            jwtToken,
          };

        default:
          return {
            ...basePayload,
            apiKey,
            jwtToken,
          };
      }
    };
    const allBuy = stockDetails.every(
      (stock) => stock.transactionType === "BUY"
    );
    const allSell = stockDetails.every(
      (stock) => stock.transactionType === "SELL"
    );
    const isMixed = !allBuy && !allSell;

    const specialBrokers = [
      // "Dhan",
      "IIFL Securities",
      "ICICI Direct",
      "Upstox",
      "Kotak",
      "Hdfc Securities",
      "AliceBlue",
    ];

    if (!isReturningFromOtherBrokerModal && specialBrokers.includes(broker)) {
      if (allBuy) {
        console.log("All trades are BUY for broker:", broker);
        // Proceed with order placement for BUY
      } else if ((allSell || isMixed) && !userDetails?.is_authorized_for_sell) {
        console.log(
          allSell ? "All trades are SELL" : "Trades are Mixed",
          "for broker:",
          broker
        );

        setShowOtherBrokerModel(true);
        setOpenReviewTrade(false);
        setLoading(false);
        return; // Exit the function early
      }
    }

    try {
      const response = await axios.request({
        method: "post",
        url: `${server.server.baseUrl}api/process-trades/order-place`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(getOrderPayload()),
      });

      setOrderPlacementResponse(response.data.response);
      setLoading(false);

      const rejectedSellCount = response.data.response.reduce(
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

      // UPDATED: Calculate success count only for SELL or mixed trades
      const successCount = response.data.response.reduce((count, order) => {
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
          (order.transactionType === "SELL" || tradeType.isMixed)
          ? count + 1
          : count;
      }, 0);

      const currentBroker = userDetails?.user_broker;
      if (!isReturningFromOtherBrokerModal && specialBrokers.includes(broker)) {
        if (allBuy) {
          // Proceed with order placement for BUY
          setOpenSucessModal(true);
          setOpenReviewTrade(false);
        } else if (
          (allSell || isMixed) &&
          !userDetails?.is_authorized_for_sell &&
          rejectedSellCount >= 1
        ) {
          setShowOtherBrokerModel(true);
          setOpenReviewTrade(false);
          setLoading(false);
          return; // Exit the function early
        } else {
          setOpenSucessModal(true);
          setOpenReviewTrade(false);
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
          dhanEdisStatus &&
          dhanEdisStatus?.data?.[0]?.edis === false &&
          (allSell || isMixed) &&
          userDetails?.is_authorized_for_sell === false
        ) {
          setShowDhanTpinModel(true);
          setOpenReviewTrade(false);
          return;
        } else {
          setOpenSucessModal(true);
          setOpenReviewTrade(false);
          try {
            await axios.put(`${server.server.baseUrl}api/update-edis-status`, {
              uid: userDetails?._id,
              ddpi_enabled: true,
              user_broker: userDetails?.user_broker,
            });
            // Optionally, update the state to reflect the changes in the UI
            getUserDetails();
          } catch (error) {
            console.error("Error adding stocks to cart", error);
          }
        }
      }

      setOpenReviewTrade(false);

      await Promise.all([
        updatePortfolioData(broker, userEmail),
        getAllTrades(),
        getAllTradesUpdate && getAllTradesUpdate(),
        getCartAllStocks(),
      ]);
    } catch (error) {
      console.error("Error placing order:", error);
      setLoading(false);
      toast.error(
        "There was an issue in placing the trade, please try again after sometime or contact your advisor",
        {
          duration: 6000,
          style: {
            background: "white",
            color: "#e43d3d",
            maxWidth: "500px",
            fontWeight: "bolder",
            fontSize: "14px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#e43d3d",
            secondary: "#FFFAEE",
          },
        }
      );
    }
    setIsReturningFromOtherBrokerModal(false);
  };

  const [isStepGuideLoading, setIsStepGuideLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStepGuideLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const [showStepGuideModal, setShowStepGuideModal] = useState(false);
  // ignore trade
  const [openIgnoreTradeModel, setOpenIgnoreTradeModel] = useState(false);
  const [stockIgnoreId, setStockIgnoreId] = useState();
  const [ignoreLoading, setIgnoreLoading] = useState(false);
  const [ignoreText, setIgnoreText] = useState("");
  const handleIgnoredTrades = (id) => {
    setIgnoreLoading(true);
    const tradeToIgnore = stockRecoNotExecuted.find(
      (trade) => trade._id === id
    );

    let data = JSON.stringify({
      uid: id,
      trade_place_status: "ignored",
      reason: ignoreText,
    });

    // Second API request to place the order
    let orderConfig = {
      method: "put",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(orderConfig)
      .then((response) => {
        toast.success(`You have successfully ignored ${tradeToIgnore.Symbol}`, {
          duration: 5000,
          style: {
            background: "white",
            color: "#1e293b",
            maxWidth: "500px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "10px 20px",
            fontFamily: "Poppins",
          },
          iconTheme: {
            primary: "#16a085",
            secondary: "#FFFAEE",
          },
        });
        setIgnoreLoading(false);
        setOpenIgnoreTradeModel(false);
        getAllTrades();
      })
      .catch((error) => {
        console.error(`Error placing order for stock `, error);
        setLoading(false);
      });
  };

  const { getLTPForSymbol } = useWebSocketCurrentPrice(stockRecoNotExecuted);

  const calculateTotalAmount = () => {
    let totalAmount = 0;
    stockDetails.forEach((ele) => {
      if (ele.transactionType === "BUY") {
        const ltp = getLTPForSymbol(ele.tradingSymbol); // Get LTP for current symbol
        if (ltp !== "-") {
          totalAmount += parseFloat(ltp) * ele.quantity; // Calculate total amount for this trade
        }
      }
    });
    return totalAmount.toFixed(2); // Return total amount formatted to 2 decimal places
  };

  const [openZerodhaModel, setOpenZerodhaModel] = useState(false);
  const [selectedLength, setSelectedLength] = useState();
  const [singleStockSelectState, setSingleStockSelectState] = useState(false);
  const [stockTypeAndSymbol, setStockTypeAndSymbol] = useState([]);

  const getCartAllStocks = () => {
    let config = {
      method: "get",
      url: `${server.server.baseUrl}api/cart/${userEmail}?trade_place_status=recommend`,
    };

    axios
      .request(config)
      .then((response) => {
        const transformedStockDetails = response?.data?.map((stock) => ({
          user_email: stock.user_email,
          trade_given_by: stock.trade_given_by,
          tradingSymbol:
            (stock.Exchange === "NFO" || stock.Exchange === "BFO") &&
            broker === "Zerodha"
              ? stock.zerodhaSymbol
              : stock.Symbol,
          transactionType: stock.Type,
          exchange: stock.Exchange,
          segment: stock.Segment,
          productType:
            stock.Exchange === "NFO" || stock.Exchange === "BFO"
              ? "CARRYFORWARD"
              : stock.ProductType,
          orderType: stock.OrderType,
          price: stock.Price,
          quantity: stock.Quantity,
          priority: stock.Priority,
          tradeId: stock.tradeId,
          user_broker: broker, // Assuming you want to set this from the existing context
        }));

        // Extract and store all Types to use this in handletrade

        const extractedTypes = response?.data?.map((stock) => stock.Type);
        setTypes(extractedTypes);

        setStockDetails(transformedStockDetails);
        setSelectedLength(transformedStockDetails);

        const hasSell = extractedTypes.some((type) => type === "SELL");
        const hasBuy = extractedTypes.some((type) => type === "BUY");
        const allSell = hasSell && !hasBuy;
        const allBuy = hasBuy && !hasSell;
        const isMixed = hasSell && hasBuy;

        const newTradeType = {
          allSell: allSell,
          allBuy: allBuy,
          isMixed: isMixed,
        };

        setTradeType(newTradeType);
        localStorage.setItem("storedTradeType", JSON.stringify(newTradeType));

        const typeAndSymbol = response?.data?.map((stock) => ({
          Symbol: stock.Symbol,
          Type: stock.Type,
          Exchange: stock.Exchange,
        }));
        setStockTypeAndSymbol(typeAndSymbol);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (!userEmail) return;
    if (userEmail) {
      getCartAllStocks();
    }
  }, [userEmail]);

  const handleSelectAllStocks = async () => {
    const newStockDetails = stockRecoNotExecuted.reduce((acc, stock) => {
      const isSelected = stockDetails.some(
        (selectedStock) => selectedStock.tradeId === stock.tradeId
      );

      if (!isSelected) {
        const ltp = getLTPForSymbol(stock.Symbol);
        const advisedRangeLower = stock.Advised_Range_Lower;
        const advisedRangeHigher = stock.Advised_Range_Higher;

        const shouldDisableTrade =
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

        if (shouldDisableTrade) {
          const newStock = {
            user_email: stock.user_email,
            trade_given_by: stock.trade_given_by,
            tradingSymbol: stock.Symbol,
            transactionType: stock.Type,
            exchange: stock.Exchange,
            segment: stock.Segment,
            productType: stock.ProductType,
            orderType: stock.OrderType,
            price: stock.Price,
            quantity: stock.Quantity,
            priority: stock.Priority,
            tradeId: stock.tradeId,
            user_broker: broker,
          };
          acc.push(newStock);
        }
      }
      setIsSelectAllLoading(false);

      return acc;
    }, []);

    if (newStockDetails.length > 0) {
      setIsSelectAllLoading(true);

      try {
        await axios.post(
          `${server.server.baseUrl}api/cart/add/add-multiple-to-cart`,
          {
            stocks: newStockDetails,
          }
        );
        // Optionally, update the state to reflect the changes in the UI
        getCartAllStocks();
      } catch (error) {
        console.error("Error adding stocks to cart", error);
      } finally {
        setIsSelectAllLoading(false);
      }
    }
  };

  const handleRemoveAllSelectedStocks = async () => {
    setIsSelectAllLoading(true);
    try {
      // Use all stock details in the cart for removal
      const stocksToRemove = [...stockDetails];

      if (stocksToRemove.length > 0) {
        await axios.post(
          `${server.server.baseUrl}api/cart/cart-items/remove/multiple/remove-multiple-from-cart`,
          {
            stocks: stocksToRemove,
          }
        );

        // Clear stockDetails since all stocks are removed
        setStockDetails([]);
        getCartAllStocks(); // Refresh the cart
      }
    } catch (error) {
      console.error("Error removing stocks from cart", error);
    } finally {
      setIsSelectAllLoading(false);
    }
  };

  const [authToken, setAuthToken] = useState(null);
  const location = useLocation();

  const [zerodhaStatus, setZerodhaStatus] = useState(null);
  // icici
  const [apiSession, setApiSession] = useState(null);
  // upstox code
  const [upstoxCode, setUpstoxCode] = useState(null);

  // const zerodha Login
  const [zerodhaRequestToken, setZerodhaRequestToken] = useState(null);
  const [zerodhaRequestType, setZerodhaRequestType] = useState(null);

  // hdfc
  const [hdfcRequestToken, setHdfcRequestToken] = useState(null);
  // fyers
  const [fyersAuthCode, setFyersAuthCode] = useState(null);
  useEffect(() => {
    // Parse the query string
    const queryParams = new URLSearchParams(location.search);
    // Get the auth_token
    const token = queryParams.get("auth_token");
    // Set the auth token state
    setAuthToken(token);
    const zerodhaStatus = queryParams.get("status");
    setZerodhaStatus(zerodhaStatus);
    const icicApiSession = queryParams.get("apisession");
    setApiSession(icicApiSession);
    const getUpstoxCode = queryParams.get("code");
    setUpstoxCode(getUpstoxCode);
    const zerodhaRequestLoginToken = queryParams.get("request_token");
    setZerodhaRequestToken(zerodhaRequestLoginToken);
    const zerodhaLoginType = queryParams.get("type");
    setZerodhaRequestType(zerodhaLoginType);
    const hdfcrequestTokenLogin = queryParams.get("requestToken");
    setHdfcRequestToken(hdfcrequestTokenLogin);
    const authCodeFyers = queryParams.get("auth_code");
    setFyersAuthCode(authCodeFyers);
  }, [location.search]);

  // zerodha start

  const handleZerodhaRedirect = async () => {
    localStorage.setItem(
      "stockDetailsZerodhaOrder",
      JSON.stringify(stockDetails)
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
        price: stock.price,
      };

      // Get the LTP for the current stock
      const ltp = getLTPForSymbol(stock.tradingSymbol);

      // If LTP is available and not '-', use it as the price
      if (ltp !== "-") {
        baseOrder.price = parseFloat(ltp);
      }

      // If it's a LIMIT order, use the LTP as the price
      if (stock.orderType === "LIMIT") {
        // For LIMIT orders, always use the limit price specified
        baseOrder.price = parseFloat(stock.price || 0);
      } else if (stock.orderType === "MARKET") {
        // For MARKET orders, get LTP
        const ltp = getLTPForSymbol(stock.tradingSymbol);
        if (ltp !== "-") {
          baseOrder.price = parseFloat(ltp);
        } else {
          baseOrder.price = 0; // Default price for market orders
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
    redirectParams.value = `${appURL}=true`;

    form.appendChild(apiKeyInput);
    form.appendChild(dataInput);
    form.appendChild(redirectParams);

    document.body.appendChild(form);

    const currentISTDateTime = new Date();
    try {
      // Update the database with the current IST date-time
      await axios.put(`${server.server.baseUrl}api/zerodha/update-trade-reco`, {
        stockDetails: stockDetails,
        leaving_datetime: currentISTDateTime,
      });

      // Submit the form after the database is updated
      form.submit();
    } catch (error) {
      console.error("Failed to update trade recommendation:", error);
    }
  };

  const [zerodhaStockDetails, setZerodhaStockDetails] = useState(null);
  const [zerodhaAdditionalPayload, setZerodhaAdditionalPayload] =
    useState(null);

  useEffect(() => {
    // Check for pending order data in localStorage
    const pendingOrderData = localStorage.getItem("stockDetailsZerodhaOrder");
    if (pendingOrderData) {
      setZerodhaStockDetails(JSON.parse(pendingOrderData));
    }
    const payloadData = localStorage.getItem("additionalPayload");
    if (payloadData) {
      setZerodhaAdditionalPayload(JSON.parse(payloadData));
    }
  }, []);

  const checkZerodhaStatus = async () => {
    const currentISTDateTime = new Date();
    const istDatetime = moment(currentISTDateTime).format();

    if (zerodhaStatus === "success" && zerodhaRequestType === "basket") {
      try {
        let data = JSON.stringify({
          apiKey: zerodhaApiKey,
          jwtToken: jwtToken,
          userEmail: userEmail,
          returnDateTime: istDatetime,
          trades: zerodhaStockDetails,
        });

        const config = {
          method: "post",
          url: `${server.server.baseUrl}api/zerodha/order-place`,
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };

        // Use await instead of .then()
        const response = await axios.request(config);
        const rejectedSellCount = response.data.response.reduce(
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

        // UPDATED: Calculate success count only for SELL or mixed trades
        const successCount = response.data.response.reduce((count, order) => {
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
            (order.transactionType === "SELL" || tradeType.isMixed)
            ? count + 1
            : count;
        }, 0);

        const successKey = `successCount${broker?.replace(/ /g, "")}`;
        const currentRejectedCount = parseInt(
          localStorage.getItem("rejectedKey") || "0"
        );
        const newRejectedCount = currentRejectedCount + rejectedSellCount;
        localStorage.setItem("rejectedKey", newRejectedCount.toString());

        if (
          newRejectedCount === 1 &&
          successCount > 0 &&
          (tradeType.allSell || tradeType.isMixed)
        ) {
          const currentSuccessCount = parseInt(
            localStorage.getItem(successKey) || "0"
          );
          const newSuccessCount = currentSuccessCount + successCount;
          localStorage.setItem(successKey, newSuccessCount.toString());
        }
        setOrderPlacementResponse(response.data.response);
        if (
          !userDetails?.ddpi_status ||
          userDetails?.ddpi_status === "empty" ||
          (!["consent", "physical"].includes(userDetails?.ddpi_status) &&
            (allSell || isMixed) &&
            newRejectedCount === 1)
        ) {
          setOpenSucessModal(false);
          setShowDdpiModal(true);
        } else {
          setOpenSucessModal(true);
        }
        setOpenReviewTrade(false);
        await getAllTrades();
        try {
          const config = {
            method: "post",
            url: `${server.ccxtServer.baseUrl}zerodha/user-portfolio`,
            headers: {
              "Content-Type": "application/json",
            },
            data: JSON.stringify({ user_email: userEmail }),
          };
          return await axios.request(config);
        } catch (error) {
          console.error(`Error updating portfolio for`, error);
        }
        localStorage.removeItem("stockDetailsZerodhaOrder");
      } catch (error) {
        toast.error("Something went wrong. Please try again.", {
          duration: 5000,
          style: {
            background: "white",
            color: "#e43d3d",
            maxWidth: "500px",
            fontWeight: "bolder",
            fontSize: "14px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#e43d3d",
            secondary: "#FFFAEE",
          },
        });
      }
    }
  };

  useEffect(() => {
    if (
      zerodhaStatus === "success" &&
      zerodhaRequestType === "basket" &&
      jwtToken !== undefined
    ) {
      checkZerodhaStatus();
    }
  }, [zerodhaStatus, zerodhaRequestType, userEmail, jwtToken]);

  // icici direct start
  const [sessionToken, setSessionToken] = useState(null);
  const [iciciSuccessMsg, setIciciSuccessMsg] = useState(false);

  const hasConnectedIcici = useRef(false);
  const connectIciciDirect = () => {
    if (apiSession !== null && apiKey && !hasConnectedIcici.current) {
      let data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        sessionToken: apiSession,
      });

      let config = {
        method: "post",
        url: `${server.ccxtServer.baseUrl}icici/customer-details`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios
        .request(config)
        .then((response) => {
          if (response.data.Status === 200) {
            const session_token = response.data.Success.session_token;
            setSessionToken(session_token);
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("Something went wrong. Please try again.", {
            duration: 3000,
            style: {
              background: "white",
              color: "#e43d3d",
              maxWidth: "500px",
              fontWeight: "bolder",
              fontSize: "14px",
              padding: "10px 20px",
            },
            iconTheme: {
              primary: "#e43d3d",
              secondary: "#FFFAEE",
            },
          });
        });
      hasConnectedIcici.current = true;
    }
  };

  useEffect(() => {
    if (apiSession) {
      connectIciciDirect();
    }
  }, [apiSession, userDetails]);

  // upstox start
  const [upstoxSessionToken, setUpstoxSessionToken] = useState(null);
  const hasConnectedUpstox = useRef(false);

  const connectUpstox = () => {
    if (
      upstoxCode !== null &&
      apiKey &&
      secretKey &&
      !hasConnectedUpstox.current
    ) {
      let data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        apiSecret: checkValidApiAnSecret(secretKey),
        code: upstoxCode,
        redirectUri: brokerConnectRedirectURL,
      });

      let config = {
        method: "post",
        url: `${server.ccxtServer.baseUrl}upstox/gen-access-token`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios
        .request(config)
        .then((response) => {
          if (response.data) {
            const session_token = response.data.access_token;
            setUpstoxSessionToken(session_token);
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("Something went wrong. Please try again.", {
            duration: 3000,
            style: {
              background: "white",
              color: "#e43d3d",
              maxWidth: "500px",
              fontWeight: "bolder",
              fontSize: "14px",
              padding: "10px 20px",
            },
            iconTheme: {
              primary: "#e43d3d",
              secondary: "#FFFAEE",
            },
          });
        });
      hasConnectedUpstox.current = true;
    }
  };

  useEffect(() => {
    if (upstoxCode) {
      connectUpstox();
    }
  }, [upstoxCode, userDetails]);

  // zerodha start
  const [zerodhaAccessToken, setZerodhaAccessToken] = useState(null);
  const hasConnectedZerodha = useRef(false);
  const connectZerodha = () => {
    if (
      zerodhaRequestToken !== null &&
      zerodhaRequestType === "login" &&
      !hasConnectedZerodha.current
    ) {
      let data = JSON.stringify({
        apiKey: zerodhaApiKey,
        apiSecret: "u4lw9zhl3iqafay2s6salc800bs8pzjd",
        requestToken: zerodhaRequestToken,
      });

      let config = {
        method: "post",
        url: `${server.ccxtServer.baseUrl}zerodha/gen-access-token`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios
        .request(config)
        .then((response) => {
          if (response.data) {
            const session_token = response.data.access_token;
            setZerodhaAccessToken(session_token);
            setStoreDDpiStatus(response.data.meta.demat_consent);
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("Something went wrong. Please try again.", {
            duration: 3000,
            style: {
              background: "white",
              color: "#e43d3d",
              maxWidth: "500px",
              fontWeight: "bolder",
              fontSize: "14px",
              padding: "10px 20px",
            },
            iconTheme: {
              primary: "#e43d3d",
              secondary: "#FFFAEE",
            },
          });
        });
      hasConnectedZerodha.current = true;
    }
  };

  useEffect(() => {
    if (zerodhaRequestToken && zerodhaRequestType) {
      connectZerodha();
    }
  }, [zerodhaRequestToken, zerodhaRequestType, userDetails]);

  // hdfc
  const [hdfcSessionToken, setHdfcSessionToken] = useState(null);
  const hasConnectedHdfc = useRef(false);
  const connectHdfc = () => {
    if (hdfcRequestToken && apiKey && secretKey && !hasConnectedHdfc.current) {
      try {
        const apiKeyDecrypted = checkValidApiAnSecret(apiKey);
        const secretKeyDecrypted = checkValidApiAnSecret(secretKey);

        if (!apiKeyDecrypted || !secretKeyDecrypted) {
          throw new Error("Failed to decrypt API Key or Secret Key.");
        }

        const data = JSON.stringify({
          apiKey: apiKeyDecrypted,
          apiSecret: secretKeyDecrypted,
          requestToken: hdfcRequestToken,
        });

        console.log("HDFC Data Payload:", data);

        const config = {
          method: "post",
          url: `${server.ccxtServer.baseUrl}hdfc/access-token`,
          headers: { "Content-Type": "application/json" },
          data: data,
        };

        axios
          .request(config)
          .then((response) => {
            const session_token = response.data.accessToken;
            setHdfcSessionToken(session_token);
          })
          .catch((error) => {
            console.error("Axios Error:", error);
            toast.error("Something went wrong. Please try again.");
          });

        hasConnectedHdfc.current = true;
      } catch (error) {
        console.error("Connection Error:", error.message);
      }
    }
  };

  useEffect(() => {
    if (hdfcRequestToken !== null && apiKey && secretKey) {
      connectHdfc();
    }
  }, [hdfcRequestToken, userDetails]);

  // fyers
  const [fyersAccessToken, setFyersAccessToken] = useState(null);
  const hasConnectedFyers = useRef(false);
  const connectFyers = () => {
    if (
      fyersAuthCode !== null &&
      clientCode &&
      secretKey &&
      !hasConnectedFyers.current
    ) {
      let data = JSON.stringify({
        clientId: clientCode,
        clientSecret: checkValidApiAnSecret(secretKey),
        authCode: fyersAuthCode,
      });

      let config = {
        method: "post",
        url: `${server.ccxtServer.baseUrl}fyers/gen-access-token`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios
        .request(config)
        .then((response) => {
          if (response.data) {
            const session_token = response.data.accessToken;
            setFyersAccessToken(session_token);
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("Something went wrong. Please try again.", {
            duration: 3000,
            style: {
              background: "white",
              color: "#e43d3d",
              maxWidth: "500px",
              fontWeight: "bolder",
              fontSize: "14px",
              padding: "10px 20px",
            },
            iconTheme: {
              primary: "#e43d3d",
              secondary: "#FFFAEE",
            },
          });
        });
      hasConnectedFyers.current = true;
    }
  };

  useEffect(() => {
    if (fyersAuthCode !== null && clientCode && secretKey) {
      connectFyers();
    }
  }, [fyersAuthCode, userDetails]);

  const isToastShown = useRef(false);

  const connectBrokerDbUpadte = () => {
    if (
      sessionToken ||
      upstoxSessionToken ||
      authToken ||
      hdfcSessionToken ||
      fyersAccessToken ||
      (zerodhaAccessToken && zerodhaRequestType === "login")
    ) {
      if (!isToastShown.current) {
        isToastShown.current = true; // Prevent further execution
        let brokerData = {
          uid: userId,
          user_broker: sessionToken
            ? "ICICI Direct"
            : upstoxSessionToken
            ? "Upstox"
            : authToken
            ? "Angel One"
            : hdfcSessionToken
            ? "Hdfc Securities"
            : fyersAccessToken
            ? "Fyers"
            : "Zerodha",
          jwtToken:
            sessionToken ||
            upstoxSessionToken ||
            zerodhaAccessToken ||
            hdfcSessionToken ||
            fyersAccessToken ||
            authToken,
          ddpi_status: storeDDpiStatus,
        };

        if (authToken) {
          brokerData = {
            ...brokerData,
            apiKey: angelOneApiKey,
          };
        }

        let config = {
          method: "put",
          url: `${server.server.baseUrl}api/user/connect-broker`,
          headers: {
            "Content-Type": "application/json",
          },
          data: JSON.stringify(brokerData),
        };

        axios
          .request(config)
          .then((response) => {
            setLoading(false);
            setIciciSuccessMsg(true);
            setOpenTokenExpireModel(false);
            setBrokerModel(false);
            axios
              .put(
                `${server.ccxtServer.baseUrl}comms/no-broker-required/save`,
                {
                  userEmail: userEmail,
                  noBrokerRequired: false,
                }
              )
              .then((res) => {
                getUserDetails();
              })
              .catch((err) => {});
            // making new API call to update all model PF brokers
            let newBrokerData = {
              user_email: userEmail,
              user_broker: sessionToken
                ? "ICICI Direct"
                : upstoxSessionToken
                ? "Upstox"
                : authToken
                ? "Angel One"
                : hdfcSessionToken
                ? "Hdfc Securities"
                : fyersAccessToken
                ? "Fyers"
                : "Zerodha",
            };
            let A1_broker = {
              method: "post",
              url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
              headers: {
                "Content-Type": "application/json",
              },
              data: JSON.stringify(newBrokerData),
            };
          })
          .catch((error) => {
            console.log(error);
            setLoading(false);
            toast.error("Incorrect credentials. Please try again.", {
              duration: 5000,
              style: {
                background: "white",
                color: "#e43d3d",
                maxWidth: "500px",
                fontWeight: "bolder",
                fontSize: "14px",
                padding: "10px 20px",
              },
              iconTheme: {
                primary: "#e43d3d",
                secondary: "#FFFAEE",
              },
            });
          });
      }
    }
  };

  useEffect(() => {
    if (
      userId !== undefined &&
      (sessionToken ||
        upstoxSessionToken ||
        authToken ||
        hdfcSessionToken ||
        fyersAccessToken ||
        (zerodhaAccessToken && zerodhaRequestType === "login"))
    ) {
      connectBrokerDbUpadte();
    }
  }, [
    userId,
    sessionToken,
    upstoxSessionToken,
    zerodhaAccessToken,
    authToken,
    hdfcSessionToken,
    fyersAccessToken,
  ]);

  const closeLoginSuccessModal = () => {
    setIciciSuccessMsg(false);
    getUserDetails();
    window.history.pushState({}, "", "/stock-recommendation");
  };

  const [funds, setFunds] = useState({});

  const getAllFunds = async () => {
    const fetchedFunds = await fetchFunds(
      broker,
      clientCode,
      apiKey,
      jwtToken,
      secretKey,
      sid,
      viewToken,
      serverId
    );
    if (fetchedFunds) {
      setFunds(fetchedFunds);
    } else {
      console.error("Failed to fetch funds.");
    }
  };

  useEffect(() => {
    if (broker && (clientCode || jwtToken)) {
      getAllFunds();
    }
  }, [broker, clientCode, apiKey, jwtToken, secretKey]);

  const [edisStatus, setEdisStatus] = useState(null);
  const [dhanEdisStatus, setDhanEdisStatus] = useState(null);
  const [zerodhaDdpiStatus, setZerodhaDdpiStatus] = useState(null);

  //fetching edis status for AngleOne

  useEffect(() => {
    if (userDetails && userDetails.user_broker === "Angel One") {
      const verifyEdis = async () => {
        try {
          const response = await axios.post(
            `${server.ccxtServer.baseUrl}angelone/verify-edis`,
            {
              apiKey: angelOneApiKey,
              jwtToken: userDetails.jwtToken,
              userEmail: userDetails?.email,
            }
          );
          setEdisStatus(response.data);
        } catch (error) {
          console.error("Error verifying eDIS status:", error);
        }
      };

      verifyEdis();
    }
  }, [userDetails]);

  // console.log("EdisStatus",edisStatus?.edis)

  //fetching edis status for Dhan

  useEffect(() => {
    if (userDetails && userDetails.user_broker === "Dhan") {
      const verifyDhanEdis = async () => {
        try {
          const response = await axios.post(
            `${server.ccxtServer.baseUrl}dhan/edis-status`,
            {
              clientId: clientCode,
              accessToken: userDetails.jwtToken,
            }
          );
          // console.log("Dhan Reponse", response.data);

          setDhanEdisStatus(response.data);
        } catch (error) {
          console.error("Error verifying eDIS status:", error);
        }
      };

      verifyDhanEdis();
    }
  }, [userDetails]);

  // console.log("edis status",dhanEdisStatus)

  useEffect(() => {
    if (userDetails && userDetails.user_broker === "Zerodha") {
      const verifyZerodhaDdpi = async () => {
        try {
          const response = await axios.post(
            `${server.ccxtServer.baseUrl}zerodha/save-ddpi-status`,
            {
              apiKey: zerodhaApiKey,
              accessToken: userDetails.jwtToken,
              userEmail: userDetails.email,
            }
          );
          setZerodhaDdpiStatus(response.data);
        } catch (error) {
          console.error("Error verifying eDIS status:", error);
        }
      };

      verifyZerodhaDdpi();
    }
  }, [userDetails]);

  useEffect(() => {
    if (userDetails && userDetails.user_broker === "Zerodha") {
      const verifyZerodhaEdis = async () => {
        try {
          const response = await axios.post(
            `${server.ccxtServer.baseUrl}zerodha/save-edis-status`,
            {
              userEmail: userDetails?.email,
              edis: userDetails?.tpin_enabled,
            }
          );

          setZerodhaDdpiStatus(response.data);
        } catch (error) {
          console.error("Error verifying eDIS status:", error);
        }
      };

      verifyZerodhaEdis();
    }
  }, [userDetails]);

  const [showDdpiModal, setShowDdpiModal] = useState(false);
  const [showActivateNowModel, setActivateNowModel] = useState(false);
  const [showAngleOneTpinModel, setShowAngleOneTpinModel] = useState(false);
  const [showFyersTpinModal, setShowFyersTpinModal] = useState(false);
  const [showDhanTpinModel, setShowDhanTpinModel] = useState(false);
  const [showOtherBrokerModel, setShowOtherBrokerModel] = useState(false);
  const [showActivateTopModel, setActivateTopModel] = useState(false);
  const [storedTradeType, setStoredTradeType] = useState(() => {
    const savedTradeType = localStorage.getItem("storedTradeType");
    return savedTradeType
      ? JSON.parse(savedTradeType)
      : { allSell: false, allBuy: false, isMixed: false };
  });

  const updateTradeType = (newTradeType) => {
    setTradeType(newTradeType);
    setStoredTradeType(newTradeType);
    localStorage.setItem("storedTradeType", JSON.stringify(newTradeType));
  };
  const openReviewModal = () => {
    setOpenReviewTrade(true);
  };

  const [tradeType, setTradeType] = useState({
    allSell: false,
    allBuy: false,
    isMixed: false,
  });

  const [tradeClickCount, setTradeClickCount] = useState(0);
  useEffect(() => {
    if (types.length > 0) {
      const hasSell = types.some((type) => type === "SELL");
      const hasBuy = types.some((type) => type === "BUY");
      const allSell = hasSell && !hasBuy;
      const allBuy = hasBuy && !hasSell;
      const isMixed = hasSell && hasBuy;

      const newTradeType = {
        allSell: allSell,
        allBuy: allBuy,
        isMixed: isMixed,
      };

      updateTradeType(newTradeType);
    } else {
      updateTradeType(storedTradeType);
    }
  }, [types]);

  const handleTrade = () => {
    setTradeClickCount((prevCount) => prevCount + 1);

    getAllFunds();
    const isFundsEmpty = funds?.status === false || funds?.status ===1;

    const isMarketHours = IsMarketHours();

    const currentBroker = userDetails?.user_broker;
    const currentBrokerRejectedCount = parseInt(
      localStorage.getItem(
        `rejectedCount${currentBroker?.replace(/ /g, "")}`
      ) || "0"
    );

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
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      }
      // If not funds empty, proceed with Zerodha-specific logic
      if (allBuy) {
        setOpenZerodhaModel(true);
      } else if (tradeType?.allSell || tradeType?.isMixed) {
        // Handle DDPI modal logic for SELL or mixed trades
        if (
          !userDetails?.ddpi_status ||
          userDetails?.ddpi_status === "empty" ||
          (!["consent", "physical"].includes(userDetails?.ddpi_status) &&
            currentBrokerRejectedCount > 0)
        ) {
          setShowDdpiModal(true); // Show DDPI Modal for invalid or missing status
          setOpenZerodhaModel(false); // Ensure Zerodha modal is closed
        } else {
          setShowDdpiModal(false); // Hide DDPI Modal
          setOpenZerodhaModel(true); // Proceed with Zerodha modal
        }
      }
    } else if (broker === "Angel One") {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      } else if (edisStatus && edisStatus.edis === true) {
        setOpenReviewTrade(true); // Open review trade modal for all cases
      } else if (
        edisStatus &&
        edisStatus.edis === false &&
        (allSell || isMixed) &&
        currentBrokerRejectedCount > 0
      ) {
        setShowAngleOneTpinModel(true); // Show TPIN modal for invalid edis
      } else {
        setOpenReviewTrade(true);
      }
    } else if (broker === "Dhan") {
      // Check if DDPI status is null or not present
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      } else if (dhanEdisStatus && dhanEdisStatus.data[0].edis === true) {
        setOpenReviewTrade(true); // Open review trade modal for all cases
      } else if ((allSell || isMixed) && !userDetails?.is_authorized_for_sell) {
        console.log("edisStatus is missing or not valid for Dhan.");
        setShowDhanTpinModel(true);
      } else {
        setOpenReviewTrade(true);
      }
    } else if (broker === "Fyers") {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      }
      // setShowFyersTpinModal(true);
    } else {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      } else {
        setOpenReviewTrade(true);
      }
      // Fallback for brokers not mentioned above
    }
  };

  const handleCloseDdpiModal = () => {
    setShowDdpiModal(false);
  };

  const handleProceedWithTpin = () => {
    setShowDdpiModal(false);

    setOpenZerodhaModel(true);
  };

  const handleActivateDDPI = () => {
    setActivateNowModel(false);
  };

  const filteredAdvcideRangeStocks = stockRecoNotExecuted.filter((ele) => {
    const ltp = getLTPForSymbol(ele.Symbol);
    const advisedRangeLower = parseFloat(ele.Advised_Range_Lower);
    const advisedRangeHigher = parseFloat(ele.Advised_Range_Higher);

    return (
      (advisedRangeHigher === 0 && advisedRangeLower === 0) ||
      (advisedRangeHigher === null && advisedRangeLower === null) ||
      (advisedRangeHigher > 0 &&
        advisedRangeLower > 0 &&
        parseFloat(advisedRangeHigher) > parseFloat(ltp) &&
        parseFloat(ltp) > parseFloat(advisedRangeLower)) ||
      (advisedRangeHigher > 0 &&
        advisedRangeLower === 0 &&
        advisedRangeLower === null &&
        parseFloat(advisedRangeHigher) > parseFloat(ltp)) ||
      (advisedRangeLower > 0 &&
        advisedRangeHigher === 0 &&
        advisedRangeHigher === null &&
        parseFloat(advisedRangeLower) < parseFloat(ltp))
    );
  });

  const handleOpenReviewModal = () => {
    setOpenReviewTrade(false);
    setSingleStockSelectState(false);
    getCartAllStocks();
    // resetTradeType();
  };

  const handleOpenZerodhaModal = () => {
    setOpenZerodhaModel(false);
    setSingleStockSelectState(false);
    getCartAllStocks();
    // resetTradeType();
  };

  const [modelPortfolioStrategy, setModelPortfolioStrategy] = useState([]);

  const getModelPortfolioStrategyDetails = () => {
    if (userEmail) {
      axios
        .get(
          `${server.server.baseUrl}api/model-portfolio/subscribed-strategies/${userEmail}`
        )
        .then((response) => {
          setModelPortfolioStrategy(response.data);
        })
        .catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    if (!userEmail) return;
    getModelPortfolioStrategyDetails();
  }, [userEmail]);

  const [openRebalanceModal, setOpenRebalanceModal] = useState(false);
  const [calculatedPortfolioData, setCaluculatedPortfolioData] = useState([]);
  const [modelPortfolioModelId, setModelPortfolioModelId] = useState();
  const [storeModalName, setStoreModalName] = useState();
  const modelNames = modelPortfolioStrategy.map((item) => item.model_name);
  const [modelPortfolioRepairTrades, setModelPortfolioRepairTrades] = useState(
    []
  );
  const hasCalledRebalanceRepair = useRef(false);
  const getRebalanceRepair = () => {
    let repairData = JSON.stringify({
      modelName: modelNames,
      advisor: modelPortfolioStrategy[0]["advisor"],
      userEmail: userEmail,
      userBroker: broker,
    });
    let config2 = {
      method: "post",
      url: `${server.ccxtServer.baseUrl}rebalance/get-repair`,
      headers: {
        "Content-Type": "application/json",
      },
      data: repairData,
    };
    axios
      .request(config2)
      .then((response) => {
        setModelPortfolioRepairTrades(response.data.models);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (
      modelPortfolioStrategy.length !== 0 &&
      !hasCalledRebalanceRepair.current
    ) {
      hasCalledRebalanceRepair.current = true; // Mark as called
      getRebalanceRepair();
    }
  }, [modelPortfolioStrategy]);

  const handleCloseTradeSuccessModal = () => {
    if (broker === "Zerodha") {
      setOpenSucessModal(false);
      window.history.pushState({}, "", "/stock-recommendation");
    } else if (
      userDetails?.user_broker === "Angel One" &&
      userDetails?.ddpi_enabled === true
    ) {
      setOpenSucessModal(false);
    } else {
      setOpenSucessModal(false);
      // setShowAfterPlaceOrderDdpiModal(true);
    }

    // if (userDetails) {
    //   if (userDetails.ddpi_status === null) {
    //     setActivateNowModel(true);
    //   } else if (
    //     userDetails.ddpi_status !== "consent" &&
    //     userDetails.ddpi_status !== "physical"
    //   ) {
    //     setActivateNowModel(true);
    //   }
    // }
  };

  const checkZerodhaStatusRebalance = () => {
    const currentISTDateTime = new Date();
    const istDatetime = moment(currentISTDateTime).format();
    if (
      zerodhaStatus !== null &&
      zerodhaAdditionalPayload !== null &&
      zerodhaStockDetails !== null &&
      zerodhaRequestType === "rebalance"
    ) {
      let data = JSON.stringify({
        apiKey: zerodhaApiKey,
        accessToken: jwtToken,
        user_email: userEmail,
        user_broker: zerodhaAdditionalPayload.broker,
        modelName: zerodhaAdditionalPayload.modelName,
        advisor: zerodhaAdditionalPayload.advisor,
        model_id: zerodhaAdditionalPayload.model_id,
        unique_id: zerodhaAdditionalPayload.unique_id,
        returnDateTime: istDatetime,
        trades: zerodhaStockDetails,
      });

      let config = {
        method: "post",
        url: `${server.ccxtServer.baseUrl}rebalance/process-trade`,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios
        .request(config)
        .then((response) => {
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

          // UPDATED: Calculate success count only for SELL or mixed trades
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
              (order.transactionType === "SELL" || tradeType.isMixed)
              ? count + 1
              : count;
          }, 0);

          const successKey = `successCount${broker?.replace(/ /g, "")}`;
          const currentRejectedCount = parseInt(
            localStorage.getItem("rejectedKey") || "0"
          );
          const newRejectedCount = currentRejectedCount + rejectedSellCount;
          localStorage.setItem("rejectedKey", newRejectedCount.toString());

          if (
            newRejectedCount === 1 &&
            successCount > 0 &&
            (tradeType.allSell || tradeType.isMixed)
          ) {
            const currentSuccessCount = parseInt(
              localStorage.getItem(successKey) || "0"
            );
            const newSuccessCount = currentSuccessCount + successCount;
            localStorage.setItem(successKey, newSuccessCount.toString());
          }

          setOrderPlacementResponse(response.data.results);
          if (
            !userDetails?.ddpi_status ||
            userDetails?.ddpi_status === "empty" ||
            (!["consent", "physical"].includes(userDetails?.ddpi_status) &&
              (allSell || isMixed) &&
              newRejectedCount === 1)
          ) {
            setOpenSucessModal(false);
            setShowDdpiModal(true);
          } else {
            setOpenSucessModal(true);
          }
          getAllTrades();
          const updateData = {
            modelId: zerodhaAdditionalPayload.model_id,
            orderResults: response.data.results,
            modelName: zerodhaAdditionalPayload.modelName,
            userEmail: userEmail,
          };

          return axios.post(
            `${server.server.baseUrl}api/model-portfolio-db-update`,
            updateData
          );
        })
        .then(() => {
          localStorage.removeItem("stockDetailsZerodhaOrder");
          localStorage.removeItem("zerodhaAdditionalPayload");
        })
        .catch((error) => {
          console.error(error);
          toast.error("Something went wrong. Please try again.", {
            duration: 5000,
            style: {
              background: "white",
              color: "#e43d3d",
              maxWidth: "500px",
              fontWeight: "bolder",
              fontSize: "14px",
              padding: "10px 20px",
            },
            iconTheme: {
              primary: "#e43d3d",
              secondary: "#FFFAEE",
            },
          });
        });
    }
  };

  useEffect(() => {
    if (
      zerodhaStatus !== null &&
      zerodhaAdditionalPayload !== null &&
      zerodhaStockDetails !== null &&
      zerodhaRequestType === "rebalance" &&
      jwtToken !== undefined
    ) {
      checkZerodhaStatusRebalance();
    }
  }, [zerodhaStatus, zerodhaRequestType, userEmail, jwtToken]);
  const [isSelectAllLoading, setIsSelectAllLoading] = useState(false);

  const renderTopDDPIActivationSection = () => {
    if (!userDetails) {
      return null;
    }

    if (userDetails.user_broker === "Zerodha") {
      if (
        userDetails.ddpi_status === "ddpi" ||
        userDetails.ddpi_status === "physical"
      ) {
        return null;
      }
      return <ActivateTopModel userDetails={userDetails} />;
    }

    if (userDetails?.user_broker === "Angel One") {
      if (userDetails?.ddpi_enabled === true) {
        return null;
      }
      return <ActivateTopModel userDetails={userDetails} />;
    }

    if (userDetails.user_broker === "Dhan") {
      // console.log('Dhan status',dhanEdisStatus && dhanEdisStatus?.data?.[0]?.edis)
      // if (dhanEdisStatus && dhanEdisStatus?.data?.edis === true) {

      if (dhanEdisStatus && dhanEdisStatus?.data?.[0]?.edis === true) {
        return null;
      }
      return <ActivateTopModel userDetails={userDetails} />;
    }

    return null;
  };
  // console.log("edisStatus.edis",edisStatus.edis)

  const [showAfterPlaceOrderDdpiModal, setShowAfterPlaceOrderDdpiModal] =
    useState(false);
  const handleAfterPlaceOrderDdpiModalClose = () => {
    setShowAfterPlaceOrderDdpiModal(false);
  };

  const hasBuy = types.every((type) => type === "BUY");
  const hasSell = types.every((type) => type === "SELL");
  const allSell = hasSell && !hasBuy;
  const allBuy = hasBuy && !hasSell;
  const isMixed = hasSell && hasBuy;

  const handleOpenDhanTpinModal = (stockTypeAndSymbol) => {
    setSingleStockTypeAndSymbol(stockTypeAndSymbol);
    setShowDhanTpinModal(true);
  };

  const [selectNonBroker, setSelectNonBroker] = useState(false);

  const [showPurchasePrompt, setShowPurchasePrompt] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  useEffect(() => {
    if (userDetails?.created_at) {
      const createdAt = moment(userDetails?.created_at);
      const today = moment();
      const daysSinceCreation = today.diff(createdAt, "days");
      const hasSeenPrompt = userDetails?.hasSeenPromptOneTimePurchase;
      if (daysSinceCreation <= 3 && hasSeenPrompt === true) {
        setShowPurchasePrompt(true);
        console.log("Setting showPurchasePrompt to true");
      }
    }
  }, [userDetails?.created_at]);

  const handleDismiss = () => {
    setShowPurchasePrompt(false);
    const adviceData = {
      email: userDetails?.email,
      hasSeenPromptOneTimePurchase: false,
    };
    let config = {
      method: "post",
      url: `${server.server.baseUrl}api/stocks-list/update-user`,
      headers: {
        "Content-Type": "application/json",
      },
      data: adviceData,
    };

    axios
      .request(config)
      .then((response) => {
        getUserDetails();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // console.log("userDetails",userDetails);

  const [allStocks, setAllStocks] = useState([]);
  const getAllStocksList = () => {
    axios
      .get(`${server.server.baseUrl}api/stocks-list/${advisorTag}`)
      .then((response) => {
        setAllStocks(response?.data?.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getAllStocksList();
  }, []);

  const handleSendAdvice = () => {
    const adviceData = allStocks.map((entry) => {
      // Format country code - ensure it starts with '+'
      let formattedCountryCode = String(
        userDetails?.country_code || "+91"
      ).trim();
      formattedCountryCode =
        formattedCountryCode.charAt(0) === "+"
          ? formattedCountryCode
          : "+" + formattedCountryCode;

      return {
        email: userDetails?.email,
        userName: userDetails?.clientName,
        phoneNumber: mobileNumber,
        country_code: formattedCountryCode, // Use formatted country code
        trade_given_by: entry?.trade_given_by,
        advisor_name: entry?.advisor,
        Symbol: entry?.Symbol,
        Exchange: entry?.Exchange,
        Type: entry?.Type,
        OrderType: entry?.OrderType,
        ProductType: entry?.ProductType,
        Segment: entry?.segment,
        Price: entry.Price,
        date: moment(new Date()).format(),
        Quantity: entry.Quantity,
        Advised_Range_Lower: entry?.Advised_Range_Lower,
        Advised_Range_Higher: entry?.Advised_Range_Higher,
        rationale: entry?.rationale,
        comments: entry?.comments,
        comment2: entry?.comments2,
        advisorType: entry?.advisorType,
        price_when_send_advice: entry?.price_when_send_advice,
        group: entry?.group,
      };
    });

    let config = {
      method: "post",
      url: `${server.ccxtServer.baseUrl}comms/send-reco`,
      headers: {
        "Content-Type": "application/json",
      },
      data: adviceData,
    };

    axios
      .request(config)
      .then((response) => {
        getAllTrades();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const shouldShowPurchasePrompt =
    userDetails &&
    showPurchasePrompt &&
    showAdvicePrompt &&
    userDetails?.previous_stocks_advice_needed &&
    !userDetails?.previous_stocks_advice_purchased;

  const [withoutBrokerModal, setWithoutBrokerModal] = useState(false);

  const reopenRebalanceModal = () => {
    setOpenRebalanceModal(true);
  };

  return (
    <div className="flex flex-col relative  w-full max-h-[calc(100vh-60px)] md:min-h-screen  bg-[#f9f9f9]">
      {renderTopDDPIActivationSection()}

      <Toaster position="top-center" reverseOrder={true} />
      {stockRecoNotExecuted?.length !== 0 ||
      modelPortfolioStrategy?.length !== 0 ? (
        <div
          className={`flex flex-col  w-full min-h-screen  bg-[#f9f9f9] lg:pt-4 ${
            renderTopDDPIActivationSection() ? "pb-10" : ""
          }`}
        >
          <div className="px-0 lg:px-[50px]  flex flex-row items-center lg:items-center  md:justify-between  h-[70px] md:h-[60px] font-poppins">
            <div className="flex flex-col md:my-4 px-2 md:px-0">
              <div className="px-4 text-[18px] lg:px-0 text-balck lg:text-[22px] leading-[30px] font-sans font-bold">
                Investment Advice(s)
              </div>
              {ignoredTrades && ignoredTrades.length > 0 ? (
                <div className=" px-4 lg:px-0 flex  md:items-center   ">
                  <div className="text-[#000000]/70 text-[12px] lg:text-[15px]  font-poppins l:leading-[22px] font-normal">
                    To view all ignored trades.
                    <Link
                      to={"/ignore-trades"}
                      className="ml-1  text-[#55A7F1] text-[12px] lg:text-[15px] font-normal font-poppins cursor-pointer"
                    >
                      Click here
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="px-4 lg:px-0 text-sm text-[#000000]/70 leading-[20px] font-light font-poppins">
                  Investment advice to guide your next move.
                </div>
              )}
            </div>

            <div className="flex flex-row items-center space-x-3">
              {stockRecoNotExecuted.length !== 0 && (
                <>
                  {filteredAdvcideRangeStocks.length === stockDetails.length ? (
                    <button
                      onClick={handleRemoveAllSelectedStocks}
                      disabled={isSelectAllLoading}
                      className="text-xs md:text-lg py-2 hidden md:inline-flex md:px-6 text-[#000000] font-medium font-poppins border-[1px] border-[#000000]/20 rounded-md cursor-pointer items-center justify-center min-w-[150px] min-h-[45px]"
                    >
                      {isSelectAllLoading ? (
                        <Loader2 className="h-5 w-5 text-black animate-spin stroke-[3px]" />
                      ) : (
                        "Deselect All"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSelectAllStocks}
                      disabled={isSelectAllLoading}
                      className="text-xs md:text-lg py-2 hidden md:inline-flex md:px-6 text-[#000000] font-medium font-poppins border-[1px] border-[#000000]/20 rounded-md cursor-pointer items-center justify-center min-w-[150px] min-h-[45px]"
                    >
                      {isSelectAllLoading ? (
                        <Loader2 className="h-5 w-5 text-black animate-spin stroke-[3px]" />
                      ) : (
                        "Select All"
                      )}
                    </button>
                  )}
                </>
              )}

              <button
                className="min-w-[90px] lg:w-[150px] hidden md:block disabled:bg-[#000000]/30 disabled:cursor-not-allowed px-6 py-2 bg-black text-xs md:text-lg lg:px-4 lg:py-2 text-white font-medium rounded-md cursor-pointer"
                onClick={handleTrade}
                disabled={stockDetails?.length === 0}
              >
                <div className="flex flex-row justify-center items-center space-x-2">
                  {" "}
                  <TrendingUp className=" w-4 h-4 lg:h-5 lg:w-5" />
                  <span>Trade</span>
                  {singleStockSelectState === true ? (
                    <span className="font-medium mt-0.5 md:mt-1">
                      (
                      {(stockDetails?.length || 0) +
                        (selectedLength?.length || 0)}
                      )
                    </span>
                  ) : (
                    stockDetails?.length > 0 && (
                      <span className="font-medium mt-0.5 md:mt-1">
                        ({stockDetails?.length})
                      </span>
                    )
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="h-[calc(100vh-170px)] overflow-auto  md:overflow-auto md:h-auto pb-[40px]  md:pb-0 w-full">
            {/* <div className=" overflow-scroll pb-3 sm:pb-0 gap-y-4 custom-scroll md:overflow-auto w-full grid  px-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-2  md:gap-x-3 xl:grid-cols-3 lg:gap-4 lg:pt-6 lg:px-[50px]">
            {loading ? (
        <p>Loading...</p>
      ) : (
        sortedBasketIds.map((basketId, index) => {
          const basketTrades = trades.filter(trade => trade.basketId === basketId);
          const basket = basketTrades[0];
          const date = basketTrades[0].date;
          return (
            <BasketCard
              key={index}
              basketName={basket.basketName}
              lastUpdated={basket.lastUpdated}
              description={basket.description}
              basketId={basket.basketId}
              trades={basketTrades} 
              onAccept={() => handleBasketAccept(basket)}
              loading={loading}
              date={date}

            />
          );
        })
      )}
      {selectedBasket && (
        <BasketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          basketName={selectedBasket.basketName}
          lastUpdated={selectedBasket.lastUpdated}
          description={selectedBasket.description}
          basketId={selectedBasket.basketId}
          trades={trades.filter(t => t.basketId === selectedBasket.basketId)}
          onAccept={() => handleBasketAccept(selectedBasket)}
          loading={loading}
          funds={funds}

        />
      )}
      </div>            */}

            {modelPortfolioStrategy?.length !== 0 &&
            stockRecoNotExecuted?.length !== 0 ? (
              <div className="h-full  w-full grid gap-y-4 pb-4 px-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:gap-y-6 md:gap-x-3 xl:grid-cols-3 lg:gap-4 lg:pt-6 lg:px-[50px]  lg:pb-12">
                {modelPortfolioStrategy?.length !== 0 &&
                  modelPortfolioStrategy
                    ?.sort(
                      (a, b) =>
                        new Date(b.last_updated) - new Date(a.last_updated)
                    )
                    .map((ele, i) => {
                      const allRebalances = ele?.model?.rebalanceHistory || [];

                      const sortedRebalances = allRebalances?.sort(
                        (a, b) =>
                          new Date(b.rebalanceDate) - new Date(a.rebalanceDate)
                      );
                      const latest = sortedRebalances[0];
                      if (!latest) return null;

                      // If there's no latest unexecuted rebalance, don't render anything
                      const userExecution = latest?.subscriberExecutions?.find(
                        (execution) => execution?.user_email === userEmail
                      );

                      // If the user has already executed this rebalance, don't render anything
                      if (
                        userExecution &&
                        userExecution.status === "executed"
                      ) {
                        return null;
                      }

                      const matchingFailedTrades =
                        modelPortfolioRepairTrades?.find(
                          (trade) =>
                            trade.modelId === latest?.model_Id &&
                            trade.failedTrades.length !== 0
                        );

                      return (
                        <RebalanceCard
                          userDetails={userDetails}
                          key={i}
                          data={latest}
                          allRebalances={allRebalances}
                          sortedRebalances={sortedRebalances}
                          frequency={ele.frequency}
                          setOpenRebalanceModal={setOpenRebalanceModal}
                          modelName={ele?.model_name}
                          overView={ele?.overView}
                          userEmail={userEmail}
                          apiKey={apiKey}
                          jwtToken={jwtToken}
                          secretKey={secretKey}
                          clientCode={clientCode}
                          broker={broker}
                          sid={sid}
                          viewToken={viewToken}
                          serverId={serverId}
                          advisorName={ele?.advisor}
                          setCaluculatedPortfolioData={
                            setCaluculatedPortfolioData
                          }
                          repair={matchingFailedTrades ? "repair" : null}
                          matchingFailedTrades={matchingFailedTrades}
                          setModelPortfolioModelId={setModelPortfolioModelId}
                          setStoreModalName={setStoreModalName}
                          isInitialRebalance={allRebalances.length === 1}
                          setBrokerModel={setBrokerModel}
                          funds={funds}
                          setOpenTokenExpireModel={setOpenTokenExpireModel}
                          getUserDetails={getUserDetails}
                          setBroker={setBroker}
                          selectNonBroker={selectNonBroker}
                          setSelectNonBroker={setSelectNonBroker}
                          withoutBrokerModal={withoutBrokerModal}
                          setWithoutBrokerModal={setWithoutBrokerModal}
                          setStockTypeAndSymbol={setStockTypeAndSymbol}
                        />
                      );
                    })}
                {stockRecoNotExecuted
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((ele, i) => {
                    return (
                      <div key={i}>
                        <NewStockCard
                          id={ele._id}
                          isSelected={stockDetails.some(
                            (stock) => stock.tradeId === ele.tradeId
                          )}
                          symbol={ele.Symbol}
                          Price={ele.Price}
                          date={ele.date}
                          Quantity={ele.Quantity}
                          action={ele.Type}
                          orderType={ele.OrderType}
                          exchange={ele.Exchange}
                          segment={ele.Segment}
                          cmp={ele.CMP}
                          advisedRangeLower={ele.Advised_Range_Lower}
                          advisedRangeHigher={ele.Advised_Range_Higher}
                          tradeId={ele.tradeId}
                          rationale={ele?.rationale}
                          recommendationStock={
                            stockRecoNotExecuted && stockRecoNotExecuted
                          }
                          setRecommendationStock={setStockRecoNotExecuted}
                          setStockDetails={setStockDetails}
                          stockDetails={stockDetails}
                          setOpenReviewTrade={setOpenReviewTrade}
                          setOpenIgnoreTradeModel={setOpenIgnoreTradeModel}
                          setStockIgnoreId={setStockIgnoreId}
                          getLTPForSymbol={getLTPForSymbol}
                          setOpenTokenExpireModel={setOpenTokenExpireModel}
                          todayDate={todayDate}
                          expireTokenDate={expireTokenDate}
                          brokerStatus={brokerStatus}
                          setBrokerModel={setBrokerModel}
                          getUserDetails={getUserDetails}
                          setOpenZerodhaModel={setOpenZerodhaModel}
                          broker={broker}
                          funds={funds?.data?.availablecash}
                          getCartAllStocks={getCartAllStocks}
                          setSingleStockSelectState={setSingleStockSelectState}
                          getAllFunds={getAllFunds}
                          userDetails={userDetails}
                          edisStatus={edisStatus}
                          setShowAngleOneTpinModel={setShowAngleOneTpinModel}
                          dhanEdisStatus={dhanEdisStatus}
                          setShowDhanTpinModel={setShowDhanTpinModel}
                          setShowDdpiModal={setShowDdpiModal}
                          setTradeType={setTradeType}
                        />
                      </div>
                    );
                  })}
              </div>
            ) : modelPortfolioStrategy?.length === 0 &&
              stockRecoNotExecuted?.length !== 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-scroll custom-scrollbar md:overflow-auto w-full grid gap-y-4 pb-4 px-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:gap-y-6 md:gap-x-3 xl:grid-cols-3 lg:gap-4 lg:pt-6 lg:px-[50px]  lg:pb-12"
                >
                  {stockRecoNotExecuted
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((ele, i) => {
                      return (
                        <div key={i}>
                          <NewStockCard
                            id={ele._id}
                            isSelected={stockDetails.some(
                              (stock) => stock.tradeId === ele.tradeId
                            )}
                            symbol={ele.Symbol}
                            Price={ele.Price}
                            date={ele.date}
                            Quantity={ele.Quantity}
                            action={ele.Type}
                            orderType={ele.OrderType}
                            exchange={ele.Exchange}
                            segment={ele.Segment}
                            cmp={ele.CMP}
                            advisedRangeLower={ele.Advised_Range_Lower}
                            advisedRangeHigher={ele.Advised_Range_Higher}
                            tradeId={ele.tradeId}
                            rationale={ele?.rationale}
                            recommendationStock={
                              stockRecoNotExecuted && stockRecoNotExecuted
                            }
                            userDetails={userDetails}
                            setRecommendationStock={setStockRecoNotExecuted}
                            setStockDetails={setStockDetails}
                            stockDetails={stockDetails}
                            setOpenReviewTrade={setOpenReviewTrade}
                            setOpenIgnoreTradeModel={setOpenIgnoreTradeModel}
                            setStockIgnoreId={setStockIgnoreId}
                            getLTPForSymbol={getLTPForSymbol}
                            setOpenTokenExpireModel={setOpenTokenExpireModel}
                            todayDate={todayDate}
                            expireTokenDate={expireTokenDate}
                            brokerStatus={brokerStatus}
                            setBrokerModel={setBrokerModel}
                            getUserDetails={getUserDetails}
                            setOpenZerodhaModel={setOpenZerodhaModel}
                            broker={broker}
                            funds={funds?.data?.availablecash}
                            getCartAllStocks={getCartAllStocks}
                            setSingleStockSelectState={
                              setSingleStockSelectState
                            }
                            getAllFunds={getAllFunds}
                            tradeType={tradeType}
                            onOpenDhanTpinModal={handleOpenDhanTpinModal}
                            dhanEdisStatus={dhanEdisStatus}
                            rejectedCount={parseInt(
                              localStorage.getItem(
                                `rejectedCount${broker?.replace(/ /g, "")}`
                              ) || "0"
                            )}
                            setShowOtherBrokerModel={setShowOtherBrokerModel}
                            isReturningFromOtherBrokerModal={
                              isReturningFromOtherBrokerModal
                            }
                            setIsReturningFromOtherBrokerModal={
                              setIsReturningFromOtherBrokerModal
                            }
                          />
                        </div>
                      );
                    })}
                </motion.div>
              </AnimatePresence>
            ) : (
              stockRecoNotExecuted?.length === 0 && (
                <>
                  {/* <div className=" overflow-scroll custom-scroll md:overflow-auto w-full grid  px-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-2  md:gap-x-3 xl:grid-cols-3 lg:gap-4 lg:pt-6 lg:px-[50px]">
                <BasketCard/>
                </div> */}
                  <div className="h-full overflow-scroll custom-scrollbar md:overflow-auto w-full grid gap-y-4 pb-4 px-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:gap-y-6 md:gap-x-3 xl:grid-cols-3 lg:gap-4 lg:pt-6 lg:px-[50px]  lg:pb-12">
                    {modelPortfolioStrategy?.length !== 0 &&
                      modelPortfolioStrategy
                        ?.sort(
                          (a, b) =>
                            new Date(b.last_updated) - new Date(a.last_updated)
                        )
                        .map((ele, i) => {
                          const allRebalances =
                            ele?.model?.rebalanceHistory || [];

                          const sortedRebalances = allRebalances?.sort(
                            (a, b) =>
                              new Date(b.rebalanceDate) -
                              new Date(a.rebalanceDate)
                          );
                          const latest = sortedRebalances[0];

                          if (!latest) return null;

                          // If there's no latest unexecuted rebalance, don't render anything
                          const userExecution =
                            latest?.subscriberExecutions?.find(
                              (execution) => execution?.user_email === userEmail
                            );

                          // If the user has already executed this rebalance, don't render anything
                          if (
                            userExecution &&
                            userExecution.status === "executed"
                          ) {
                            return null;
                          }

                          const matchingFailedTrades =
                            modelPortfolioRepairTrades?.find(
                              (trade) =>
                                trade.modelId === latest?.model_Id &&
                                trade.failedTrades.length !== 0
                            );

                          return (
                            <RebalanceCard
                              userDetails={userDetails}
                              key={i}
                              data={latest}
                              allRebalances={allRebalances}
                              sortedRebalances={sortedRebalances}
                              frequency={ele.frequency}
                              setOpenRebalanceModal={setOpenRebalanceModal}
                              modelName={ele?.model_name}
                              overView={ele?.overView}
                              userEmail={userEmail}
                              apiKey={apiKey}
                              jwtToken={jwtToken}
                              secretKey={secretKey}
                              clientCode={clientCode}
                              broker={broker}
                              sid={sid}
                              viewToken={viewToken}
                              serverId={serverId}
                              advisorName={ele?.advisor}
                              setCaluculatedPortfolioData={
                                setCaluculatedPortfolioData
                              }
                              repair={matchingFailedTrades ? "repair" : null}
                              setModelPortfolioModelId={
                                setModelPortfolioModelId
                              }
                              setStoreModalName={setStoreModalName}
                              isInitialRebalance={allRebalances.length === 1}
                              setBrokerModel={setBrokerModel}
                              funds={funds}
                              setOpenTokenExpireModel={setOpenTokenExpireModel}
                              getUserDetails={getUserDetails}
                              setBroker={setBroker}
                              selectNonBroker={selectNonBroker}
                              setSelectNonBroker={setSelectNonBroker}
                              withoutBrokerModal={withoutBrokerModal}
                              setWithoutBrokerModal={setWithoutBrokerModal}
                              setStockTypeAndSymbol={setStockTypeAndSymbol}
                            />
                          );
                        })}
                  </div>
                </>
              )
            )}
          </div>

          {/* Bottom Fixed Buttom for Orders Not Placed  */}

          <div className="absolute bottom-0 bg-[#f9f9f9] shadow-[0px_-4px_4px_0px_rgba(0,0,0,0.06)]   flex flex-row items-center justify-between  h-[65px] px-4 space-x-4 w-full md:hidden">
            {filteredAdvcideRangeStocks.length === stockDetails.length ? (
              <button
                onClick={handleRemoveAllSelectedStocks}
                disabled={isSelectAllLoading}
                className=" w-full flex items-center justify-center  text-[15px] py-3 px-2   text-[#000000] font-medium font-poppins border-[1px] border-[#000000]/20 rounded-md cursor-pointer"
              >
                {isSelectAllLoading ? (
                  <Loader2 className="h-5 w-5 text-black animate-spin stroke-[3px]" />
                ) : (
                  "Deselect All"
                )}
              </button>
            ) : (
              <button
                onClick={handleSelectAllStocks}
                disabled={isSelectAllLoading}
                className=" w-full flex items-center justify-center text-[15px] py-3 px-2   text-[#000000] font-medium font-poppins border-[1px] border-[#000000]/20 rounded-md cursor-pointer"
              >
                {isSelectAllLoading ? (
                  <Loader2 className="h-5 w-5 text-black animate-spin stroke-[3px]" />
                ) : (
                  "Select All"
                )}
              </button>
            )}

            <button
              className="w-full disabled:bg-[#000000]/30 disabled:cursor-not-allowed px-2 py-3 bg-black text-[15px]  text-white font-medium rounded-md cursor-pointer"
              onClick={handleTrade}
              disabled={stockDetails?.length === 0}
            >
              <div className="flex flex-row justify-center items-center space-x-2">
                {" "}
                <TrendingUp className=" w-4 h-4 lg:h-5 lg:w-5" />
                <span>Trade</span>
                {singleStockSelectState === true ? (
                  <span className="font-medium mt-0 md:mt-1">
                    (
                    {(stockDetails?.length || 0) +
                      (selectedLength?.length || 0)}
                    )
                  </span>
                ) : (
                  stockDetails?.length > 0 && (
                    <span className="font-medium mt-0 md:mt-1">
                      ({stockDetails?.length})
                    </span>
                  )
                )}
              </div>
            </button>
          </div>

          {brokerModel === true ? (
            <ConnectBroker
              uid={userDetails && userDetails._id}
              userDetails={userDetails && userDetails}
              setBrokerModel={setBrokerModel}
              getUserDetails={getUserDetails}
              broker={broker}
              setBroker={setBroker}
              brokerModel={brokerModel}
            />
          ) : null}

          {updateUserDetails === true ? (
            <UpdateUserDeatils
              setUpdateUserDetails={setUpdateUserDetails}
              userEmail={userEmail}
              advisorName={process.env.REACT_APP_ADVISOR_SPECIFIC_TAG}
              userDetails={userDetails}
            />
          ) : null}

          {openTokenExpireModel === true ? (
            <TokenExpireBrokarModal
              openTokenExpireModel={openTokenExpireModel}
              setOpenTokenExpireModel={setOpenTokenExpireModel}
              userId={userId && userId}
              apiKey={apiKey}
              secretKey={secretKey}
              checkValidApiAnSecret={checkValidApiAnSecret}
              clientCode={clientCode}
              my2pin={my2pin}
              panNumber={panNumber}
              mobileNumber={mobileNumber}
              broker={broker}
              getUserDetails={getUserDetails}
            />
          ) : null}

          {/* Ignore Trade Model with Mobile Drawer */}

          {openIgnoreTradeModel === true ? (
            <IgnoreTradeModal
              openIgnoreTradeModel={openIgnoreTradeModel}
              setOpenIgnoreTradeModel={setOpenIgnoreTradeModel}
              handleIgnoredTrades={handleIgnoredTrades}
              stockIgnoreId={stockIgnoreId}
              ignoreText={ignoreText}
              setIgnoreText={setIgnoreText}
              ignoreLoading={ignoreLoading}
              style={style}
            />
          ) : null}

          {stockDetails.length !== 0 && openReviewTrade === true ? (
            <ReviewTradeModel
              calculateTotalAmount={calculateTotalAmount}
              getLTPForSymbol={getLTPForSymbol}
              stockDetails={stockDetails}
              setStockDetails={setStockDetails}
              setOpenReviewTrade={handleOpenReviewModal}
              placeOrder={placeOrder}
              loading={loading}
              funds={funds?.data?.availablecash}
              openReviewTrade={openReviewTrade}
              getCartAllStocks={getCartAllStocks}
              broker={broker}
            />
          ) : stockDetails.length !== 0 &&
            broker === "Zerodha" &&
            openZerodhaModel === true ? (
            <ZerodhaReviewModal
              getLTPForSymbol={getLTPForSymbol}
              stockDetails={stockDetails}
              setStockDetails={setStockDetails}
              calculateTotalAmount={calculateTotalAmount}
              funds={funds?.data?.availablecash}
              setOpenZerodhaModel={handleOpenZerodhaModal}
              handleZerodhaRedirect={handleZerodhaRedirect}
              openZerodhaModel={openZerodhaModel}
              getCartAllStocks={getCartAllStocks}
              broker={broker}
            />
          ) : null}

          {openRebalanceModal === true ? (
            <UpdateRebalanceModal
              userDetails={userDetails}
              getUserDetails={getUserDetails}
              userEmail={userEmail}
              openRebalanceModal={openRebalanceModal}
              setOpenRebalanceModal={setOpenRebalanceModal}
              data={modelPortfolioStrategy}
              calculatedPortfolioData={calculatedPortfolioData}
              broker={broker}
              apiKey={apiKey}
              jwtToken={jwtToken}
              secretKey={secretKey}
              clientCode={clientCode}
              sid={sid}
              viewToken={viewToken}
              serverId={serverId}
              setBrokerModel={setBrokerModel}
              setOpenSucessModal={setOpenSucessModal}
              setOrderPlacementResponse={setOrderPlacementResponse}
              modelPortfolioModelId={modelPortfolioModelId}
              setOpenTokenExpireModel={setOpenTokenExpireModel}
              modelPortfolioRepairTrades={modelPortfolioRepairTrades}
              getRebalanceRepair={getRebalanceRepair}
              storeModalName={storeModalName}
              getModelPortfolioStrategyDetails={
                getModelPortfolioStrategyDetails
              }
              setShowOtherBrokerModel={setShowOtherBrokerModel}
              setIsReturningFromOtherBrokerModal={
                setIsReturningFromOtherBrokerModal
              }
              setShowDhanTpinModel={setShowDhanTpinModel}
              setShowAngleOneTpinModel={setShowAngleOneTpinModel}
              setShowFyersTpinModal={setShowFyersTpinModal}
              tradeType={tradeType}
              edisStatus={edisStatus}
              dhanEdisStatus={dhanEdisStatus}
              selectNonBroker={selectNonBroker}
              setShowDdpiModal={setShowDdpiModal}
              withoutBrokerModal={withoutBrokerModal}
              reopenRebalanceModal={reopenRebalanceModal}
            />
          ) : null}
          {showAfterPlaceOrderDdpiModal && (
            <AfterPlaceOrderDdpiModal
              isOpen={showAfterPlaceOrderDdpiModal}
              onClose={handleAfterPlaceOrderDdpiModalClose}
              onActivate={() => {
                handleAfterPlaceOrderDdpiModalClose();
              }}
              userDetails={userDetails}
            />
          )}

          {showStepGuideModal && (
            <StepGuideModal
              showStepGuideModal={showStepGuideModal}
              setShowStepGuideModal={setShowStepGuideModal}
            />
          )}
          {iciciSuccessMsg && (
            <Dialog
              open={iciciSuccessMsg}
              onOpenChange={closeLoginSuccessModal}
            >
              <DialogContent className="sm:max-w-[600px] px-12">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center justify-center rounded-full p-2 ">
                    <img
                      src={Checked}
                      alt="Checked"
                      className="text-[#000000]/50 w-16 h-16 "
                    />
                  </div>
                </div>
                <div className="flex space-x-4 items-center justify-center  text-black text-center text-2xl font-bold mt-4 mb-4">
                  <span className="text-[20px] text-[#000000] font-medium font-poppins text-center">
                    You have been successfully logged in to your broker
                  </span>
                </div>

                <div
                  className="mt-6 lg:mt-0 text-center bg-[#000000] text-[#ffffff] py-3 px-4 font-bold  text-lg font-poppins rounded-lg cursor-pointer"
                  onClick={closeLoginSuccessModal}
                >
                  <span className="text-[16px] text-white font-semibold font-poppins">
                    Continue
                  </span>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      ) : (
        <>
          {isStepGuideLoading ? (
            <div className="py-24 text-3xl font-semibold font-sans flex items-center justify-center  h-[calc(100vh-60px)]">
              <svg
                className="h-10 w-10 text-[#000000] animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <StepGuideScreen />
          )}
        </>
      )}

      {openSuccessModal && (
        <RecommendationSuccessModal
          setOpenSucessModal={handleCloseTradeSuccessModal}
          orderPlacementResponse={orderPlacementResponse}
          setStockDetails={setStockDetails}
          openSuccessModal={openSuccessModal}
          userDetails={userDetails}
          tradeType={tradeType}
          setShowAfterPlaceOrderDdpiModal={setShowAfterPlaceOrderDdpiModal}
          failedSellAttempts={failedSellAttempts}
          rejectedSellCount={parseInt(
            localStorage.getItem("rejectedOrdersCount") || "0"
          )}
          types={types}
        />
      )}

      {showDdpiModal && (
        <DdpiModal
          isOpen={showDdpiModal}
          setIsOpen={handleCloseDdpiModal}
          proceedWithTpin={handleProceedWithTpin}
          userDetails={userDetails && userDetails}
          setOpenReviewTrade={setOpenReviewTrade}
          reopenRebalanceModal={reopenRebalanceModal}
          getUserDetails={getUserDetails}
        />
      )}

      {showActivateNowModel && (
        <ActivateNowModel
          isOpen={showActivateNowModel}
          setIsOpen={setActivateNowModel}
          onActivate={handleActivateDDPI}
          userDetails={userDetails}
        />
      )}

      {showAngleOneTpinModel && (
        <AngleOneTpinModal
          isOpen={showAngleOneTpinModel}
          setIsOpen={setShowAngleOneTpinModel}
          userDetails={userDetails}
          edisStatus={edisStatus}
          getUserDetails={getUserDetails}
          tradingSymbol={stockDetails.map((stock) => stock.tradingSymbol)}
          reopenRebalanceModal={reopenRebalanceModal}
        />
      )}

      {showFyersTpinModal && (
        <FyersTpinModal
          isOpen={showFyersTpinModal}
          setIsOpen={setShowFyersTpinModal}
          userDetails={userDetails}
          reopenRebalanceModal={reopenRebalanceModal}
        />
      )}

      {showDhanTpinModel && (
        <DhanTpinModal
          isOpen={showDhanTpinModel}
          setIsOpen={setShowDhanTpinModel}
          userDetails={userDetails}
          getUserDetails={getUserDetails}
          dhanEdisStatus={dhanEdisStatus}
          stockTypeAndSymbol={stockTypeAndSymbol}
          singleStockTypeAndSymbol={singleStockTypeAndSymbol}
          reopenRebalanceModal={reopenRebalanceModal}
        />
      )}

      {showOtherBrokerModel && (
        <OtherBrokerModel
          userDetails={userDetails}
          getUserDetails={getUserDetails}
          onContinue={() => {
            setIsReturningFromOtherBrokerModal(true);
            setShowOtherBrokerModel(false);
          }}
          setShowOtherBrokerModel={setShowOtherBrokerModel}
          openReviewModal={openReviewModal}
          setOpenReviewTrade={setOpenReviewTrade}
          setOpenRebalanceModal={setOpenRebalanceModal}
          userEmail={userEmail}
          apiKey={apiKey}
          jwtToken={jwtToken}
          secretKey={secretKey}
          clientCode={clientCode}
          broker={broker}
          sid={sid}
          viewToken={viewToken}
          serverId={serverId}
          setCaluculatedPortfolioData={setCaluculatedPortfolioData}
          setModelPortfolioModelId={setModelPortfolioModelId}
          modelPortfolioModelId={modelPortfolioModelId}
          setStoreModalName={setStoreModalName}
          storeModalName={storeModalName}
          funds={funds}
          reopenRebalanceModal={reopenRebalanceModal}
        />
      )}

      {shouldShowPurchasePrompt && (
        <PurchasePrompt
          userDetails={userDetails}
          getUserDetails={getUserDetails}
          handleDismiss={handleDismiss}
          showPurchasePrompt={showPurchasePrompt}
          setShowPurchasePrompt={setShowPurchasePrompt}
          paymentSuccess={paymentSuccess}
          setPaymentSuccess={setPaymentSuccess}
          selectedCard={selectedCard}
          setSelectedCard={setSelectedCard}
          handleSendAdvice={handleSendAdvice}
          mobileNumber={mobileNumber}
          setMobileNumber={setMobileNumber}
        />
      )}
      {paymentSuccess && (
        <PaymentSuccessModal
          paymentSuccess={paymentSuccess}
          setPaymentSuccess={setPaymentSuccess}
          setSelectedCard={setSelectedCard}
        />
      )}
    </div>
  );
};

export default StockRecommendation;
