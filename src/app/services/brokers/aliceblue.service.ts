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

/** Service Layer to interact with the backends for AliceBlue related activities. */
@Injectable({ providedIn: 'root' })
export class AliceBlueBroker {
  constructor(private readonly http: HttpClient) {}

  /** In the backend, this API makes a test connection with the broker and updates the database. */
  connectBroker(
    userId: string,
    aliceBlueUserId: string,
    apiKey: string
  ): Promise<BrokerInfo> {
    return firstValueFrom(
      this.http
        .put(
          `${environment.nodeBackendBaseUrl}/api/user/connect-broker`,
          {
            uid: userId,
            user_broker: Broker.ALICE_BLUE,
            clientCode: aliceBlueUserId,
            apiKey: apiKey,
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
