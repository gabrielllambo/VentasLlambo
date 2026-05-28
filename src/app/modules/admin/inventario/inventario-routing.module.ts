import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoriaPageComponent } from './pages/categoria-page/categoria-page.component';
import { MarcaPageComponent } from './pages/marca-page/marca-page.component';
import { ProductoPageComponent } from './pages/producto-page/producto-page.component';
import { LotesPageComponent } from './pages/lotes-page/lotes-page.component';
import { InventarioFisicoPageComponent } from './pages/inventario-fisico-page/inventario-fisico-page.component';
import { ReportePerdidasPageComponent } from './pages/reporte-perdidas-page/reporte-perdidas-page.component';
import { ReporteTomasFisicasPageComponent } from './pages/reporte-tomas-fisicas-page/reporte-tomas-fisicas-page.component';
import { PromocionesPageComponent } from './pages/promociones-page/promociones-page.component';
import { ReporteStockPageComponent } from './pages/reporte-stock-page/reporte-stock-page.component';
import { ReporteVencimientosPageComponent } from './pages/reporte-vencimientos-page/reporte-vencimientos-page.component';
import { ReporteMargenPageComponent } from './pages/reporte-margen-page/reporte-margen-page.component';
import { ReporteRotacionPageComponent } from './pages/reporte-rotacion-page/reporte-rotacion-page.component';
import { ReporteSinMovimientoPageComponent } from './pages/reporte-sin-movimiento-page/reporte-sin-movimiento-page.component';
import { ReporteDescuentosPageComponent } from './pages/reporte-descuentos-page/reporte-descuentos-page.component';
import { ReportesHubPageComponent } from './pages/reportes-hub-page/reportes-hub-page.component';

const routes: Routes = [
  {
    path: 'inventario',
    children: [
      { path: 'productos', component: ProductoPageComponent, data: { title: 'Listado de los Productos' } },
      { path: 'categoria', component: CategoriaPageComponent, data: { title: 'Categoría de Producto' } },
      { path: 'marca', component: MarcaPageComponent, data: { title: 'Marca del Producto' } },
      { path: 'lotes', component: LotesPageComponent, data: { title: 'Listado de Lotes' } },
      { path: 'fisico', component: InventarioFisicoPageComponent, data: { title: 'Toma Física de Inventario' } },
      { path: 'promociones', component: PromocionesPageComponent, data: { title: 'Promociones y Descuentos' } },
      { path: 'reporte-perdidas', component: ReportePerdidasPageComponent, data: { title: 'Reporte de Pérdidas' } },
      { path: 'reporte-tomas', component: ReporteTomasFisicasPageComponent, data: { title: 'Reporte de Tomas Físicas' } },
      { path: 'reporte-stock', component: ReporteStockPageComponent, data: { title: 'Stock y Valorización' } },
      { path: 'reporte-vencimientos', component: ReporteVencimientosPageComponent, data: { title: 'Reporte de Vencimientos' } },
      { path: 'reporte-margen', component: ReporteMargenPageComponent, data: { title: 'Margen de Ganancia' } },
      { path: 'reporte-rotacion', component: ReporteRotacionPageComponent, data: { title: 'Rotación de Inventario' } },
      { path: 'reporte-sin-movimiento', component: ReporteSinMovimientoPageComponent, data: { title: 'Productos Sin Movimiento' } },
      { path: 'reporte-descuentos', component: ReporteDescuentosPageComponent, data: { title: 'Impacto de Descuentos' } },
      { path: 'reportes-hub', component: ReportesHubPageComponent, data: { title: 'Dashboard' } },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule { }
