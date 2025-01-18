import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, map, take } from 'rxjs';

import { environment } from '../../environments/environment';
import { LegacyUser } from '../models/legacy/User';
import { Tenant } from '../models/enums/Tenants';

/** Service Layer to interact with the Node Backend for user-related activities. */
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  /** Creates a new {@link LegacyUser} in the backend. */
  createMinimalUser(userEmail: string, tenant: Tenant): Promise<LegacyUser> {
    return firstValueFrom(
      this.http
        .post<LegacyUser>(
          `${environment.nodeBackendBaseUrl}/api/users`,
          {
            email: userEmail,
            tenant,
          },
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
          }
        )
        .pipe(
          take(1),
          map((response: any) => response.user)
        )
    );
  }

  /** Returns the {@link LegacyUser} corresponding to the {@code userEmail} and {@code tenant}. */
  getUser(userEmail: string, tenant: Tenant): Promise<LegacyUser> {
    return firstValueFrom(
      this.http
        .get<LegacyUser>(
          `${environment.nodeBackendBaseUrl}/api/users/${userEmail}?tenant=${tenant}`
        )
        .pipe(
          take(1),
          map((response: any) => response.user)
        )
    );
  }
}
