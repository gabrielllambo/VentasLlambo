import { NgModule } from '@angular/core';
import { ForgotPasswordClassicComponent } from './forgot-password.component';
import { SharedModule } from 'app/shared/shared.module';
import { ForgotPasswordRoutingModule } from './forgot-password.routing.module';

const COMPONENTS = [ForgotPasswordClassicComponent]

@NgModule({
  declarations: [
    COMPONENTS
  ],
  imports: [
    ForgotPasswordRoutingModule,
    SharedModule
  ],
 
 
})
export class ForgotPasswordModule { }


