import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';
import { ModificaProveedorPageComponent } from './pages/registros-page/modals/modifica-proveedor-page/modifica-proveedor-page.component';
import { RegistroProveedorPageComponent } from './pages/registros-page/modals/registro-proveedor-page/registro-proveedor-page.component';
import { DetalleProveedorPageComponent } from './pages/registros-page/modals/detalle-proveedor-page/detalle-proveedor-page.component';
import { ProveedoresRoutingModule } from './proveedores-routing.module';
import { ListaProveedoresPageComponent } from './pages/registros-page/lista-proveedores-page.component';

const BASE_MODULES = [CommonModule, SharedModule,ProveedoresRoutingModule];

const BASE_COMPONENTS = [
  ListaProveedoresPageComponent,
];

const REGISTROS = [RegistroProveedorPageComponent,
  ModificaProveedorPageComponent,
  DetalleProveedorPageComponent
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
export class ProveedoresModule { }
