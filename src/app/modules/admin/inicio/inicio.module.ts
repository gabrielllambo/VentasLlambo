import { NgModule } from '@angular/core';
import { InicioRoutingModule } from './inicio-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { InicioPageComponent } from './pages/inicio-page/inicio-page.component';
import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';

const BASE_MODULES = [CommonModule, InicioRoutingModule, SharedModule];

const BASE_COMPONENTS = [InicioPageComponent]

const PROVIDERS = [
  {
    provide: MAT_DATE_LOCALE,
    useFactory: (localeService: ToolService) => localeService.getuserInfoLogueadoCultureInfo(),
    deps: [ToolService]
  }
]
 
@NgModule({
  declarations: [...BASE_COMPONENTS],
  imports: [BASE_MODULES],
  exports: [BASE_MODULES],
  providers: [PROVIDERS]

})
export class InicioModule { }
