import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AbstractBroker } from './abstract-broker.service';
import { Params } from '@angular/router';
import { BrokerInfo } from '../../models/BrokerInfo';
import { Broker } from '../../models/enums/Brokers';
import { AngelOneCallback } from '../../models/callbacks/AngelOne';
import { UserService } from '../user.service';

/** Service Layer to interact with the backends for AngelOne-related activities. */
@Injectable({ providedIn: 'root' })
export class AngelOneBroker extends AbstractBroker {
  constructor(http: HttpClient, userService: UserService) {
    super(http, userService);
  }

  /** Returns the login url to which the user must be redirected. */
  getLoginUrl(): string {
    return `https://smartapi.angelbroking.com/publisher-login?api_key=${environment.angelOneApiKey}`;
  }

  /** Returns {@code true} if the callback belongs to the implementing broker. */
  isMyCallback(queryParams: Params): boolean {
    return queryParams['auth_token'] &&
      queryParams['feed_token'] &&
      queryParams['refresh_token']
      ? true
      : false;
  }

  /** Processes the broker callback method using the {@code queryParams} for the given {@code userId}. */
  processCallback(userId: string, queryParams: Params): Promise<BrokerInfo> {
    const callbackParams = { ...queryParams } as AngelOneCallback;
    return this.connectBroker({
      uid: userId,
      user_broker: Broker.ANGEL_ONE,
      apiKey: environment.angelOneApiKey,
      jwtToken: callbackParams.auth_token,
    });
  }
}
