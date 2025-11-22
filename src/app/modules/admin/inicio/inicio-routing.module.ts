import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioPageComponent } from './pages/inicio-page/inicio-page.component';
import { ProjectService } from './pages/inicio-page/project.service';
 
const routes: Routes = [
  {
    path: 'inicio',
    children: [
      {
        path: '',
        component: InicioPageComponent,
        resolve: {
          data: () => inject(ProjectService).getData(),
        },
        data: { title: 'Inicio' },
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InicioRoutingModule { }
