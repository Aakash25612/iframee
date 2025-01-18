import React, { useEffect, useState } from "react";
import YouTube from "react-youtube";
import axios from "axios";
import CryptoJS from "crypto-js";

import {
  X,
  AlertTriangle,
  Info,
  ChevronLeft,
  ClipboardList,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import DDPI from "../../assests/DDPI.png";

import Checked from "../../assests/checked.svg";
// import DDPI from "../../assests/DDPI.png"
import Ddpi from "../../assests/DDPI.svg";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "../../components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import server from "../../utils/serverConfig";
const zerodhaApiKey = process.env.REACT_APP_ZERODHA_API_KEY;
const angelOneApiKey = process.env.REACT_APP_ANGEL_ONE_API_KEY;
const advisorName = process.env.REACT_APP_ADVISOR_SPECIFIC_TAG;
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

export default function DdpiModal({
  isOpen = false,
  setIsOpen = () => {},
  userDetails,
  reopenRebalanceModal,
  getUserDetails,
}) {
  const zerodhaApiKey = process.env.REACT_APP_ZERODHA_API_KEY;
  const [showTpinConfirmation, setShowTpinConfirmation] = useState(false);
  const [tpinCompleted, setTpinCompleted] = useState(false);

  if (userDetails?.user_broker === "Upstox") {
    setIsOpen(false);
    return null;
  }

  const proceedWithTpin = async () => {
    try {
      const response = await fetch(
        `${server.ccxtServer.baseUrl}zerodha/auth-sell`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: zerodhaApiKey,
            accessToken: userDetails?.jwtToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Response was not ok");
      }

      const data = await response.json();
      // console.log("API Response:", data);

      if (data.status === 0) {
        setShowTpinConfirmation(true);
        window.open(data.auth_url, "_blank");
      } else {
        console.error("Error in response:", data.message);
        alert(data.message || "An error occurred.");
      }
    } catch (error) {
      console.error("Error in API call:", error);
    }
  };

  const handleProceed = async () => {
    try {
      await axios.put(`${server.server.baseUrl}api/update-edis-status`, {
        uid: userDetails?._id,
        is_authorized_for_sell: true,
        user_broker: userDetails?.user_broker,
      });
      // Optionally, update the state to reflect the changes in the UI
      getUserDetails();
      setIsOpen(false);
      reopenRebalanceModal();
    } catch (error) {
      console.error("Error adding stocks to cart", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open && setIsOpen(true)}>
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-none"
        showCloseButton={false}
      >
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-[740px] max-h-[90vh] sm:h-[323px] relative border-t border-l">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col sm:flex-row h-full items-center">
              <div className="w-full sm:w-[440px] p-6 sm:pl-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <AlertTriangle className="text-red-500 shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl font-semibold font-poppins text-[#000000B3]">
                        DDPI Inactive: Proceed with TPIN Mandate
                      </h2>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 mb-6 pl-10 font-poppins">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Use TPIN for a temporary authorization to sell selected
                      stocks while DDPI is inactive
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      This secure, one-time mandate allows smooth transactions
                      until DDPI is active
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col items-start gap-4">
                  {showTpinConfirmation && (
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        id="tpin-completed"
                        checked={tpinCompleted}
                        onChange={(e) => setTpinCompleted(e.target.checked)}
                        className="cursor-pointer"
                      />
                      <label
                        htmlFor="tpin-completed"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I&apos;ve authorized the sell of the stocks
                      </label>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button
                      onClick={proceedWithTpin}
                      className="w-full px-1 sm:w-[240px] h-[45px] bg-red-500 text-white rounded-[6px] text-[13px] font-medium font-poppins hover:bg-red-600 transition-colors"
                    >
                      Proceed with Authorization to Sell
                    </button>
                    {showTpinConfirmation && (
                      <button
                        onClick={handleProceed}
                        disabled={!tpinCompleted}
                        className="w-full sm:w-[240px] h-[45px] bg-red-500 text-white rounded-[6px] text-[13px] font-medium font-poppins transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Retry Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-[240px] h-[224px] flex items-center justify-center mt-4 sm:mt-0">
                <img
                  src={Ddpi || "/placeholder.svg"}
                  alt="DDPI illustration"
                  width={2800}
                  height={600}
                  className="w-full h-full object-contain rounded-tl-[10px]"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActivateNowModel({
  isOpen = false,
  setIsOpen = () => {},
  onActivate = () => {},
}) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-none">
        <div className="fixed inset-0  bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="w-full max-w-[1016px] sm:h-[450px] sm:ml-[300px] bg-white rounded-lg overflow-hidden relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-black opacity-30 hover:opacity-100 transition-opacity"
            >
              <X size={18} />
            </button>
            <div className="max-w-[916px] mx-auto my-2 sm:my-4 md:my-2 flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/2 flex justify-center items-center mb-3 sm:mb-6 lg:mb-0 p-2 sm:p-4">
                <div className="aspect-square w-full max-w-[200px] sm:max-w-[300px] md:max-w-[400px] relative">
                  <img
                    src={Ddpi}
                    alt="DDPI Illustration"
                    className="rounded-lg absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 px-3 sm:px-4 md:px-6 lg:pl-8 pt-0 lg:pt-4">
                <h2 className="font-poppins text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-tight mb-2 sm:mb-4 md:mb-6 text-center lg:text-left">
                  Save Time and Effort by <br />
                  Enabling DDPI!
                </h2>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  <li className="flex items-start">
                    <img
                      src={Checked}
                      width={14}
                      height={14}
                      className="mr-2 mt-1 flex-shrink-0"
                      alt="Checkmark"
                    />
                    <p className="font-poppins text-xs font-normal sm:text-sm  leading-4 sm:leading-5 md:leading-6">
                      <span className="font-semibold">Instant Selling:</span>{" "}
                      Sell your holdings instantly after DDPI activation without
                      needing a T-PIN or OTP.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <img
                      src={Checked}
                      width={14}
                      height={14}
                      className="mr-2 mt-1 flex-shrink-0"
                      alt="Checkmark"
                    />
                    <p className="font-poppins text-xs sm:text-sm font-normal  leading-4 sm:leading-5 md:leading-6">
                      <span className="font-semibold">
                        Seamless Liquidation:
                      </span>{" "}
                      Liquidate your holdings without the hassle of daily
                      pre-authorization for each sell order.
                    </p>
                  </li>
                  <li className="flex items-start">
                    <img
                      src={Checked}
                      width={14}
                      height={14}
                      className="mr-2 mt-1 flex-shrink-0"
                      alt="Checkmark"
                    />
                    <p className="font-poppins text-xs sm:text-sm font-normal leading-4 sm:leading-5 md:leading-6">
                      <span className="font-semibold">
                        Faster Transactions:{" "}
                      </span>
                      Enjoy smoother and quicker trading experiences with fewer
                      barriers.
                    </p>
                  </li>
                </ul>
                <div className="flex justify-center lg:justify-start mt-3 sm:mt-4 md:mt-10">
                  <button
                    onClick={onActivate}
                    className="w-full max-w-[200px] sm:max-w-[250px] h-[40px] sm:h-[46px] rounded-lg text-white font-poppins font-semibold text-xs sm:text-sm bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 transition-colors duration-300"
                  >
                    Activate DDPI Now &gt;&gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActivateTopModel(userDetails) {
  const [showModal, setShowModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        toast.success("Copied to clipboard!", {
          duration: 4000,
          style: {
            background: "white",
            color: "#1e293b",
            maxWidth: "500px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#16a085",
            secondary: "#FFFAEE",
          },
        });
      },
      () => {
        toast.error("Failed to copy text", {
          duration: 5000,
          style: {
            background: "white",
            color: "#1e293b",
            maxWidth: "500px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#e43d3d",
            secondary: "#FFFAEE",
          },
        });
      }
    );
  };

  const brokerInstructions = {
    Dhan: {
      title: "Dhan Broker: How to Authorize Stocks for Selling",
      directLink:
        "https://knowledge.dhan.co/support/solutions/articles/82000900258-from-where-ddpi-service-can-be-activated-",
      steps: [
        "If you have not enabled DDPI, please enable it by following these steps:",
        "Log in to your Dhan account.",
        "Navigate to the DDPI activation section.",
        "Follow the on-screen instructions to complete the DDPI activation process.",
      ],
    },

    // "AliceBlue": {
    //   title: 'Aliceblue Broker: How to Authorize Stocks for Selling',
    //   videoId: 'https://youtu.be/ncFGDQAARhM',
    //   steps: [
    //     '1. Log in to your Aliceblue account. ',
    //     '2. Navigate to Portfolio > Holdings, and click the Authorize button located below the Portfolio Value.',
    //     '3. In the CDSL interface, select the stocks to authorize, click Authorize, and proceed to CDSL.',
    //     '4. Enter your TPIN and OTP for verification. If required, generate a TPIN before proceeding. ',
    //     '5. Upon successful authorization, you will be redirected to the Portfolio screen.',
    //     '6. Go back to the our platform and attempt to sell your stocks again',

    //   ],
    // },

    Zerodha: {
      title: "Zerodha: How to Authorize Stocks for Selling",
      directLink:
        "https://support.zerodha.com/category/account-opening/online-account-opening/other-online-account-opening-related-queries/articles/activate-ddpi",
      steps: [
        "If you have not enabled DDPI, please enable it by following these steps:",
        "Log in to your Zerodha account.",
        "Navigate to the Profile or Settings section.",
        "Find the DDPI activation option and follow the prompts.",
      ],
    },

    "Angel One": {
      title: "Angel One: How to Authorize Stocks for Selling",
      directLink:
        "https://www.angelone.in/knowledge-center/demat-account/how-to-set-up-ddpi-on-angel-on",
      // steps: [
      //   "If you have not enabled DDPI, please enable it by following these steps:",
      //   "Log in to your AngelOne account.",
      //   "Access the Profile section.",
      //   "Find the DDPI option and complete the activation steps.",
      // ],
    },
  };
  const handleActivateClick = () => {
    if (instructions.directLink) {
      window.open(instructions.directLink, "_blank", "noopener,noreferrer");
    } else {
      setShowModal(true);
    }
  };

  const broker = userDetails?.userDetails?.user_broker;
  // console.log("userdetailBroker",broker)

  // console.log("broker",broker)
  const instructions = brokerInstructions[broker] || {};

  return (
    <>
      <div className="flex items-center gap-2 w-auto sm:w-[680px] h-[120px] sm:h-[40px] bg-[#FFC90733] rounded-br-[20px] px-4">
        <Info className="w-22px sm:w-[14px] text-black" />
        <p className="font-poppins text-xs sm:text-[13px] font-semibold py-2 sm:py-4">
          Enable DDPI for faster trades and seamless transactions.
        </p>
        <button
          className="w-[250px] h-[26px] sm:w-[135px] sm:h-[26px] rounded-md sm:ml-14 text-white font-poppins font-semibold text-[11px] sm:text-xs border-[1px] border-[#A4751F] bg-gradient-to-r from-[#A4751F] via-yellow-500 to-[#BC9038] hover:from-yellow-500 hover:to-yellow-700 transition-colors duration-300 flex items-center justify-center"
          // onClick={() => setShowModal(true)}
          onClick={handleActivateClick}
        >
          <span className="mr-1">Activate DDPI &gt;&gt; </span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 overflow-auto p-4">
          <Toaster position="top-center" reverseOrder={true} />

          <div className="w-full max-w-[580px] bg-white shadow-lg">
            <div className="p-4 pb-6 relative font-poppins">
              <div className="mb-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div>
                {instructions.videoId && (
                  <div className="w-full aspect-video">
                    <YouTube
                      className={`videoIframe `}
                      videoId={instructions.videoId}
                      title="YouTube video player"
                    ></YouTube>
                  </div>
                )}

                <div className="space-y-10">
                  <h2 className="text-xl font-bold text-center  font-poppins">
                    {instructions.title}
                  </h2>

                  <ul className="space-y-1.5 text-base pb-4 font-poppins">
                    {instructions.steps &&
                      instructions.steps.map((step, index) => (
                        <li key={index} className="flex flex-col gap-1">
                          <div className="flex items-start gap-1">
                            <span className="font-semibold font-poppins">
                              {index + 1}.
                            </span>
                            <div className="flex flex-col space-y-1">
                              <div
                                className="flex items-center space-x-2 flex-wrap"
                                data-tooltip-id="copy-tooltip"
                                data-tooltip-content="COPY"
                              >
                                <span className="break-all">{step}</span>
                                {step.includes("http") && (
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        step.match(/https?:\/\/[^\s]+/)[0]
                                      )
                                    }
                                    aria-label="Copy link"
                                  >
                                    <ClipboardList className="w-4 h-4 cursor-pointer text-gray-300 hover:text-gray-600 transition-colors ml-2 flex-shrink-0" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Tooltip id="copy-tooltip" />
        </div>
      )}
    </>
  );
}

export function AngleOneTpinModal({
  isOpen,
  setIsOpen,
  userDetails,
  edisStatus,
  tradingSymbol,
  getUserDetails,
  reopenRebalanceModal,
}) {
  const [loading, setLoading] = useState(false);
  const [errorHandlePopup, setErrorHandlePopup] = useState(false);
  const [errorLoading, setErrorLoading] = useState(true);
  const [showTpinConfirmation, setShowTpinConfirmation] = useState(false);
  const [tpinCompleted, setTpinCompleted] = useState(false);

  useEffect(() => {
    if (errorHandlePopup) {
      setErrorLoading(true);
      const timer = setTimeout(() => {
        setErrorLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [errorHandlePopup]);

  const proceedWithTpin = async () => {
    if (
      edisStatus?.data === null ||
      edisStatus?.data === undefined ||
      !edisStatus
    ) {
      setErrorHandlePopup(true);
    } else {
      const formHtml = `
      <!DOCTYPE html>
      <html>
      <script>window.onload = function() { document.getElementById("submitBtn").click(); }</script>
      <body>
        <form 
          name="frmDIS" 
          method="post"
          action="https://edis.cdslindia.com/eDIS/VerifyDIS/"
          style="display:none;"
        >
          <input type="hidden" name="DPId" value="${
            edisStatus?.data?.DPId || ""
          }" />
          <input type="hidden" name="ReqId" value="${
            edisStatus?.data?.ReqId || ""
          }" />
          <input type="hidden" name="Version" value="1.1" />
          <input type="hidden" name="TransDtls" value="${
            edisStatus?.data?.TransDtls || ""
          }" />
          <input type="hidden" name="returnURL" value="https://test.alphaquark.in/stock-recommendation" />
          <input id="submitBtn" type="submit" />
        </form>
      </body>
      </html>
    `;

      const popupWidth = 800; // Adjust the width as necessary
      const popupHeight = 600; // Adjust the height for a smaller popup
      const left = (window.innerWidth - popupWidth) / 2 + window.screenX;
      const top = (window.innerHeight - popupHeight) / 2 + window.screenY + 30;

      // Open a new window for the form submission
      const popup = window.open(
        "",
        "_blank",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (popup) {
        popup.document.write(formHtml); // Write the form HTML to the new window
        popup.document.close(); // Close the document stream to complete rendering

        setShowTpinConfirmation(true);

        // Popup checker to reload the main window when popup is closed
        const popupChecker = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(popupChecker); // Stop checking once the popup is closed
            try {
              axios.put(`${server.server.baseUrl}api/update-edis-status`, {
                uid: userDetails?._id,
                is_authorized_for_sell: true,
                user_broker: userDetails?.user_broker,
              });
              // Optionally, update the state to reflect the changes in the UI
              getUserDetails();
            } catch (error) {
              console.error("Error adding stocks to cart", error);
            }
          }
        }, 300);
      }
    }
  };

  const handleProceed = async () => {
    try {
      await axios.put(`${server.server.baseUrl}api/update-edis-status`, {
        uid: userDetails?._id,
        is_authorized_for_sell: true,
        user_broker: userDetails?.user_broker,
      });
      // Optionally, update the state to reflect the changes in the UI
      getUserDetails();
      setIsOpen(false);
      reopenRebalanceModal();
    } catch (error) {
      console.error("Error adding stocks to cart", error);
    }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="p-0 border-0 bg-transparent shadow-none max-w-none"
          showCloseButton={false}
        >
          <div className="fixed inset-0  flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-[740px] max-h-[90vh] overflow-y-auto sm:h-[323px] relative border-t border-l">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              {!errorHandlePopup ? (
                <div className="flex flex-col sm:flex-row h-full items-center">
                  <div className="w-full sm:w-[440px] p-6 sm:pl-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <AlertTriangle className="text-red-500 shrink-0 mt-1" />
                        <div>
                          <h2 className="text-xl font-semibold font-poppins text-[#000000B3]">
                            DDPI Inactive: Proceed with TPIN Mandate
                          </h2>
                        </div>
                      </div>
                      <ul className="space-y-3 text-sm text-gray-600 mb-6 pl-10 font-poppins">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          Use TPIN for a temporary authorization to sell
                          selected stocks while DDPI is inactive
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          This secure, one-time mandate allows smooth
                          transactions until DDPI is active
                        </li>
                      </ul>
                    </div>
                    {/* <div className="flex flex-row sm:gap-0 gap-4"> */}
                    <div className="flex flex-col items-start gap-4">
                      {showTpinConfirmation && (
                        <div className="flex items-center space-x-2 mb-4">
                          <input
                            type="checkbox"
                            id="tpin-completed"
                            checked={tpinCompleted}
                            onChange={(e) => setTpinCompleted(e.target.checked)}
                            className="cursor-pointer"
                          />
                          <label
                            htmlFor="tpin-completed"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I&apos;ve authorized the sell of the stocks
                          </label>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button
                          onClick={proceedWithTpin}
                          className="w-full px-1 sm:w-[240px] h-[45px] bg-red-500 text-white rounded-[6px] text-[13px] font-medium font-poppins hover:bg-red-600 transition-colors"
                        >
                          Proceed with Authorization to Sell
                        </button>
                        {showTpinConfirmation && (
                          <button
                            onClick={handleProceed}
                            disabled={!tpinCompleted}
                            className="w-full sm:w-[240px] h-[45px] bg-red-500 text-white rounded-[6px] text-[13px] font-medium font-poppins transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Retry Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-[240px] h-[224px] flex items-center justify-center mt-4 sm:mt-0">
                    <img
                      src={Ddpi}
                      alt="DDPI illustration"
                      width={2800}
                      height={600}
                      className="w-full h-full object-contain rounded-tl-[10px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  {errorLoading ? (
                    <Loader2 className="w-12 h-12 animate-spin font-bold text-black" />
                  ) : (
                    <>
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">
                        Internal Error
                      </h3>
                      <p className="mb-6 text-gray-600 max-w-md font-poppins font-semibold">
                        We're experiencing an internal issue. Please proceed
                        with TPIN Mandate on your Angel One broker or activate
                        your DDPI for a better experience.
                      </p>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-8 py-1.5 bg-black font-poppins text-white rounded-md "
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DhanTpinModal({
  isOpen,
  setIsOpen,
  userDetails,
  getUserDetails,
  dhanEdisStatus,
  stockTypeAndSymbol,
  singleStockTypeAndSymbol,
  reopenRebalanceModal,
}) {
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // State for controlling popup visibility
  const [tpin, setTpin] = useState(""); // State for capturing the TPIN entered by the user
  const [matchedData, setMatchedData] = useState(null);
  const [matchedIsin, setMatchedIsin] = useState(null);
  const [showNoHoldingModal, setShowNoHoldingModal] = useState(false);
  const [showTpinConfirmation, setShowTpinConfirmation] = useState(false);
  const [tpinCompleted, setTpinCompleted] = useState(false);

  useEffect(() => {
    const shouldOpenPopup = localStorage.getItem("openDhanPopup");
    if (shouldOpenPopup === "true") {
      setIsPopupOpen(true);
      localStorage.removeItem("openDhanPopup");
    }
  }, []);

  // console.log("singleStockTypeAndSymbol", singleStockTypeAndSymbol);
  // console.log("stockTypeAndSymbol", stockTypeAndSymbol);

  // console.log("dhanEdisStatus", dhanEdisStatus);

  useEffect(() => {
    if (dhanEdisStatus && dhanEdisStatus.data) {
      let stockToMatch = null;

      if (Array.isArray(stockTypeAndSymbol) && stockTypeAndSymbol.length > 0) {
        console.log("Handling array of stocks");
        stockToMatch = stockTypeAndSymbol.find(
          (stock) => stock.Type === "SELL"
        );
      } else if (
        singleStockTypeAndSymbol &&
        singleStockTypeAndSymbol.type === "SELL"
      ) {
        console.log("Handling single stock");
        stockToMatch = {
          Symbol: singleStockTypeAndSymbol.symbol,
          Exchange: singleStockTypeAndSymbol.exchange || "NSE", // Assuming NSE if not provided
        };
      }

      console.log("Stock to match:", stockToMatch);

      if (stockToMatch) {
        const matchedOrder = dhanEdisStatus.data.find(
          (order) =>
            order.symbol === stockToMatch.Symbol &&
            (order.exchange === stockToMatch.Exchange || !stockToMatch.Exchange)
        );

        console.log("Matched order:", matchedOrder);

        if (matchedOrder) {
          setMatchedData({
            isin: matchedOrder.isin,
            symbol: matchedOrder.symbol,
            exchange: matchedOrder.exchange,
          });
          setMatchedIsin(matchedOrder.isin);
        } else {
          console.log("No matching order found");
          setShowNoHoldingModal(true);
        }
      } else {
        console.log("No SELL order found");
        setShowNoHoldingModal(true);
      }
    } else {
      console.log("dhanEdisStatus or its data is not available");
    }
  }, [stockTypeAndSymbol, singleStockTypeAndSymbol, dhanEdisStatus]);

  const proceedWithDhanTpin = async () => {
    // console.log("userDetails of ddpi page", userDetails);
    // console.log("Matched Data before API call:", matchedData);
    // console.log("Matched ISIN before API call:", matchedData.isin);

    setLoading(true);
    const dhanEdisStatus = userDetails.dhanEdisStatus;
    if (
      dhanEdisStatus &&
      (!dhanEdisStatus.data || dhanEdisStatus.data.length === 0)
    ) {
      setShowNoHoldingModal(true);
      setLoading(false);
      return;
    }

    try {
      const broker = userDetails.user_broker;

      if (broker === "Dhan") {
        // Generate TPIN
        const generateTpinResponse = await fetch(
          `${server.ccxtServer.baseUrl}dhan/generate-tpin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clientId: userDetails?.clientCode,
              accessToken: userDetails?.jwtToken,
            }),
          }
        );

        const generateTpinData = await generateTpinResponse.json();

        if (generateTpinData.status === 0) {
          toast.success("TPIN generated successfully for Dhan.");

          // Immediately call enter-tpin API
          const enterTpinResponse = await fetch(
            `${server.ccxtServer.baseUrl}dhan/enter-tpin`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                clientId: userDetails?.clientCode,
                accessToken: userDetails?.jwtToken,
                isin: matchedData.isin,
                symbol: matchedData.symbol,
                exchange: matchedData.exchange,
              }),
            }
          );

          const enterTpinData = await enterTpinResponse.json();

          if (enterTpinData.status === 0) {
            toast.success(enterTpinData.message || "Operation successful.");

            if (enterTpinData?.data?.edisFormHtml) {
              const popupWidth = 800;
              const popupHeight = 600;
              const left =
                (window.innerWidth - popupWidth) / 2 + window.screenX;
              const top =
                (window.innerHeight - popupHeight) / 2 + window.screenY + 0;

              const popup = window.open(
                "",
                "_blank",
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
              );

              if (popup) {
                popup.document.write(enterTpinData.data.edisFormHtml);
                popup.document.close();

                setShowTpinConfirmation(true);

                const popupChecker = setInterval(() => {
                  if (popup && popup.closed) {
                    clearInterval(popupChecker);
                    try {
                      axios.put(
                        `${server.server.baseUrl}api/update-edis-status`,
                        {
                          uid: userDetails?._id,
                          is_authorized_for_sell: true,
                          user_broker: userDetails?.user_broker,
                        }
                      );
                      // Optionally, update the state to reflect the changes in the UI
                      getUserDetails();
                    } catch (error) {
                      console.error("Error adding stocks to cart", error);
                    }
                  }
                }, 300);
              } else {
                toast.error(
                  "Please allow popups for this site to complete the EDIS process."
                );
              }
            } else {
              toast.error("EDIS form data not received.");
            }
          } else {
            throw new Error(enterTpinData.message || "Failed to enter TPIN");
          }
        } else {
          throw new Error(
            generateTpinData.message || "Failed to generate TPIN for Dhan"
          );
        }
      }
    } catch (error) {
      console.error("Error in API call:", error);
      toast.error(error.message || "An error occurred during the process");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTpin("");
    setIsPopupOpen(false);
    setIsOpen(false);
  };

  const handleProceed = async () => {
    try {
      await axios.put(`${server.server.baseUrl}api/update-edis-status`, {
        uid: userDetails?._id,
        is_authorized_for_sell: true,
        user_broker: userDetails?.user_broker,
      });
      // Optionally, update the state to reflect the changes in the UI
      getUserDetails();
      setIsOpen(false);
      reopenRebalanceModal();
    } catch (error) {
      console.error("Error adding stocks to cart", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-none"
        showCloseButton={false}
      >
        {showNoHoldingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[700px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">No Holdings</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className=" font-bold text-red-600">
                {" "}
                Unable to place orders. Each order must have sufficient holdings
                to proceed.
              </p>
            </div>
          </div>
        )}

        {!isPopupOpen && !showNoHoldingModal ? (
          <div className="fixed inset-0  flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-[740px] max-h-[90vh] overflow-y-auto sm:h-[323px] relative border-t border-l">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex flex-col sm:flex-row h-full items-center">
                <div className="w-full sm:w-[440px] p-6 sm:pl-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <AlertTriangle className="text-red-500 shrink-0 mt-1" />
                      <div>
                        <h2 className="text-xl font-semibold font-poppins text-[#000000B3]">
                          DDPI Inactive: Proceed with TPIN Mandate
                        </h2>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 mb-6 pl-10 font-poppins">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        Use TPIN for a temporary authorization to sell selected
                        stocks while DDPI is inactive
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        This secure, one-time mandate allows smooth transactions
                        until DDPI is active
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-start gap-4">
                    {showTpinConfirmation && (
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          id="tpin-completed"
                          checked={tpinCompleted}
                          onChange={(e) => setTpinCompleted(e.target.checked)}
                          className="cursor-pointer"
                        />
                        <label
                          htmlFor="tpin-completed"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I&apos;ve authorized the sell of the stocks
                        </label>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                      <button
                        onClick={proceedWithDhanTpin}
                        className="w-full px-1 sm:w-[240px] h-[45px] bg-red-500 text-white rounded-[6px] text-[13px] font-medium font-poppins hover:bg-red-600 transition-colors"
                      >
                        Proceed with Authorization to Sell
                      </button>
                      {showTpinConfirmation && (
                        <button
                          onClick={handleProceed}
                          disabled={!tpinCompleted}
                          className="w-full sm:w-[240px] h-[45px] bg-red-500 text-white rounded-[6px] text-[13px] font-medium font-poppins transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Retry Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-[240px] h-[224px] flex items-center justify-center mt-4 sm:mt-0">
                  <img
                    src={Ddpi}
                    alt="DDPI illustration"
                    width={2800}
                    height={600}
                    className="w-full h-full object-contain rounded-tl-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : isPopupOpen && !showNoHoldingModal ? (
          // ) : (

          // {isPopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 shadow-lg w-[400px]">
              <h3 className="text-3xl font-semibold mb-6 font-poppins text-center text-gray-700">
                TPIN Verification
              </h3>
              <div className="flex flex-row items-center mb-6">
                <span className="mr-2 font-poppins">Enter TPIN :</span>
                <input
                  type="password"
                  value={tpin}
                  onChange={(e) => setTpin(e.target.value)}
                  className="flex-grow px-3 py-2 border rounded-3xl"
                  placeholder="Enter your TPIN"
                />
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  // onClick={handleDhanTpinSubmit}
                  className="px-6 py-2 bg-[#5ACAC9] font-semibold text-white rounded-2xl hover:bg-blue-600 transition-colors duration-300"
                >
                  Verify
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 bg-[#5ACAC9] font-semibold text-white rounded-2xl hover:bg-gray-400 transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function OtherBrokerModel({
  userDetails,
  onContinue,
  setShowOtherBrokerModel,
  openReviewModal,
  setOpenReviewTrade,
  userEmail,
  apiKey,
  jwtToken,
  secretKey,
  clientCode,
  sid,
  viewToken,
  serverId,
  setCaluculatedPortfolioData,
  setModelPortfolioModelId,
  modelPortfolioModelId,
  modelName,
  setOpenRebalanceModal,
  funds,
  setStoreModalName,
  storeModalName,
  getUserDetails,
  reopenRebalanceModal,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSellAllowed, setIsSellAllowed] = useState(false);

  const [showMainModal, setShowMainModal] = useState(true);
  const [showHowToAuthorize, setShowHowToAuthorize] = useState(false);

  const brokerInstructions = {
    "IIFL Securities": {
      title: "IIFL Securities Broker : Steps to Authorize Stocks for Selling  ",
      videoId: "hpP5M5H52HY",
      steps: [
        "Log in to your IIFL Securities account.",
        "Tap on the Holdings tab at the bottom of the screen.",
        "Select the stocks to sell, click Transfer, and then click **Authorize Now.",
        "Complete TPIN verification and OTP authentication.",
        "After successful authorization, return to the platform to retry selling orders.",
      ],
      redirectLink: "https://ttweb.indiainfoline.com/Trade/Login.aspx",
    },
    "ICICI Direct": {
      title: "ICICI Broker: Steps to Enable Mandate for Selling",
      videoId: "Gn6hyPf8eDY",
      steps: [
        "Log in to **ICICI Direct** Customer portal and select the **Portfolio** tab.",
        "Click **Add Mandate** near the **Refresh** icon above **Overall Gain**.",
        "Select the advised stock, click **Proceed**, enter your MPIN, and submit.",
        "Accept the T&C, enter the OTP, and click **Submit**.",
        "After the success message appears, click **OK** and try executing the sell order again on the Alphaquark platform.",
      ],
      redirectLink: "https://secure.icicidirect.com/customer/login",
    },
    Upstox: {
      title: "Upstox Broker: How to Authorize Stocks for Selling ",
      videoId: "eD6aQ07Ommw",
      steps: [
        "Log in to your Upstox account.  ",
        "Go to the **Holdings** tab and click Authorize next to the Day P&L value.",
        "Select **Authorize with T-PIN**.",
        "Click **Continue to CDSL**.",
        "Enter your T-PIN (or generate a new one if needed) and verify it, then enter the OTP for authentication.",
        "Once verified, return to the Alphaquark platform and place your sell order.",
      ],
      redirectLink: "https://login.upstox.com/",
    },
    "Kotak Securities": {
      title: "Kotak Securities: Steps to authorize Stocks for Selling",
      steps: [
        "Login to your kotak securities account",
        "Click on User profile icon > Select Services > Service Request > Click on Proceed of Demat Debit and Pledge Instruction Execution.",
      ],
      redirectLink: "",
    },
    "HDFC Securities": {
      title: "HDFC Broker: Steps to authorize Stocks for Selling",
      videoId: "CkZI_2psXLY",
      steps: [
        "Login to your HDFC Broker account. ",
        "Navigate to **Portfolio** > **Demat Balance** > **Equity**.",
        "Click **Raise eDIS Request**, select stock(s), and submit for authorization.",
        "Accept the **Terms and Conditions, click Authorize Now, and use Forgotten TPIN** if needed.",
        "Complete authorization on CDSL by entering your TPIN and OTP. ",
        "After successful authorization, click OK and retry the sell order on Alphaquark.",
      ],
      redirectLink: "https://ntrade.hdfcsec.com/",
    },
    AliceBlue: {
      title: "Aliceblue Broker: How to Authorize Stocks for Selling",
      videoId: "gP06qK8LfYo",
      steps: [
        "Log in to your Aliceblue account.  ",
        "Navigate to Portfolio > Holdings, and click the **Authorize** button located below the Portfolio Value.  ",
        "In the CDSL interface, select the stocks to authorize, click **Authorize**, and proceed to CDSL.  ",
        "Enter your TPIN and OTP for verification. If required, generate a TPIN before proceeding.",
        "Upon successful authorization, you will be redirected to the Portfolio screen.",
        "Go back to the our platform and attempt to sell your stocks again.",
      ],
      redirectLink: "https://ant.aliceblueonline.com/",
    },
  };
  function convertBoldText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  const broker = userDetails?.user_broker;
  const instructions = brokerInstructions[broker] || {};

  const [loadingRebalance, setLoadingRebalance] = useState(false);
  const handleContinue = async () => {
    try {
      await axios.put(`${server.server.baseUrl}api/update-edis-status`, {
        uid: userDetails?._id,
        is_authorized_for_sell: true,
        user_broker: userDetails?.user_broker,
      });
      // Optionally, update the state to reflect the changes in the UI
      getUserDetails();
    } catch (error) {
      console.error("Error adding stocks to cart", error);
    }
    setIsOpen(false);
    setShowOtherBrokerModel(false);
    openReviewModal();
    onContinue();
  };

  const handleClose = () => {
    setIsOpen(false); // Close the modal
    setShowOtherBrokerModel(false); // Close the other broker model
    setShowMainModal(false); // Close the main modal
    setShowHowToAuthorize(false); // Hide authorization instructions
    setIsAuthorized(false); // Reset authorization flag
    setIsSellAllowed(false);
  };

  if (!isOpen) return null;

  const openHowToAuthorize = () => {
    setShowMainModal(false);
    setShowHowToAuthorize(true);
  };

  const closeHowToAuthorize = () => {
    setShowHowToAuthorize(false);
    setShowMainModal(true);
  };

  const handleRetrySellOrder = () => {
    console.log("Retrying sell order...");
    // Add your retry sell order logic here
    closeHowToAuthorize();
  };

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        toast.success("Copied to clipboard!", {
          duration: 4000,
          style: {
            background: "white",
            color: "#1e293b",
            maxWidth: "500px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#16a085",
            secondary: "#FFFAEE",
          },
        });
      },
      () => {
        toast.error("Failed to copy text", {
          duration: 5000,
          style: {
            background: "white",
            color: "#1e293b",
            maxWidth: "500px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#e43d3d",
            secondary: "#FFFAEE",
          },
        });
      }
    );
  };

  const handleAcceptRebalance = async () => {
    try {
      await axios.put(`${server.server.baseUrl}api/update-edis-status`, {
        uid: userDetails?._id,
        is_authorized_for_sell: true,
        user_broker: userDetails?.user_broker,
      });
      // Optionally, update the state to reflect the changes in the UI
      getUserDetails();
    } catch (error) {
      console.error("Error adding stocks to cart", error);
    }
    onContinue();
    setLoadingRebalance(true);

    let payload = {
      userEmail: userEmail,
      userBroker: broker,
      modelName: storeModalName,
      advisor: advisorName,
      model_id: modelPortfolioModelId,
      userFund: funds?.data?.availablecash,
    };
    if (broker === "IIFL Securities") {
      payload = {
        ...payload,
        clientCode: clientCode,
      };
    } else if (broker === "ICICI Direct") {
      payload = {
        ...payload,
        apiKey: checkValidApiAnSecret(apiKey),
        secretKey: checkValidApiAnSecret(secretKey),
        sessionToken: jwtToken,
      };
    } else if (broker === "Upstox") {
      payload = {
        ...payload,
        apiKey: checkValidApiAnSecret(apiKey),
        apiSecret: checkValidApiAnSecret(secretKey),
        accessToken: jwtToken,
      };
    } else if (broker === "Angel One") {
      payload = {
        ...payload,
        apiKey: angelOneApiKey,
        jwtToken: jwtToken,
      };
    } else if (broker === "Zerodha") {
      payload = {
        ...payload,
        apiKey: zerodhaApiKey,
        accessToken: jwtToken,
      };
    } else if (broker === "Dhan") {
      payload = {
        ...payload,
        clientId: clientCode,
        accessToken: jwtToken,
      };
    } else if (broker === "Hdfc Securities") {
      payload = {
        ...payload,
        apiKey: checkValidApiAnSecret(apiKey),
        accessToken: jwtToken,
      };
    } else if (broker === "Kotak") {
      payload = {
        ...payload,
        consumerKey: checkValidApiAnSecret(apiKey),
        consumerSecret: checkValidApiAnSecret(secretKey),
        accessToken: jwtToken,
        viewToken: viewToken,
        sid: sid,
        serverId: serverId,
      };
    }
    let config = {
      method: "post",
      url: `${server.ccxtServer.baseUrl}rebalance/calculate`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(payload),
    };

    axios
      .request(config)
      .then((response) => {
        console.log("res", response);
        setLoadingRebalance(false);
        setCaluculatedPortfolioData(response.data);
        setOpenRebalanceModal(true);
        setModelPortfolioModelId(modelPortfolioModelId);
        // setStoreModalName(modelName);
        setShowOtherBrokerModel(false);
      })
      .catch((error) => {
        console.log(error);
        setLoadingRebalance(false);
      });
  };
  const handleRedirectToBroker = () => {
    const brokerPortalUrl =
      instructions.redirectLink || "https://your-default-broker-portal-url.com";
    window.open(brokerPortalUrl, "_blank");
  };

  return (
    <>
      {showMainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[700px] bg-white shadow-lg rounded-lg relative">
            <button
              className="absolute top-2 right-2 p-2 text-gray-500 font-light hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full"
              aria-label="Close"
              onClick={handleClose}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col h-full px-4 sm:px-8 py-7 justify-between">
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <AlertTriangle className="w-7 h-7 mt-0.5 text-[#E43D3D] flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-semibold font-poppins leading-[26px] mb-2">
                      Action Required: Stock Authorization to Sell
                    </h2>
                    <ul className="list-disc pl-5 space-y-4">
                      <li className="text-[13px] font-light font-poppins text-gray-600">
                        Your broker doesn&apos;t have EDIS flow
                      </li>
                      <li className="text-[13px] font-light font-poppins text-gray-600">
                        Please authorize your stocks manually on your broker
                        before can try selling <br />
                        orders from here again.
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center mt-8">
                  <input
                    type="checkbox"
                    id="authorized"
                    className="ml-0 sm:ml-10 text-gray-600 mr-2"
                    checked={isSellAllowed}
                    onChange={(e) => setIsSellAllowed(e.target.checked)}
                  />
                  <label htmlFor="authorized" className="text-sm font-poppins">
                    I&apos;ve authorized the sell of the stocks
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-start items-center space-y-4 sm:space-y-0 sm:space-x-4 sm:mt-4 sm:pb-2 sm:ml-9">
                {modelPortfolioModelId ? (
                  <button
                    className={`w-full sm:w-[170px] h-[41px] rounded-md font-poppins text-sm text-white ${
                      isSellAllowed
                        ? "bg-[#E43D3D]"
                        : "bg-[#E43D3D] bg-opacity-50 cursor-not-allowed"
                    }`}
                    disabled={!isSellAllowed}
                    onClick={handleAcceptRebalance}
                  >
                    {loadingRebalance === true ? (
                      <LoadingSpinner />
                    ) : (
                      "Retry sell order"
                    )}
                  </button>
                ) : (
                  <button
                    className={`w-full sm:w-[170px] h-[41px] rounded-md font-poppins text-sm text-white ${
                      isSellAllowed
                        ? "bg-[#E43D3D]"
                        : "bg-[#E43D3D] bg-opacity-50 cursor-not-allowed"
                    }`}
                    disabled={!isSellAllowed}
                    onClick={handleContinue}
                  >
                    Retry sell order
                  </button>
                )}

                <button
                  className="w-full sm:w-[170px] h-[41px] px-4 font-poppins text-sm font-medium border border-[#E43D3D] text-[#E43D3D] rounded-md"
                  onClick={openHowToAuthorize}
                >
                  How to Authorize &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHowToAuthorize && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 overflow-auto p-8">
          <div className="w-full max-w-[580px] bg-white shadow-lg rounded-lg">
            <div className="p-10 pb-6 relative font-poppins">
              <div className="mb-8">
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* 
          <div className="w-full max-w-[450px] mx-auto">
            <div className="w-full aspect-video bg-gray-200 mb-3">
              <iframe
                width="100%"
                height="100%"
                src={instructions.videoUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div> */}

              <div>
                {instructions.videoId && (
                  <div className="w-full aspect-video">
                    <YouTube
                      className={`videoIframe `}
                      videoId={instructions.videoId}
                      title="YouTube video player"
                    ></YouTube>
                  </div>
                )}

                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold font-poppins">
                    {instructions.title}
                  </h2>

                  <ol className="space-y-1.5 text-sm pb-4">
                    {instructions?.steps?.map((step, index) => (
                      <li key={index} className="flex flex-col gap-1">
                        <div className="flex items-start gap-1">
                          <span className="font-semibold font-poppins">
                            {index + 1}.
                          </span>
                          <div className="flex flex-col space-y-1">
                            <div
                              className="flex items-center space-x-2 flex-wrap"
                              data-tooltip-id="copy-tooltip"
                              data-tooltip-content="COPY"
                            >
                              <span
                                className="break-all"
                                dangerouslySetInnerHTML={{
                                  __html: convertBoldText(step),
                                }}
                              />
                              {step.includes("http") && (
                                <button
                                  onClick={() =>
                                    handleCopy(
                                      step.match(/https?:\/\/[^\s]+/)[0]
                                    )
                                  }
                                  aria-label="Copy link"
                                >
                                  <ClipboardList className="w-4 h-4 cursor-pointer text-gray-300 hover:text-gray-600 transition-colors ml-2 flex-shrink-0" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="flex items-center gap-1.5 mb-1.5 pt-3">
                    <input
                      type="checkbox"
                      id="authorized-how-to"
                      className="text-gray-600 scale-90"
                      checked={isAuthorized}
                      onChange={(e) => setIsAuthorized(e.target.checked)}
                    />
                    <label htmlFor="authorized-how-to" className="text-sm">
                      I&apos;ve authorized the sell of the above stocks
                    </label>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-4 ">
                  {modelPortfolioModelId ? (
                    <button
                      className={`w-full sm:w-[170px] h-[41px] rounded-md font-poppins text-sm text-white ${
                        isAuthorized
                          ? "bg-[#E43D3D]"
                          : "bg-[#E43D3D] bg-opacity-50 cursor-not-allowed"
                      }`}
                      disabled={!isAuthorized}
                      onClick={handleAcceptRebalance}
                    >
                      {loadingRebalance === true ? (
                        <LoadingSpinner />
                      ) : (
                        "Retry sell order"
                      )}
                    </button>
                  ) : (
                    <button
                      className={`w-full sm:w-[170px] h-[41px] rounded-md font-poppins text-sm text-white ${
                        isAuthorized
                          ? "bg-[#E43D3D]"
                          : "bg-[#E43D3D] bg-opacity-50 cursor-not-allowed"
                      }`}
                      disabled={!isAuthorized}
                      onClick={handleContinue}
                    >
                      Retry sell order
                    </button>
                  )}

                  <button
                    className="w-full sm:w-[170px] h-[41px] px-4 font-poppins text-sm font-medium border border-[#E43D3D] text-[#E43D3D] rounded-md"
                    onClick={handleRedirectToBroker}
                  >
                    Go to Broker Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Tooltip id="copy-tooltip" />
        </div>
      )}
    </>
  );
}

export function AfterPlaceOrderDdpiModal({ onClose, userDetails }) {
  const [showActivateNowModel, setShowActivateNowModel] = useState(false);

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        toast.success("Copied to clipboard!", {
          duration: 4000,
          style: {
            background: "white",
            color: "#1e293b",
            maxWidth: "500px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#16a085",
            secondary: "#FFFAEE",
          },
        });
      },
      () => {
        toast.error("Failed to copy text", {
          duration: 5000,
          style: {
            background: "white",
            color: "#1e293b",
            maxWidth: "500px",
            fontWeight: 600,
            fontSize: "13px",
            padding: "10px 20px",
          },
          iconTheme: {
            primary: "#e43d3d",
            secondary: "#FFFAEE",
          },
        });
      }
    );
  };

  const brokerInstructions = {
    "IIFL Securities": {
      title: "IIFL Broker: Enable DDPI Instructions",
      videoId: "N0KXx4vuThw",
      steps: [
        "1. Log in to your IIFL Securities account.",
        "2. Tap on the Holdings tab at the bottom of the screen.",
        "3. Select the stocks to sell, click Transfer, and then click **Authorize Now.",
        "4. Complete TPIN verification and OTP authentication.",
        "5. After successful authorization, return to the platform to retry selling orders.",
      ],
    },
    "ICICI Direct": {
      title: "To enable DDPI on your ICICI Direct account:",

      steps: [
        "1. There is no online process for activation. You need to fill out the DDPI form provided and send it to your broker's office via courier.",
        "2. Once received, the broker or DP will review and process the request within two to three business days.",
        "3. Download DDPI Form - www.icicidirect.com/mailimages/BM_DDPI_Version_9.pdf?_gl=1*1nq02ef*_gcl_au*MTUyMjU1Nzk2OS4xNzI2MjMxNzQw)",
        "4. Customer Care Details:",
        "Email: helpdesk@icicidirect.com",
        "Phone: 022-3355-1122",
        "5. Complete this process to enable DDPI on your account.",
      ],
    },

    Upstox: {
      title: "Upstox: Enable DDPI Instructions",
      directLink:
        "https://help.upstox.com/support/solutions/articles/260205-how-do-i-activate-ddpi-poa-on-upstox-",
      steps: [
        "1. If you have not enabled DDPI, please enable it by following these steps:",
        "2. Log in to your Upstox account.",
        "3. Go to the Settings or Profile section.",
        "4. Look for the DDPI activation option and follow the prompts to complete the process.",
      ],
    },

    "Kotak Securities": {
      title: "Steps to Enable DDPI on Kotak Securities Account:",
      steps: [
        "For Website:",
        "1. Log in to your Kotak Securities account.",
        "2. Click on the User Profile icon.",
        "3. Go to Services > Service Request > Proceed under Demat Debit and Pledge Instruction Execution",
        "",
        "For Mobile App (Neo App):",
        "1. Log in to the Neo App.",
        "2. Click on the Profile Option (displayed as the initials of your name).",
        "3. Navigate to Services > Service Request > Demat Debit and Pledge Instruction Execution",
        "",
        "Customer Care Details:",
        "- Email: service.securities@kotak.com",
        "- Phone: 1800-209-9191",
        "- WhatsApp: +91 77389 88888",
        "",
        "Follow these steps to enable DDPI on your Kotak account for smooth and faster transactions.",
      ],
    },

    "Hdfc Securities": {
      title: "To enable DDPI on your HDFC Securities account:",
      steps: [
        "1. New Accounts: You will receive an email after account creation. Follow the instructions to activate DDPI.",
        "2. Existing Accounts: Contact HDFC Securities customer care as there's no online process. They will email you the steps for activation.",
        "4. Customer Care Details:",
        "Email: support@hdfcsec.com",
        "Phone: 022-6246-5555",
        "5. Follow this process to enable DDPI for faster transactions.",
      ],
    },

    AliceBlue: {
      title: "AliceBlue: Enable DDPI Instructions",
      directLink:
        "https://aliceblueonline.com/support/account-opening/ddpi-activation-guide/",
      steps: [
        "1. If you have not enabled DDPI, please enable it by following these steps:",
        "2. Sign in to your AliceBlue trading account.",
        "3. Find the DDPI activation option in the Account or Settings menu.",
        "4. Follow the provided instructions to activate DDPI for your account.",
      ],
    },
    Dhan: {
      title: "Dhan Broker: Enable DDPI Instructions",
      directLink:
        "https://knowledge.dhan.co/support/solutions/articles/82000900258-from-where-ddpi-service-can-be-activated-",
      steps: [
        "1. If you have not enabled DDPI, please enable it by following these steps:",
        "2. Log in to your IIFL account.",
        "3. Navigate to the DDPI activation section.",
        "4. Follow the on-screen instructions to complete the DDPI activation process.",
      ],
    },

    Zerodha: {
      title: "Zerodha: Enable DDPI Instructions",
      directLink:
        "https://support.zerodha.com/category/account-opening/online-account-opening/other-online-account-opening-related-queries/articles/activate-ddpi",

      steps: [
        "1. If you have not enabled DDPI, please enable it by following these steps:",
        "2. Log in to your Zerodha account.",
        "3. Navigate to the Profile or Settings section.",
        "4. Find the DDPI activation option and follow the prompts.",
      ],
    },

    "Angel One": {
      title: "AngelOne: Enable DDPI Instructions",
      directLink:
        "https://www.angelone.in/knowledge-center/demat-account/how-to-set-up-ddpi-on-angel-one",
      steps: [
        "1. If you have not enabled DDPI, please enable it by following these steps:",
        "2. Log in to your AngelOne account.",
        "3. Access the Profile section.",
        "4. Find the DDPI option and complete the activation steps.",
      ],
    },
  };

  const broker = userDetails?.user_broker;
  const instructions = brokerInstructions[broker] || {};

  const handleActivateDDPiNow = () => {
    // Close the current modal if it's open, and show the new modal
    if (instructions.directLink) {
      window.open(instructions.directLink, "_blank", "noopener,noreferrer");
      onClose();
    } else {
      setShowActivateNowModel(true);
    }
  };

  const closeModal = () => {
    setShowActivateNowModel(false);
    onClose();
  };

  const handleBackButton = () => {
    setShowActivateNowModel(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
      {!showActivateNowModel ? (
        <div className="w-full inset-0 max-w-[1016px] sm:h-[450px]  bg-white rounded-lg overflow-hidden relative">
          <button
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-black opacity-30 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            <X size={18} />
          </button>
          <div className="max-w-[916px] mx-auto my-2 sm:my-4 md:my-2 flex flex-col lg:flex-row">
            <div className="w-full lg:w-1/2 flex justify-center items-center mb-3 sm:mb-6 lg:mb-0 p-2 sm:p-4">
              <div className="aspect-square w-full max-w-[200px] sm:max-w-[300px] md:max-w-[400px] relative">
                <img
                  src={DDPI}
                  alt="DDPI Illustration"
                  className="rounded-lg absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 px-3 sm:px-4 md:px-6 lg:pl-8 pt-0 lg:pt-4">
              <h2 className="font-poppins text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-tight mb-2 sm:mb-4 md:mb-6 text-center lg:text-left">
                Save Time and Effort by <br />
                Enabling DDPI!
              </h2>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li className="flex items-start">
                  <img
                    src={Checked}
                    width={14}
                    height={14}
                    className="mr-2 mt-1 flex-shrink-0"
                    alt="Checkmark"
                  />
                  <p className="font-poppins text-xs font-normal sm:text-sm leading-4 sm:leading-5 md:leading-6">
                    <span className="font-semibold">Instant Selling:</span> Sell
                    your holdings instantly after DDPI activation without
                    needing a T-PIN or OTP.
                  </p>
                </li>
                <li className="flex items-start">
                  <img
                    src={Checked}
                    width={14}
                    height={14}
                    className="mr-2 mt-1 flex-shrink-0"
                    alt="Checkmark"
                  />
                  <p className="font-poppins text-xs sm:text-sm font-normal leading-4 sm:leading-5 md:leading-6">
                    <span className="font-semibold">Seamless Liquidation:</span>{" "}
                    Liquidate your holdings without the hassle of daily
                    pre-authorization for each sell order.
                  </p>
                </li>
                <li className="flex items-start">
                  <img
                    src={Checked}
                    width={14}
                    height={14}
                    className="mr-2 mt-1 flex-shrink-0"
                    alt="Checkmark"
                  />
                  <p className="font-poppins text-xs sm:text-sm font-normal leading-4 sm:leading-5 md:leading-6">
                    <span className="font-semibold">Faster Transactions: </span>
                    Enjoy smoother and quicker trading experiences with fewer
                    barriers.
                  </p>
                </li>
              </ul>
              <div className="flex justify-center lg:justify-start mt-3 sm:mt-4 md:mt-10">
                <button
                  className="w-full max-w-[200px] sm:max-w-[250px] h-[40px] sm:h-[46px] rounded-lg text-white font-poppins font-semibold text-xs sm:text-sm bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 transition-colors duration-300"
                  onClick={handleActivateDDPiNow}
                >
                  Activate DDPI Now &gt;&gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        showActivateNowModel && (
          <div className="fixed inset-0  flex items-center justify-center z-50 overflow-auto p-4">
            <div className="w-full max-w-[580px] bg-white shadow-lg rounded-lg">
              <div className="p-4 pb-6 relative font-poppins">
                <div className="mb-8 justify-between items-center">
                  <button
                    onClick={handleBackButton}
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    <span className="text-sm">Back</span>
                  </button>

                  <button
                    onClick={closeModal}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="w-full max-w-[450px] mx-auto">
                  {instructions.videoId && (
                    <div className="w-full aspect-video bg-gray-200 mb-3">
                      <iframe
                        width="100%"
                        height="100%"
                        src={instructions.videoId}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <h2 className="text-base font-semibold font-poppins">
                      {instructions.title}
                    </h2>

                    <ul className="space-y-1.5 text-sm font-poppins pb-4">
                      {instructions.steps.map((step, index) => (
                        <li key={index} className="flex flex-col gap-1">
                          <div className="flex items-start gap-1">
                            {/* <span className="font-semibold font-poppins">
                              {index + 1}.
                            </span> */}
                            <div className="flex flex-col space-y-1">
                              <div
                                className="flex items-center space-x-2 flex-wrap"
                                data-tooltip-id="copy-tooltip"
                                data-tooltip-content="COPY"
                              >
                                <span className="break-all">{step}</span>
                                {step.includes("http") && (
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        step.match(/https?:\/\/[^\s]+/)[0]
                                      )
                                    }
                                    aria-label="Copy link"
                                  >
                                    <ClipboardList className="w-4 h-4 cursor-pointer text-gray-300 hover:text-gray-600 transition-colors ml-2 flex-shrink-0" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <Tooltip id="copy-tooltip" />
          </div>
        )
      )}
    </div>
  );
}

export function FyersTpinModal({ isOpen, setIsOpen, userDetails }) {
  const [loading, setLoading] = useState(false);
  const [cdslHtml, setCdslHtml] = useState("");

  const proceedWithFyersTpin = async () => {
    setLoading(true);
    try {
      const broker = userDetails.user_broker;

      if (broker === "Fyers") {
        // Generate
        console.log("hit");
        const generateTpinResponse = await fetch(
          `${server.ccxtServer.baseUrl}fyers/tpin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clientId: userDetails?.clientCode,
              accessToken: userDetails?.jwtToken,
            }),
          }
        );

        const generateTpinData = await generateTpinResponse.json();
        console.log("generateTpinData", generateTpinData);

        // if (generateTpinData.status === 0) {
        //   toast.success("TPIN generation request sent successfully.");
        //   setIsOpen(false); // set  modal  to close
        if (generateTpinData.status === 0) {
          setIsOpen(false); // Close the modal

          console.log("Submitting holdings for Fyers");
          const submitHoldingsResponse = await fetch(
            `${server.ccxtServer.baseUrl}fyers/submit-holdings`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                clientId: userDetails?.clientCode,
                accessToken: userDetails?.jwtToken,
              }),
            }
          );

          const submitHoldingsData = await submitHoldingsResponse.json();

          // CHANGE: Added condition to check if submit holdings status is 0
          if (submitHoldingsData.status === 0) {
            openPopupWindow(submitHoldingsData.data);
          } else {
            throw new Error(
              submitHoldingsData.message ||
                "Failed to submit holdings for Fyers"
            );
          }
        } else {
          throw new Error(
            generateTpinData.message || "Failed to generate TPIN for Fyers"
          );
        }
      } else {
        throw new Error("Invalid broker");
      }
    } catch (error) {
      console.error("Error in API call:", error);
      toast.error(error.message || "An error occurred during the process");
    } finally {
      setLoading(false);
    }
  };

  const openPopupWindow = (formHtml) => {
    const popupWidth = 800;
    const popupHeight = 600;
    const left = (window.innerWidth - popupWidth) / 2 + window.screenX;
    const top = (window.innerHeight - popupHeight) / 2 + window.screenY + 30;

    const popup = window.open(
      "",
      "_blank",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (popup) {
      popup.document.write(formHtml);
      popup.document.close();

      setIsOpen(false);

      const popupChecker = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(popupChecker);
          window.location.reload();
        }
      }, 300);
    } else {
      toast.error(
        "Please allow popups for this site to complete the CDSL authorization process."
      );
    }
  };
  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-none"
        showCloseButton={false}
      >
        <div className="fixed inset-0  flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-[740px] max-h-[90vh] overflow-y-auto sm:h-[323px] relative border-t border-l">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col sm:flex-row h-full items-center">
              <div className="w-full sm:w-[440px] p-6 sm:pl-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <AlertTriangle className="text-red-500 shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl font-semibold font-poppins text-[#000000B3]">
                        DDPI Inactive: Proceed with TPIN Mandate
                      </h2>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 mb-6 pl-10 font-poppins">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Use TPIN for a temporary authorization to sell selected
                      stocks while DDPI is inactive
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      This secure, one-time mandate allows smooth transactions
                      until DDPI is active
                    </li>
                  </ul>
                </div>
                {/* <div className="flex flex-row sm:gap-0 gap-4"> */}

                <button
                  onClick={proceedWithFyersTpin}
                  className="w-full sm:w-[240px] h-[45px] bg-red-500 text-white rounded-[6px] text-[13px] font-medium font-poppins hover:bg-red-600 transition-colors sm:ml-4 mt-4 sm:mt-0"
                >
                  Proceed with Authorization to Sell
                </button>
              </div>
              <div className="w-full sm:w-[240px] h-[224px] flex items-center justify-center mt-4 sm:mt-0">
                <img
                  src={Ddpi}
                  alt="DDPI illustration"
                  width={2800}
                  height={600}
                  className="w-full h-full object-contain rounded-tl-[10px]"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
