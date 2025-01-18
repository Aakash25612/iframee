import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Lara from '@primeng/themes/lara';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: definePreset(Lara, {
          semantic: {
              primary: {
                  50: '{sky.50}',
                  100: '{sky.100}',
                  200: '{sky.200}',
                  300: '{sky.300}',
                  400: '{sky.400}',
                  500: '{sky.500}',
                  600: '{sky.600}',
                  700: '{sky.700}',
                  800: '{sky.800}',
                  900: '{sky.900}',
                  950: '{sky.950}'
              }
          }
      }),
        options: {
          darkModeSelector: false,
        },
      },
    }),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
  ],
};
