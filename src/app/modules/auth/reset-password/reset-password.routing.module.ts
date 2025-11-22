import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResetPasswordClassicComponent } from './reset-password.component';
import { AuthService } from 'app/core/services/auth/auth.service';

const routes: Routes = [

  {
    path: '',
    children: [
      {
        path: '',
        component: ResetPasswordClassicComponent,
        data: { title: 'ResetPassword' },
        resolve: {
          tokenData: () => inject(AuthService).VerifyTokenRestablecerContraseniaAsync(),
        },
      },
    ]
  }

];



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResetPasswordRoutingModule { }