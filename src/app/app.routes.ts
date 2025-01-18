import { Routes } from '@angular/router';
import { BrokerPage } from './modules/broker/broker.page';
import { BrokerCallbackComponent } from './modules/broker/broker-callback/broker-callback';

export const routes: Routes = [
  {
    path: '',
    component: BrokerPage,
  },

  /* The path to the route below is for legacy purposes. This needs to change. */
  {
    path: 'stock-recommendation',
    component: BrokerCallbackComponent
  }
];
