/** Interface defining the callback for Zerodha. */
export interface ZerodhaCallback {
  request_token: string;
  status: string;
  type: string;
}

export interface ZerodhaTokenResponseMeta {
  demat_consent: string;
}

/** Interface defining the token response received from Zerodha (via the CCXT server). */
export interface ZerodhaTokenResponse {
  access_token: string;
  api_key: string;
  avatar_url: string;
  email: string;
  enctoken: string;
  exchanges: readonly string[];
  login_time: Date;
  meta: ZerodhaTokenResponseMeta;
  order_types: readonly string[];
  products: readonly string[];
  public_token: string;
  refresh_token: string;
  user_id: string;
  user_name: string;
  user_shortname: string;
  user_type: string;
}
