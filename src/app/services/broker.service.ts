import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { take, map, firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  BrokerInfo,
  Funds,
  NetHoldings,
  createBrokerInfoFromLegacyUser,
} from '../models/BrokerInfo';
import { Tenant } from '../models/enums/Tenants';
import { UserService } from './user.service';

/** Service Layer to interact with the Node Backend. */
@Injectable({ providedIn: 'root' })
export class BrokerService {
  constructor(
    private readonly http: HttpClient,
    private readonly userService: UserService
  ) {}

  /** Fetches the {@code BrokerInfo} corresponding to a {@code userEmail}. */
  async getBroker(userEmail: string, tenant: Tenant): Promise<BrokerInfo> {
    return this.userService
      .getUser(userEmail, tenant)
      .then((legacyUser) => createBrokerInfoFromLegacyUser(legacyUser));
  }

  /** Fetches the {@code Funds} corresponding to a {@code userEmail}'s connected broker. */
  getFunds(userEmail: string, tenant: Tenant): Promise<Funds> {
    return firstValueFrom(
      this.http
        .get(
          `${environment.nodeBackendBaseUrl}/api/user/${userEmail}/broker/funds?tenant=${tenant}`,
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
          }
        )
        .pipe(
          take(1),
          map((response: any) => {
            if (response.message === 'Incorrect `api_key` or `access_token`.') {
              throw new Error('Broker not connected.');
            }
            return response.data as Funds;
          })
        )
    );
  }

  /** Fetches the {@code NetHoldings} corresponding to a {@code userEmail}'s connected broker. */
  getNetHoldings(userEmail: string, tenant: Tenant): Promise<NetHoldings> {
    return firstValueFrom(
      this.http
        .get(
          `${environment.nodeBackendBaseUrl}/api/user/${userEmail}/broker/all-holdings?tenant=${tenant}`,
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
          }
        )
        .pipe(
          take(1),
          map((response: any) => {
            if (response.message === 'Incorrect `api_key` or `access_token`.') {
              throw new Error('Broker not connected.');
            }
            return response.totalHoldings as NetHoldings;
          })
        )
    );
  }
}
