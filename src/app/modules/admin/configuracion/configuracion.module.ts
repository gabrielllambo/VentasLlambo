import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';
import { ConfiguracionPageComponent } from './pages/configuracion-page.component';
import { SettingsAccountComponent } from './pages/account/account.component';
import { SettingsSecurityComponent } from './pages/security/security.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';
 
const BASE_MODULES = [CommonModule, SharedModule, ConfiguracionRoutingModule];

const COMPONENTS = [
  ConfiguracionPageComponent,
  SettingsAccountComponent,
  SettingsSecurityComponent,
 
];

const PROVIDERS = [
  {
    provide: MAT_DATE_LOCALE,
    useFactory: (localeService: ToolService) => localeService.getuserInfoLogueadoCultureInfo(),
    deps: [ToolService]
  }
]

@NgModule({
  declarations: [...COMPONENTS],
  imports: [BASE_MODULES],
  exports: [...COMPONENTS, BASE_MODULES],
  providers: [DatePipe, PROVIDERS]
})
export class ConfiguracionModule { }
