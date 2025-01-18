import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom, take } from 'rxjs';
import {
  ZerodhaCallback,
  ZerodhaTokenResponse,
} from '../../models/callbacks/Zerodha';
import { Broker } from '../../models/enums/Brokers';
import { BrokerInfo } from '../../models/BrokerInfo';
import { AbstractBroker } from './abstract-broker.service';
import { Params } from '@angular/router';
import { UserService } from '../user.service';

const CCXT_ZERODHA_ENDPOINT = `${environment.pythonBackendBaseUrl}/zerodha`;

/** Service Layer to interact with the backends for Zerodha-related activities. */
@Injectable({ providedIn: 'root' })
export class ZerodhaBroker extends AbstractBroker {
  constructor(http: HttpClient, userService: UserService) {
    super(http, userService);
  }

  /** Returns the login url to which the user must be redirected. */
  getLoginUrl(): Promise<string> {
    return firstValueFrom(
      this.http
        .post<string>(
          `${CCXT_ZERODHA_ENDPOINT}/login_url`,
          {
            apiKey: environment.zerodhaApiKey,
            site: environment.zerodhaRedirectSite,
          },
          { headers: this.HTTP_HEADERS }
        )
        .pipe(take(1))
    );
  }

  isMyCallback(queryParams: Params): boolean {
    return queryParams['request_token'] &&
      queryParams['status'] &&
      queryParams['type']
      ? true
      : false;
  }

  async processCallback(
    userId: string,
    queryParams: Params
  ): Promise<BrokerInfo> {
    const callbackParams = { ...queryParams } as ZerodhaCallback;
    return this.generateAccessToken(callbackParams).then(
      (zerodhaTokenResponse) =>
        this.connectBroker({
          uid: userId,
          user_broker: Broker.ZERODHA,
          jwtToken: zerodhaTokenResponse.access_token,
          ddpi_status: zerodhaTokenResponse.meta.demat_consent,
        })
    );
  }

  /** Generates the access token for the user. */
  private generateAccessToken(
    callbackParams: ZerodhaCallback
  ): Promise<ZerodhaTokenResponse> {
    return firstValueFrom(
      this.http
        .post<ZerodhaTokenResponse>(
          `${CCXT_ZERODHA_ENDPOINT}/gen-access-token`,
          {
            apiKey: '',
            apiSecret: '',
            requestToken: callbackParams.request_token,
          },
          { headers: this.HTTP_HEADERS }
        )
        .pipe(take(1))
    );
  }
}
