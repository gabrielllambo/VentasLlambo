import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';
import { NegocioRoutingModule } from './negocio-routing.module';
import { NegocioPageComponent } from './pages/negocio-page/negocio-page.component';
import { InformacionNegocioComponent } from './pages/informacion/informacion.component';
 
const BASE_MODULES = [CommonModule, SharedModule, NegocioRoutingModule];

const COMPONENTS = [
  NegocioPageComponent,
  InformacionNegocioComponent
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
export class NegocioModule { }
