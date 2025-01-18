import { Broker } from './enums/Brokers';
import { Tenant } from './enums/Tenants';
import { LegacyUser } from './legacy/User';

export interface BrokerInfo {
  broker: Broker;
  userEmail: string;
  tenant: Tenant;
  connectStatus: string;

  apiKey: string;
  jwtToken: string;
  tokenExpiry: Date;

  ddpiEnabled: boolean;
  edis: boolean;
  edisUpdatedAt: Date;
  isAuthorizedForSell: boolean;
  tpinEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface Funds {
  availablecash: string;
  availableintradaypayin: string;
  availablelimitmargin: string;
  collateral: string;
  m2mrealized: string;
  m2munrealized: string;
  net: string;
  utiliseddebits: string;
  utilisedexposure: string;
  utilisedholdingsales: string;
  utilisedoptionpremium: string;
  utilisedpayout: string;
  utilisedspan: string;
  utilisedturnover: string;
}

export interface NetHoldings {
  totalholdingvalue: number;
  totalinvvalue: number;
  totalpnlpercentage: number;
  totalprofitandloss: number;
}

/* SHOULD BE DEPRECATED IN THE FUTURE. */
export function createBrokerInfoFromLegacyUser(user: LegacyUser): BrokerInfo {
  return {
    broker: user.user_broker,
    userEmail: user.email,
    tenant: user.user_onBoard_from,
    connectStatus: user.connect_broker_status,
    apiKey: user.apiKey,
    jwtToken: user.jwtToken,
    tokenExpiry: user.token_expire,
    ddpiEnabled: user.ddpi_enabled,
    edis: user.edis,
    edisUpdatedAt: user.edis_updated_at,
    isAuthorizedForSell: user.is_authorized_for_sell,
    tpinEnabled: user.tpin_enabled,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  } as BrokerInfo;
}
