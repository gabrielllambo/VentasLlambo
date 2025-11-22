import { NgModule } from '@angular/core';
import { ResetPasswordClassicComponent } from './reset-password.component';
import { ResetPasswordRoutingModule } from './reset-password.routing.module';
import { SharedModule } from 'app/shared/shared.module';

const COMPONENTS = [ResetPasswordClassicComponent]

@NgModule({
  declarations: [
    COMPONENTS
  ],
  imports: [
    ResetPasswordRoutingModule,
    SharedModule
  ],


})
export class ResetPasswordModule { }


