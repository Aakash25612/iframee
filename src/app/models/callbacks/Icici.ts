/** Interface defining the callback for ICICI Direct. */
export interface IciciDirectCallback {
  apisession: string;
}

/** Interface defining the customer details. */
export interface CustomerDetails {
  commodity_allowed: string;
  commodity_exchange_status: string;
  commodity_trade_date: Date;
  exg_status: { [key: string]: string };
  exg_trade_date: { [key: string]: Date };
  idirect_ORD_TYP: string;
  idirect_lastlogin_time: Date;
  idirect_user_name: string;
  idirect_userid: string;
  mf_holding_mode_popup_flg: string;
  segments_allowed: { [key: string]: string };
  session_token: string;
}

/** Interface defining the customer details API response received from ICICI Direct (via the CCXT server). */
export interface CustomerDetailsResponse {
  Error: string | null;
  Status: number;
  Success: CustomerDetails;
}
