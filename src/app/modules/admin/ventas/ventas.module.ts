import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ToolService } from 'app/core/services/tool/tool.service';
import { VentasRoutingModule } from './ventas-routing.module';
import { RegistroVentasPageComponent } from './pages/registro-ventas-page/registro-ventas-page.component';
import { HistorialVentasPageComponent } from './pages/historial-ventas-page/historial-ventas-page.component';
import { DetalleVentaPageComponent } from './pages/historial-ventas-page/modals/detalle-producto-page/detalle-venta-page.component';
import { ReporteVentasCategoriasPageComponent } from './pages/reporte-ventas-categorias-page/reporte-ventas-categorias-page.component';
import { ReporteVentasMarcasPageComponent } from './pages/reporte-ventas-marcas-page/reporte-ventas-marcas-page.component';
import { ReporteVentasProductosPageComponent } from './pages/reporte-ventas-productos-page/reporte-ventas-productos-page.component';

const BASE_MODULES = [CommonModule, SharedModule, VentasRoutingModule];

const BASE_COMPONENTS = [
  ReporteVentasProductosPageComponent,
  ReporteVentasCategoriasPageComponent,
  ReporteVentasMarcasPageComponent,
  RegistroVentasPageComponent,
  HistorialVentasPageComponent,
];

const DETALLE = [
  DetalleVentaPageComponent
]

const PROVIDERS = [
  {
    provide: MAT_DATE_LOCALE,
    useFactory: (localeService: ToolService) => localeService.getuserInfoLogueadoCultureInfo(),
    deps: [ToolService]
  }
]

@NgModule({
  declarations: [BASE_COMPONENTS, DETALLE],
  imports: [BASE_MODULES],
  exports: [BASE_MODULES],
  providers: [DatePipe, PROVIDERS]
})
export class VentasModule { }
