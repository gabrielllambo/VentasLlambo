import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoriaPageComponent } from './pages/categoria-page/categoria-page.component';
import { MarcaPageComponent } from './pages/marca-page/marca-page.component';
import { ProductoPageComponent } from './pages/producto-page/producto-page.component';

const routes: Routes = [
  {
    path: 'inventario',
    children: [
      { path: 'productos', component: ProductoPageComponent, data: { title: 'Listado de los Productos' } },
      { path: 'categoria', component: CategoriaPageComponent, data: { title: 'Categoría de Producto' } },
      { path: 'marca', component: MarcaPageComponent, data: { title: 'Marca del Producto' } },

    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule { }
