/** Interface defining the callback for Upstox. */
export interface UpstoxCallback {
  code: string;
}

/** Interface defining the token response received from Upstox (via the CCXT server). */
export interface UpstoxTokenResponse {
  access_token: string;
  email: string
    exchanges: readonly string[];
    extended_token: string|null;
    is_active: boolean;
    order_types: readonly string[];
    poa: boolean
    products: readonly string[];
    user_id: string;
    user_name: string;
    user_type: string;
}
