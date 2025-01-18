import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AbstractBroker } from './abstract-broker.service';
import { Params } from '@angular/router';
import { BrokerInfo } from '../../models/BrokerInfo';
import { Broker } from '../../models/enums/Brokers';
import {
  CustomerDetailsResponse,
  IciciDirectCallback,
} from '../../models/callbacks/Icici';
import { firstValueFrom, take } from 'rxjs';
import { UserService } from '../user.service';

const CCXT_ICICI_ENDPOINT = `${environment.pythonBackendBaseUrl}/icici`;

/** Service Layer to interact with the backends for IciciDirect-related activities. */
@Injectable({ providedIn: 'root' })
export class IciciDirectBroker extends AbstractBroker {
  constructor(http: HttpClient, userService: UserService) {
    super(http, userService);
  }

  /** Returns the login url to which the user must be redirected. */
  getLoginUrl(apiKey: string): string {
    return `https://api.icicidirect.com/apiuser/login?api_key=${encodeURIComponent(
      apiKey
    )}`;
  }

  /** Updates the broker keys into the database. */
  updateBrokerDetails(
    userId: string,
    apiKey: string,
    secretKey: string
  ): Promise<BrokerInfo> {
    return this.updateBrokerKeys('icici', {
      uid: userId,
      user_broker: Broker.ICICI_DIRECT,
      apiKey: this.encryptKey(apiKey),
      secretKey: this.encryptKey(secretKey),
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
    const callbackParams = { ...queryParams } as IciciDirectCallback;
    const user = await this.getLegacyUser();

    return this.getCustomerDetails(user.apiKey, callbackParams.apisession).then(
      (response) =>
        this.connectBroker({
          uid: userId,
          user_broker: Broker.ICICI_DIRECT,
          jwtToken: response.Success.session_token,
        })
    );
  }

  private getCustomerDetails(
    apiKey: string,
    apiSession: string
  ): Promise<CustomerDetailsResponse> {
    return firstValueFrom(
      this.http
        .post<CustomerDetailsResponse>(
          `${CCXT_ICICI_ENDPOINT}/customer-details`,
          {
            apiKey: this.decryptKey(apiKey),
            sessionToken: apiSession,
          },
          { headers: this.HTTP_HEADERS }
        )
        .pipe(take(1))
    );
  }
}
