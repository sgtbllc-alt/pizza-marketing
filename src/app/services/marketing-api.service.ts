import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

export interface SignupRequest {
  name: string;
  phone: string;
  smsConsent: boolean;
}

export interface SignupResponse {
  message?: string;
  user?: unknown;
  customer?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class MarketingApiService {
  private readonly http = inject(HttpClient);
  private readonly functionsUrl = `${environment.supabaseUrl}/functions/v1`;

  signupUser(request: SignupRequest): Observable<SignupResponse> {
    return this.invokeFunction<SignupResponse>('signup-user', request);
  }

  private invokeFunction<TResponse>(functionName: string, body: unknown): Observable<TResponse> {
    const headers = new HttpHeaders({
      apikey: environment.supabaseAnonKey,
      Authorization: `Bearer ${environment.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    });

    return this.http
      .post<TResponse>(`${this.functionsUrl}/${functionName}`, body, { headers })
      .pipe(
        map((response) => response ?? ({} as TResponse)),
        catchError((error: HttpErrorResponse) => {
          const message =
            typeof error.error === 'string'
              ? error.error
              : error.error?.message || 'We could not complete signup right now. Please try again.';

          return throwError(() => new Error(message));
        }),
      );
  }
}
