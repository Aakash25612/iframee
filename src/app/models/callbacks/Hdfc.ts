/** Interface defining the callback for HDFC Securities. */
export interface HdfcCallback {
  requestToken: string;
}

/** Interface defining the token response received from HDFC Securities (via the CCXT server). */
export interface HdfcTokenResponse {
  accessToken: string;
  status: number;
}
