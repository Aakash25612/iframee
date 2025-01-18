import { Tenant } from '../enums/Tenants';

export interface BrokerContext {
  userEmail: string;
  tenant: Tenant;
}
