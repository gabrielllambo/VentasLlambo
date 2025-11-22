import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaClientesPageComponent } from './pages/registros-page/lista-clientes-page.component';
 
const routes: Routes = [
  {
    path: 'clientes',
    children: [
      { path: 'lista', component: ListaClientesPageComponent, data: { title: 'Lista de Clientes' } },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientesRoutingModule { }
