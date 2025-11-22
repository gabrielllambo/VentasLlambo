import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthSignInComponent } from './sign-in.component';

const routes: Routes = [
    {
      path: '',
      children: [
        { path: '', component: AuthSignInComponent},
      ]
    }
  ];
  
  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class AuthSignInRoutingModule { }