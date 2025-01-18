import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  BrokerInfo,
  createBrokerInfoFromLegacyUser,
} from '../../models/BrokerInfo';
import { Broker } from '../../models/enums/Brokers';
import { firstValueFrom, map, take } from 'rxjs';
import { LegacyUser } from '../../models/legacy/User';

/** Service Layer to interact with the backends for IIFL Securities related activities. */
@Injectable({ providedIn: 'root' })
export class IiflSecuritiesBroker {
  constructor(private readonly http: HttpClient) {}

  /** In the backend, this API makes a test connection with the broker and updates the database. */
  connectBroker(
    userId: string,
    clientCode: string,
    password: string,
    my2pin: string
  ): Promise<BrokerInfo> {
    return firstValueFrom(
      this.http
        .put(
          `${environment.nodeBackendBaseUrl}/api/user/connect-broker`,
          {
            uid: userId,
            user_broker: Broker.IIFL_SECURITIES,
            clientCode,
            password,
            apiKey: my2pin,
          },
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
          }
        )
        .pipe(
          take(1),
          map((response: any) =>
            createBrokerInfoFromLegacyUser(response.user_data as LegacyUser)
          )
        )
    );
  }
}
