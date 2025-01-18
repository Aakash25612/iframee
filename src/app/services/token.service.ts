import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, map, take } from 'rxjs';

import { environment } from '../../environments/environment';

/** Service Layer to interact with the Node Backend for token-related activities. */
@Injectable({ providedIn: 'root' })
export class TokenService<Context> {
  constructor(private readonly http: HttpClient) {}

  /** Verifies the {@code token} and fetches the token context. */
  getContext(b64Token: string): Promise<Context> {
    return firstValueFrom(
      this.http
        .post<Context>(
          `${environment.nodeBackendBaseUrl}/api/tokens/verify`,
          { token: atob(b64Token) },
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
          }
        )
        .pipe(
          take(1),
          map((response: any) => response.context)
        )
    );
  }
}
