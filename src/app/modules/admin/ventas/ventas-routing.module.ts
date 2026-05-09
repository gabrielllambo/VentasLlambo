import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroVentasPageComponent } from './pages/registro-ventas-page/registro-ventas-page.component';
import { HistorialVentasPageComponent } from './pages/historial-ventas-page/historial-ventas-page.component';
import { ReporteVentasCategoriasPageComponent } from './pages/reporte-ventas-categorias-page/reporte-ventas-categorias-page.component';
import { ReporteVentasMarcasPageComponent } from './pages/reporte-ventas-marcas-page/reporte-ventas-marcas-page.component';
import { ReporteVentasProductosPageComponent } from './pages/reporte-ventas-productos-page/reporte-ventas-productos-page.component';
import { ReporteGananciasPageComponent } from './pages/reporte-ganancias-page/reporte-ganancias-page.component';

const routes: Routes = [
  {
    path: 'ventas',
    children: [
      { path: 'registro', component: RegistroVentasPageComponent, data: { title: 'Registro de Ventas' } },
      { path: 'historial', component: HistorialVentasPageComponent, data: { title: 'Historial de las Ventas' } },
      { path: 'reporte-categorias', component: ReporteVentasCategoriasPageComponent, data: { title: 'Reporte de Ventas Por Categorías' } },
      { path: 'reporte-marcas', component: ReporteVentasMarcasPageComponent, data: { title: 'Reporte de Ventas Por Marcas' } },
      { path: 'reporte-productos', component: ReporteVentasProductosPageComponent, data: { title: 'Reporte de Ventas Por Productos' } },
      { path: 'reporte-ganancias', component: ReporteGananciasPageComponent, data: { title: 'Dashboard de Ganancias' } },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VentasRoutingModule { }
