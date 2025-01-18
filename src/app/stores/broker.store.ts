import { Injectable } from '@angular/core';
import { Funds, NetHoldings } from '../models/BrokerInfo';
import { BrokerService } from '../services/broker.service';

@Injectable({ providedIn: 'root' })
export class BrokerStore {
  constructor(private readonly brokerService: BrokerService) {}

  private funds?: Funds;
  private netHoldings?: NetHoldings;

  isConnected(): boolean {
    return this.funds && this.netHoldings ? true : false;
  }

  initialize(funds: Funds, netHoldings: NetHoldings) {
    this.funds = funds;
    this.netHoldings = netHoldings;
  }

  getFunds(): Funds | undefined {
    return this.funds;
  }

  getNetHoldings(): NetHoldings | undefined {
    return this.netHoldings;
  }
}
