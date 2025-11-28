import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/shared/components/layout/layout.component';

export const appRoutes: Route[] = [
    /* {
        path: '', loadChildren: () => import('app/modules/landing/home/home.routes'),
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
    }, */

    { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
    
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'admin' },

    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.module').then(m => m.ForgotPasswordModule) },
            {
                path: 'reset-password/:token', loadChildren: () => import('app/modules/auth/reset-password/reset-password.module').then(m => m.ResetPasswordModule)
            },

            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.module').then(m => m.AuthSignInModule) },

        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes') },
        ]
    },
    // Admin routes
    {
        path: 'admin',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: '',
                loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule)
            },
        ]
    },
    {
        path: '**',
        pathMatch: 'full',
        redirectTo: 'admin',
    },
];
