import { NgModule } from '@angular/core'; 
import { SharedModule } from 'app/shared/shared.module';
import { AuthSignInComponent } from './sign-in.component';
import { AuthSignInRoutingModule } from './sign-in.routing.module';
 
const COMPONENTS = [AuthSignInComponent]

@NgModule({
  declarations: [
    COMPONENTS
  ],
  imports: [
    AuthSignInRoutingModule,
    SharedModule
  ],
 
 
})
export class AuthSignInModule { }
