import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path:'',
    loadChildren:() => import('../admin/inicio/inicio.module').then(m => m.InicioModule)  
  },
  {
    path:'',
    loadChildren:() => import('../admin/ventas/ventas.module').then(m => m.VentasModule)  
  },
  {
    path:'',
    loadChildren:() => import('../admin/inventario/inventario.module').then(m => m.InventarioModule)  
  },
  {
    path:'',
    loadChildren:() => import('../admin/clientes/clientes.module').then(m => m.ClientesModule)  
  },
  {
    path:'',
    loadChildren:() => import('../admin/usuarios/usuarios.module').then(m => m.UsuariosModule)  
  },
  {
    path:'',
    loadChildren:() => import('../admin/negocio/negocio.module').then(m => m.NegocioModule)  
  },
  {
    path:'',
    loadChildren:() => import('../admin/configuracion/configuracion.module').then(m => m.ConfiguracionModule)  
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
