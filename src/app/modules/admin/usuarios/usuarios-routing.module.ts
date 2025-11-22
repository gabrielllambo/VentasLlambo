import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaUsuariosPageComponent } from './pages/usuarios-page/lista-usuarios-page.component';

const routes: Routes = [
  {
    path: 'usuarios',

    children: [
        { path: 'lista', component: ListaUsuariosPageComponent, data: { title: 'Lista de Usuarios' } },
      ]

  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsuariosRoutingModule { }
