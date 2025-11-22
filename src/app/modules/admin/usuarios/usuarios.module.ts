import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';
import { RegistroUsuariosPageComponent } from './pages/usuarios-page/modals/registro-usuarios-page/registro-usuarios-page.component';
import { ModificaUsuariosPageComponent } from './pages/usuarios-page/modals/modifica-usuarios-page/modifica-usuarios-page.component';
import { DetalleUsuariosPageComponent } from './pages/usuarios-page/modals/detalle-usuarios-page/detalle-usuarios-page.component';
import { UsuariosRoutingModule } from './usuarios-routing.module';
import { ListaUsuariosPageComponent } from './pages/usuarios-page/lista-usuarios-page.component';

const BASE_MODULES = [CommonModule, SharedModule, UsuariosRoutingModule];

const BASE_COMPONENTS = [
  ListaUsuariosPageComponent,
];

const REGISTROS = [RegistroUsuariosPageComponent,
  ModificaUsuariosPageComponent,
  DetalleUsuariosPageComponent
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
export class UsuariosModule { }
