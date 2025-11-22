import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfiguracionPageComponent } from './pages/configuracion-page.component';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';
 
const routes: Routes = [

  {
    path: 'configuracion',
    children: [
      {
        path: '',
        component: ConfiguracionPageComponent,
        data: { title: 'Configuración' },
        resolve: {
          usuarioData: () => inject(UsuarioService).GetPersonalInfoAsync(),
        },
      },
    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfiguracionRoutingModule { }
