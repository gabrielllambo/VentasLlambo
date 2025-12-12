import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// PÁGINAS DE COMPRAS
import { RegistroComprasPageComponent } from './pages/registro-compras-page/registro-compras-page.component';
import { HistorialComprasPageComponent } from './pages/historial-compras-page/historial-compras-page.component';
import { ReporteComprasCategoriasPageComponent } from './pages/reporte-compras-categorias-page/reporte-compras-categorias-page.component';
import { ReporteComprasMarcasPageComponent } from './pages/reporte-compras-marcas-page/reporte-compras-marcas-page.component';
import { ReporteComprasProductosPageComponent } from './pages/reporte-compras-productos-page/reporte-compras-productos-page.component';

const routes: Routes = [
  {
    path: 'compras',
    children: [
      { path: 'registro', component: RegistroComprasPageComponent, data: { title: 'Registro de Compras' } },
      { path: 'historial', component: HistorialComprasPageComponent, data: { title: 'Historial de Compras' } },
      { path: 'reporte-categorias', component: ReporteComprasCategoriasPageComponent, data: { title: 'Reporte de Compras por Categorías' } },
      { path: 'reporte-marcas', component: ReporteComprasMarcasPageComponent, data: { title: 'Reporte de Compras por Marcas' } },
      { path: 'reporte-productos', component: ReporteComprasProductosPageComponent, data: { title: 'Reporte de Compras por Productos' } },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComprasRoutingModule { }
