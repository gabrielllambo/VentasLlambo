import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { InventarioRoutingModule } from './inventario-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { CategoriaPageComponent } from './pages/categoria-page/categoria-page.component';
import { RegistroCategoriaPageComponent } from './pages/categoria-page/modals/registro-categoria-page/registro-categoria-page.component';
import { ModificaCategoriaPageComponent } from './pages/categoria-page/modals/modifica-categoria-page/modifica-categoria-page.component';
import { DetalleCategoriaPageComponent } from './pages/categoria-page/modals/detalle-categoria-page/detalle-categoria-page.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';
import { MarcaPageComponent } from './pages/marca-page/marca-page.component';
import { RegistroMarcaPageComponent } from './pages/marca-page/modals/registro-marca-page/registro-marca-page.component';
import { ModificaMarcaPageComponent } from './pages/marca-page/modals/modifica-marca-page/modifica-marca-page.component';
import { DetalleMarcaPageComponent } from './pages/marca-page/modals/detalle-marca-page/detalle-marca-page.component';
import { ProductoPageComponent } from './pages/producto-page/producto-page.component';
import { ModificaProductoPageComponent } from './pages/producto-page/modals/modifica-producto-page/modifica-producto-page.component';
import { DetalleProductoPageComponent } from './pages/producto-page/modals/detalle-producto-page/detalle-producto-page.component';
import { RegistroProductoPageComponent } from './pages/producto-page/modals/registro-producto-page/registro-producto-page.component';

const BASE_MODULES = [CommonModule, SharedModule, InventarioRoutingModule];

const BASE_COMPONENTS = [
  CategoriaPageComponent,
  MarcaPageComponent,
  ProductoPageComponent
];

const PRODUCTO = [RegistroProductoPageComponent,
  ModificaProductoPageComponent,
  DetalleProductoPageComponent

]

const CATEGORIA = [RegistroCategoriaPageComponent,
  ModificaCategoriaPageComponent,
  DetalleCategoriaPageComponent
]

const MARCA = [RegistroMarcaPageComponent,
  ModificaMarcaPageComponent,
  DetalleMarcaPageComponent
]

const PROVIDERS = [
  {
    provide: MAT_DATE_LOCALE,
    useFactory: (localeService: ToolService) => localeService.getuserInfoLogueadoCultureInfo(),
    deps: [ToolService]
  }
]

@NgModule({
  declarations: [BASE_COMPONENTS, CATEGORIA, MARCA, PRODUCTO],
  imports: [BASE_MODULES],
  exports: [BASE_MODULES],
  providers: [DatePipe, PROVIDERS]
})
export class InventarioModule { }
