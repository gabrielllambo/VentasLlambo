import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';

// SERVICES
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';

// ROUTING
import { ComprasRoutingModule } from './compras-routing.module';

// PAGES
import { RegistroComprasPageComponent } from './pages/registro-compras-page/registro-compras-page.component';
import { HistorialComprasPageComponent } from './pages/historial-compras-page/historial-compras-page.component';
import { DetalleCompraPageComponent } from './pages/historial-compras-page/modals/detalle-producto-page/detalle-compra-page.component';
import { ReporteComprasCategoriasPageComponent } from './pages/reporte-compras-categorias-page/reporte-compras-categorias-page.component';
import { ReporteComprasMarcasPageComponent } from './pages/reporte-compras-marcas-page/reporte-compras-marcas-page.component';
import { ReporteComprasProductosPageComponent } from './pages/reporte-compras-productos-page/reporte-compras-productos-page.component';

const BASE_MODULES = [CommonModule, SharedModule, ComprasRoutingModule];

const BASE_COMPONENTS = [
  RegistroComprasPageComponent,
  HistorialComprasPageComponent,
  ReporteComprasCategoriasPageComponent,
  ReporteComprasMarcasPageComponent,
  ReporteComprasProductosPageComponent,
];

const DETALLE = [
  DetalleCompraPageComponent
];

const PROVIDERS = [
  {
    provide: MAT_DATE_LOCALE,
    useFactory: (localeService: ToolService) =>
      localeService.getuserInfoLogueadoCultureInfo(),
    deps: [ToolService]
  }
];

@NgModule({
  declarations: [
    ...BASE_COMPONENTS,
    ...DETALLE
  ],
  imports: [
    ...BASE_MODULES
  ],
  exports: [
    ...BASE_MODULES
  ],
  providers: [
    DatePipe,
    PROVIDERS
  ]
})
export class ComprasModule { }
