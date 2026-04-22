import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoriaPageComponent } from './pages/categoria-page/categoria-page.component';
import { MarcaPageComponent } from './pages/marca-page/marca-page.component';
import { ProductoPageComponent } from './pages/producto-page/producto-page.component';
import { LotesPageComponent } from './pages/lotes-page/lotes-page.component';
import { InventarioFisicoPageComponent } from './pages/inventario-fisico-page/inventario-fisico-page.component';

const routes: Routes = [
  {
    path: 'inventario',
    children: [
      { path: 'productos', component: ProductoPageComponent, data: { title: 'Listado de los Productos' } },
      { path: 'categoria', component: CategoriaPageComponent, data: { title: 'Categoría de Producto' } },
      { path: 'marca', component: MarcaPageComponent, data: { title: 'Marca del Producto' } },
      { path: 'lotes', component: LotesPageComponent, data: { title: 'Listado de Lotes' } },
      { path: 'fisico', component: InventarioFisicoPageComponent, data: { title: 'Toma Física de Inventario' } }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule { }
