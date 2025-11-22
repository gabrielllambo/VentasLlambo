import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';
 import { ModificaClientePageComponent } from './pages/registros-page/modals/modifica-cliente-page/modifica-cliente-page.component';
import { RegistroClientePageComponent } from './pages/registros-page/modals/registro-cliente-page/registro-cliente-page.component';
import { DetalleClientePageComponent } from './pages/registros-page/modals/detalle-cliente-page/detalle-cliente-page.component';
import { ClientesRoutingModule } from './clientes-routing.module';
import { ListaClientesPageComponent } from './pages/registros-page/lista-clientes-page.component';

const BASE_MODULES = [CommonModule, SharedModule,ClientesRoutingModule];

const BASE_COMPONENTS = [
  ListaClientesPageComponent,
];

const REGISTROS = [RegistroClientePageComponent,
  ModificaClientePageComponent,
  DetalleClientePageComponent
]
 
const PROVIDERS = [
  {
    provide: MAT_DATE_LOCALE,
    useFactory: (localeService: ToolService) => localeService.getuserInfoLogueadoCultureInfo(),
    deps: [ToolService]
  }
]

@NgModule({
  declarations: [BASE_COMPONENTS, REGISTROS],
  imports: [BASE_MODULES],
  exports: [BASE_MODULES],
  providers: [PROVIDERS]
})
export class ClientesModule { }
