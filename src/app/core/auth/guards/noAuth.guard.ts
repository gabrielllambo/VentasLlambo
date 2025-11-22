import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { SecurityService } from 'app/core/auth/auth.service';
import { of, switchMap } from 'rxjs';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(SecurityService).check().pipe(
        switchMap((authenticated) =>
        {

            // If the userInfoLogueado is authenticated...
            if ( authenticated )
            {
                return of(router.parseUrl('login'));
            }

            // Allow the access
            return of(true);
        }),
    );
};
