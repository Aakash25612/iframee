import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  BrokerInfo,
  createBrokerInfoFromLegacyUser,
} from '../../models/BrokerInfo';
import { Params } from '@angular/router';
import { firstValueFrom, map, take } from 'rxjs';
import { LegacyUser } from '../../models/legacy/User';
import { environment } from '../../../environments/environment';
import crypto from 'crypto-js';
import { UserService } from '../user.service';
import { Tenant } from '../../models/enums/Tenants';

/** Abstract class containing the common methods functionalities across all brokers. */
export abstract class AbstractBroker {
  constructor(
    protected readonly http: HttpClient,
    private readonly userService: UserService
  ) {}

  protected readonly HTTP_HEADERS = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  /** Returns {@code true} if the callback belongs to the implementing broker. */
  abstract isMyCallback(queryParams: Params): boolean;

  /** Processes the broker callback method using the {@code queryParams} for the given {@code userId}. */
  abstract processCallback(
    userId: string,
    queryParams: Params
  ): Promise<BrokerInfo>;

  /** Updates the broker keys corresponding to the user. */
  protected updateBrokerKeys(
    broker: 'fyers' | 'hdfc' | 'icici' | 'kotak' | 'upstox',
    payload: any | null
  ): Promise<BrokerInfo> {
    return firstValueFrom(
      this.http
        .put(
          `${environment.nodeBackendBaseUrl}/api/${broker}/update-key`,
          payload,
          { headers: this.HTTP_HEADERS }
        )
        .pipe(
          take(1),
          map((response: any) =>
            createBrokerInfoFromLegacyUser(response.user_data as LegacyUser)
          )
        )
    );
  }

  /** In the backend, this API makes a test connection with the broker and updates the database. */
  protected connectBroker(payload: any | null): Promise<BrokerInfo> {
    return firstValueFrom(
      this.http
        .put(
          `${environment.nodeBackendBaseUrl}/api/user/connect-broker`,
          payload,
          { headers: this.HTTP_HEADERS }
        )
        .pipe(
          take(1),
          map((response: any) =>
            createBrokerInfoFromLegacyUser(response.user_data as LegacyUser)
          )
        )
    );
  }

  protected getLegacyUser(): Promise<LegacyUser> {
    return this.userService.getUser(
      localStorage.getItem('userEmail')!,
      localStorage.getItem('tenant')! as Tenant
    );
  }

  protected encryptKey(key: string): string | undefined {
    const encrypted = crypto.AES.encrypt(key, 'ApiKeySecret');
    return encrypted.toString();
  }

  protected decryptKey(key: string): string | undefined {
    const decrypted = crypto.AES.decrypt(key, 'ApiKeySecret');
    return decrypted.toString(crypto.enc.Utf8);
  }
}
