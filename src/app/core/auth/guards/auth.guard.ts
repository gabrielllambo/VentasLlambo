import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { SecurityService } from '../auth.service';
import { Flags, Numeracion } from 'app/core/resource/dictionary.constants';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const _authService: SecurityService = inject(SecurityService);

    return _authService.check().pipe(
        switchMap(authenticated => {

            if (!authenticated || state.url === '/sign-out' || state.url == '/admin/configuracion') {

                if (state.url === '/sign-out' || state.url === '/admin/configuracion') {
                    return of(Flags.AccesoPermitido);
                }

                const redirectURL = `redirectURL=${state.url}`;
                const urlTree = router.parseUrl(`sign-in?${redirectURL}`);
                return of(urlTree);
            }

            const menuDataStorage = _authService.getMenuStorage();

            if (!menuDataStorage || menuDataStorage.length === Numeracion.Cero) {
                return of(router.parseUrl('sign-in'));
            }

            const requestedUrl = state.url.startsWith('/') ? state.url : `/${state.url}`;
            const isAllowed = menuDataStorage.some((menu: { ruta: string }) => menu.ruta === requestedUrl);

            if (!isAllowed) {

                const firstAllowedRoute = menuDataStorage.find(item => item.ruta);

                if (firstAllowedRoute && firstAllowedRoute.ruta) {
                    return of(router.parseUrl(firstAllowedRoute.ruta));
                }

                return of(router.parseUrl('sign-in'));
            }

            return of(Flags.AccesoPermitido);
        }),
    );
};
