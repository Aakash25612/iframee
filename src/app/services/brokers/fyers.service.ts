import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AbstractBroker } from './abstract-broker.service';
import { Params } from '@angular/router';
import { BrokerInfo } from '../../models/BrokerInfo';
import { Broker } from '../../models/enums/Brokers';
import {
  FyersCallback,
  FyersTokenResponse,
} from '../../models/callbacks/Fyers';
import { firstValueFrom, take } from 'rxjs';
import { UserService } from '../user.service';

const CCXT_FYERS_ENDPOINT = `${environment.pythonBackendBaseUrl}/fyers`;

/** Service Layer to interact with the backends for Fyers-related activities. */
@Injectable({ providedIn: 'root' })
export class FyersBroker extends AbstractBroker {
  constructor(http: HttpClient, userService: UserService) {
      super(http, userService);
    }

  /** Returns the login url to which the user must be redirected. */
  getLoginUrl(appId: string, secretId: string): Promise<string> {
    return firstValueFrom(
      this.http
        .post<string>(
          `${CCXT_FYERS_ENDPOINT}/login-url`,
          {
            clientId: appId,
            clientSecret: secretId,
            redirectUrl: `${CCXT_FYERS_ENDPOINT}/callback`,
          },
          { headers: this.HTTP_HEADERS, responseType: 'text' as 'json' }
        )
        .pipe(take(1))
    );
  }

  /** Updates the broker keys into the database. */
  updateBrokerDetails(
    userId: string,
    appId: string,
    secretId: string
  ): Promise<BrokerInfo> {
    return this.updateBrokerKeys('fyers', {
      uid: userId,
      user_broker: Broker.FYERS,
      clientCode: appId,
      secretKey: this.encryptKey(secretId),
      redirect_url: environment.brokerConnectRedirectUrl,
    });
  }

  /** Returns {@code true} if the callback belongs to the implementing broker. */
  isMyCallback(queryParams: Params): boolean {
    return queryParams['auth_code'] ? true : false;
  }

  /** Processes the broker callback method using the {@code queryParams} for the given {@code userId}. */
  async processCallback(
    userId: string,
    queryParams: Params
  ): Promise<BrokerInfo> {
    const callbackParams = { ...queryParams } as FyersCallback;
    const user = await this.getLegacyUser();

    return this.generateAccessToken(
      user.clientCode,
      user.secretKey,
      callbackParams.auth_code
    ).then((response) =>
      this.connectBroker({
        uid: userId,
        user_broker: Broker.FYERS,
        jwtToken: response.accessToken,
      })
    );
  }

  private generateAccessToken(
    clientId: string,
    clientSecret: string,
    authCode: string
  ): Promise<FyersTokenResponse> {
    return firstValueFrom(
      this.http
        .post<FyersTokenResponse>(
          `${CCXT_FYERS_ENDPOINT}/gen-access-token`,
          {
            clientId,
            clientSecret: this.decryptKey(clientSecret),
            authCode,
          },
          { headers: this.HTTP_HEADERS }
        )
        .pipe(take(1))
    );
  }
}
