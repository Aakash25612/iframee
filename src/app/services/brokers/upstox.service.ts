import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AbstractBroker } from './abstract-broker.service';
import { Params } from '@angular/router';
import { BrokerInfo } from '../../models/BrokerInfo';
import { Broker } from '../../models/enums/Brokers';
import {
  UpstoxCallback,
  UpstoxTokenResponse,
} from '../../models/callbacks/Upstox';
import { firstValueFrom, take } from 'rxjs';
import { UserService } from '../user.service';

const CCXT_UPSTOX_ENDPOINT = `${environment.pythonBackendBaseUrl}/upstox`;

/** Service Layer to interact with the backends for Upstox-related activities. */
@Injectable({ providedIn: 'root' })
export class UpstoxBroker extends AbstractBroker {
  constructor(http: HttpClient, userService: UserService) {
    super(http, userService);
  }

  /** Returns the login url to which the user must be redirected. */
  getLoginUrl(apiKey: string, secretKey: string): Promise<string> {
    return firstValueFrom(
      this.http
        .post<string>(
          `${CCXT_UPSTOX_ENDPOINT}/login`,
          {
            apiKey: apiKey,
            apiSecret: secretKey,
            redirectUri: `${CCXT_UPSTOX_ENDPOINT}/callback`,
          },
          { headers: this.HTTP_HEADERS, responseType: 'text' as 'json' }
        )
        .pipe(take(1))
    );
  }

  /** Updates the broker keys into the database. */
  updateBrokerDetails(
    userId: string,
    apiKey: string,
    secretKey: string
  ): Promise<BrokerInfo> {
    return this.updateBrokerKeys('upstox', {
      uid: userId,
      user_broker: Broker.UPSTOX,
      apiKey: this.encryptKey(apiKey),
      secretKey: this.encryptKey(secretKey),
      redirect_uri: environment.brokerConnectRedirectUrl,
    });
  }

  /** Returns {@code true} if the callback belongs to the implementing broker. */
  isMyCallback(queryParams: Params): boolean {
    return queryParams['code'] ? true : false;
  }

  /** Processes the broker callback method using the {@code queryParams} for the given {@code userId}. */
  async processCallback(
    userId: string,
    queryParams: Params
  ): Promise<BrokerInfo> {
    const callbackParams = { ...queryParams } as UpstoxCallback;
    const user = await this.getLegacyUser();

    return this.generateAccessToken(
      user.apiKey,
      user.secretKey,
      callbackParams.code
    ).then((response) =>
      this.connectBroker({
        uid: userId,
        user_broker: Broker.UPSTOX,
        jwtToken: response.access_token,
      })
    );
  }

  private generateAccessToken(
    apiKey: string,
    apiSecret: string,
    code: string
  ): Promise<UpstoxTokenResponse> {
    return firstValueFrom(
      this.http
        .post<UpstoxTokenResponse>(
          `${CCXT_UPSTOX_ENDPOINT}/gen-access-token`,
          {
            apiKey: this.decryptKey(apiKey),
            apiSecret: this.decryptKey(apiSecret),
            code,
            redirectUri: environment.brokerConnectRedirectUrl,
          },
          { headers: this.HTTP_HEADERS }
        )
        .pipe(take(1))
    );
  }
}
