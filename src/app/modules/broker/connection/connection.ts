import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ListboxModule, ListboxChangeEvent } from 'primeng/listbox';

import { Broker } from '../../../models/enums/Brokers';
import { AliceBlueComponent } from './aliceblue/aliceblue';
import { DhanComponent } from './dhan/dhan';
import { FyersComponent } from './fyers/fyers';
import { HdfcSecuritiesComponent } from './hdfc/hdfc';
import { IciciDirectComponent } from './icici/icici';
import { IiflSecuritiesComponent } from './iifl/iifl';
import { KotakComponent } from './kotak/kotak';
import { UpstoxComponent } from './upstox/upstox';
import { AngelOneBroker } from '../../../services/brokers/angelone.service';
import { ZerodhaBroker } from '../../../services/brokers/zerodha.service';

@Component({
  selector: 'aq-broker-connection',
  templateUrl: 'connection.html',
  styleUrl: 'connection.scss',
  standalone: true,
  imports: [
    // Broker Components - Start
    AliceBlueComponent,
    DhanComponent,
    FyersComponent,
    HdfcSecuritiesComponent,
    IciciDirectComponent,
    IiflSecuritiesComponent,
    KotakComponent,
    UpstoxComponent,
    // Broker Components - End
    CommonModule,
    FormsModule,
    ListboxModule,
  ],
})
export class BrokerConnectionComponent {
  constructor(
    private readonly angelOneBroker: AngelOneBroker,
    private readonly zerodhaBroker: ZerodhaBroker
  ) {}

  protected Broker = Broker;

  protected selectedBroker!: Broker;

  protected brokers: Broker[] = Object.values(Broker)
    .filter(
      (broker) =>
        !broker.toString().startsWith('function getImageUrl') &&
        broker !== Broker.KOTAK
    )
    .map((broker) => broker as Broker);

  onSelectedBrokerChange(event: ListboxChangeEvent) {
    this.selectedBroker = event.value;

    if (this.selectedBroker === Broker.ZERODHA) {
      this.zerodhaBroker.getLoginUrl().then((url) => {
        window.location.href = url;
      });
    } else if (this.selectedBroker === Broker.ANGEL_ONE) {
      window.location.href = this.angelOneBroker.getLoginUrl();
    }
  }

  protected getBrokerImage(broker: Broker) {
    return Broker.getImageUrl(broker);
  }
}
