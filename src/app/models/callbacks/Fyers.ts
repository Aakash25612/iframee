/** Interface defining the callback for Fyers. */
export interface FyersCallback {
  auth_code: string;
}

/** Interface defining the token response received from Fyers (via the CCXT server). */
export interface FyersTokenResponse {
  accessToken: string;
  message: string;
  status: number;
}
