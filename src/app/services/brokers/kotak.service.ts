import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AbstractBroker } from './abstract-broker.service';
import { Params } from '@angular/router';
import { BrokerInfo } from '../../models/BrokerInfo';
import { Broker } from '../../models/enums/Brokers';
import { KotakCallback } from '../../models/callbacks/Kotak';
import { firstValueFrom, take } from 'rxjs';
import { UserService } from '../user.service';

const CCXT_KOTAK_ENDPOINT = `${environment.pythonBackendBaseUrl}/kotak`;

/** Service Layer to interact with the backends for Kotak-related activities. */
@Injectable({ providedIn: 'root' })
export class KotakBroker extends AbstractBroker {
  constructor(http: HttpClient, userService: UserService) {
    super(http, userService);
  }

  /** Sends a one-time password to the user. */
  getOtp(
    consumerKey: string,
    consumerSecret: string,
    password: string,
    pan: string
  ) {
    return firstValueFrom(
      this.http
        .put(
          `${CCXT_KOTAK_ENDPOINT}/kotak/get-otp`,
          {
            consumerKey,
            consumerSecret,
            password,
            userid: '',
            pan: pan,
          },
          { headers: this.HTTP_HEADERS }
        )
        .pipe(take(1))
    );
  }

  /** Updates the broker keys into the database. */
  updateBrokerDetails(
    userId: string,
    consumerKey: string,
    consumerSecret: string,
    password: string
  ): Promise<BrokerInfo> {
    return this.updateBrokerKeys('kotak', {
      uid: userId,
      user_broker: Broker.KOTAK,
      apiKey: this.encryptKey(consumerKey),
      secretKey: this.encryptKey(consumerSecret),
    });
  }

  /** Returns {@code true} if the callback belongs to the implementing broker. */
  isMyCallback(queryParams: Params): boolean {
    return queryParams['apisession'] ? true : false;
  }

  /** Processes the broker callback method using the {@code queryParams} for the given {@code userId}. */
  async processCallback(
    userId: string,
    queryParams: Params
  ): Promise<BrokerInfo> {
    const callbackParams = { ...queryParams } as KotakCallback;
    const user = await this.getLegacyUser();

    return this.connectBroker({
      uid: userId,
      user_broker: Broker.KOTAK,
      jwtToken: '',
    });
  }
}
