import { Params } from '@angular/router';
import { ZerodhaBroker } from './zerodha.service';
import { AbstractBroker } from './abstract-broker.service';
import { Injectable } from '@angular/core';
import { AngelOneBroker } from './angelone.service';
import { FyersBroker } from './fyers.service';
import { HdfcBroker } from './hdfc.service';
import { IciciDirectBroker } from './icici.service';
import { UpstoxBroker } from './upstox.service';

/** Factory class generating broker instances. */
@Injectable({ providedIn: 'root' })
export class BrokerFactory {
  constructor(
    angelOneBroker: AngelOneBroker,
    fyersBroker: FyersBroker,
    hdfcBroker: HdfcBroker,
    iciciBroker: IciciDirectBroker,
    upstoxBroker: UpstoxBroker,
    zerodhaBroker: ZerodhaBroker
  ) {
    this.brokers = [
      angelOneBroker,
      fyersBroker,
      hdfcBroker,
      iciciBroker,
      upstoxBroker,
      zerodhaBroker,
    ];
  }

  private readonly brokers: AbstractBroker[];

  getBrokerFromCallbackParams(queryParams: Params): AbstractBroker | undefined {
    return this.brokers.find((broker) => broker.isMyCallback(queryParams));
  }
}
