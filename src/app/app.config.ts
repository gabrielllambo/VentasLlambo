import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideFuse } from '@fuse';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { mockApiServices } from 'app/mock-api';
import { provideToastr } from 'ngx-toastr';
import { registerLocaleData } from '@angular/common';

import localeEsES from '@angular/common/locales/es'
import localeEsAR from '@angular/common/locales/es-AR'
import localeEsBO from '@angular/common/locales/es-BO'
import localeEsCL from '@angular/common/locales/es-CL'
import localeEsCO from '@angular/common/locales/es-CO'
import localeEsCR from '@angular/common/locales/es-CR'
import localeEsEC from '@angular/common/locales/es-EC'
import localeEsSV from '@angular/common/locales/es-SV'
import localeEsUS from '@angular/common/locales/es-US'
import localeEsGT from '@angular/common/locales/es-GT'
import localeEsGQ from '@angular/common/locales/es-GQ'
import localeEsHN from '@angular/common/locales/es-HN'
import localeEsMX from '@angular/common/locales/es-MX'
import localeEsNI from '@angular/common/locales/es-NI'
import localeEsPA from '@angular/common/locales/es-PA'
import localeEsPY from '@angular/common/locales/es-PY'
import localeEsPE from '@angular/common/locales/es-PE'
import localeEsPR from '@angular/common/locales/es-PR'
import localeEsDO from '@angular/common/locales/es-DO'
import localeEsUY from '@angular/common/locales/es-UY'
import localeEsVE from '@angular/common/locales/es-VE'
import localePtBR from '@angular/common/locales/pt';
import localeEsCU from '@angular/common/locales/es-CU';
import localeFrHT from '@angular/common/locales/fr';
import localeEnBZ from '@angular/common/locales/en';
import localeEnGY from '@angular/common/locales/en';
import localeNlSR from '@angular/common/locales/nl';
import localeEnFK from '@angular/common/locales/en';

registerLocaleData(localeEsAR);
registerLocaleData(localeEsBO);
registerLocaleData(localeEsCL);
registerLocaleData(localeEsCO);
registerLocaleData(localeEsCR);
registerLocaleData(localeEsEC);
registerLocaleData(localeEsSV);
registerLocaleData(localeEsUS);
registerLocaleData(localeEsGT);
registerLocaleData(localeEsGQ);
registerLocaleData(localeEsHN);
registerLocaleData(localeEsMX);
registerLocaleData(localeEsNI);
registerLocaleData(localeEsPA);
registerLocaleData(localeEsPY);
registerLocaleData(localeEsPE);
registerLocaleData(localeEsPR);
registerLocaleData(localeEsDO);
registerLocaleData(localeEsUY);
registerLocaleData(localeEsVE);
registerLocaleData(localeEsES);
registerLocaleData(localePtBR);
registerLocaleData(localeEsCU);
registerLocaleData(localeFrHT);
registerLocaleData(localeEnBZ)
registerLocaleData(localeEnGY);
registerLocaleData(localeNlSR);
registerLocaleData(localeEnFK);


export const appConfig: ApplicationConfig = {
    providers: [
        provideToastr(),
        provideAnimations(),
        provideHttpClient(),
        provideRouter(appRoutes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
        ),
        provideAuth(),
        provideIcons(),
        provideFuse({
            mockApi: {
                delay: 0,
                services: mockApiServices,
            },
            fuse: {
                layout: 'modern',
                scheme: 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-default',
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
    ],
};
