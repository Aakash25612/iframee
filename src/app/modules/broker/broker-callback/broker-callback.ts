import { Component, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZerodhaCallback } from '../../../models/callbacks/Zerodha';
import { ZerodhaBroker } from '../../../services/brokers/zerodha.service';
import { isPlatformServer } from '@angular/common';
import { BrokerFactory } from '../../../services/brokers/broker-factory';
import { environment } from '../../../../environments/environment';

@Component({
  template: '',
  standalone: true,
  imports: [],
})
export class BrokerCallbackComponent {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly brokerFactory: BrokerFactory
  ) {
    if (isPlatformServer(this.platform)) {
      return;
    }

    const userId = localStorage.getItem('userId');
    if (userId === null) {
      // throw some error here, or redirect accordingly.
    }

    const queryParams = this.route.snapshot.queryParams;
    const broker = this.brokerFactory.getBrokerFromCallbackParams(queryParams);

    // TODO(agrawalhardik93): This experience needs to be improved.
    //   Can't just throw error, if the broker can't be identified from the queryParams.
    if (broker === undefined) {
      throw new Error('Unable to identify the broker.');
    }

    broker
      .processCallback(localStorage.getItem('userId')!, queryParams)
      .then(() => {
        this.router.navigateByUrl('/');
      });
  }

  private readonly platform = inject(PLATFORM_ID);
}
