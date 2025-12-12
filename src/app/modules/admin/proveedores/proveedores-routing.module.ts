import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaProveedoresPageComponent } from './pages/registros-page/lista-proveedores-page.component';

const routes: Routes = [
    {
        path: 'lista', // Esto coincide con el '/admin/proveedores/lista' de la BD
        component: ListaProveedoresPageComponent
    },
    {
        path: '',
        redirectTo: 'lista',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProveedoresRoutingModule { }