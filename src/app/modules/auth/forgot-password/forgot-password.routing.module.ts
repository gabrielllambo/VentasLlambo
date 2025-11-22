import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgotPasswordClassicComponent } from './forgot-password.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', component: ForgotPasswordClassicComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForgotPasswordRoutingModule { }