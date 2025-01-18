import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AbstractBroker } from './abstract-broker.service';
import { Params } from '@angular/router';
import { BrokerInfo } from '../../models/BrokerInfo';
import { Broker } from '../../models/enums/Brokers';
import { HdfcCallback, HdfcTokenResponse } from '../../models/callbacks/Hdfc';
import { firstValueFrom, map, take } from 'rxjs';
import { UserService } from '../user.service';

const CCXT_HDFC_ENDPOINT = `${environment.pythonBackendBaseUrl}/hdfc`;

/** Service Layer to interact with the backends for HDFC Securities related activities. */
@Injectable({ providedIn: 'root' })
export class HdfcBroker extends AbstractBroker {
  constructor(http: HttpClient, userService: UserService) {
    super(http, userService);
  }

  /** Returns the login url to which the user must be redirected. */
  getLoginUrl(apiKey: string): Promise<string> {
    return firstValueFrom(
      this.http
        .post<string>(
          `${CCXT_HDFC_ENDPOINT}/login-url`,
          { apiKey },
          { headers: this.HTTP_HEADERS, responseType: 'text' as 'json' }
        )
        .pipe(
          take(1),
          map((loginUrlWithQuotes) => loginUrlWithQuotes.trim().slice(1, -1))
        )
    );
  }

  /** Updates the broker keys into the database. */
  updateBrokerDetails(
    userId: string,
    apiKey: string,
    apiSecret: string
  ): Promise<BrokerInfo> {
    return this.updateBrokerKeys('hdfc', {
      uid: userId,
      user_broker: Broker.HDFC_SECURITIES,
      apiKey: this.encryptKey(apiKey),
      secretKey: this.encryptKey(apiSecret),
    });
  }

  /** Returns {@code true} if the callback belongs to the implementing broker. */
  isMyCallback(queryParams: Params): boolean {
    return queryParams['requestToken'] ? true : false;
  }

  /** Processes the broker callback method using the {@code queryParams} for the given {@code userId}. */
  async processCallback(
    userId: string,
    queryParams: Params
  ): Promise<BrokerInfo> {
    const callbackParams = { ...queryParams } as HdfcCallback;
    const user = await this.getLegacyUser();

    return this.generateAccessToken(
      user.apiKey,
      user.secretKey,
      callbackParams.requestToken
    ).then((response) =>
      this.connectBroker({
        uid: userId,
        user_broker: Broker.HDFC_SECURITIES,
        jwtToken: response.accessToken,
      })
    );
  }

  private generateAccessToken(
    apiKey: string,
    secretKey: string,
    requestToken: string
  ): Promise<HdfcTokenResponse> {
    return firstValueFrom(
      this.http
        .post<HdfcTokenResponse>(
          `${CCXT_HDFC_ENDPOINT}/access-token`,
          {
            apiKey: this.decryptKey(apiKey),
            apiSecret: this.decryptKey(secretKey),
            requestToken,
          },
          { headers: this.HTTP_HEADERS }
        )
        .pipe(take(1))
    );
  }
}
