import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NegocioPageComponent } from './pages/negocio-page/negocio-page.component';
import { ParametroGeneralService } from 'app/core/services/parametro/parametro-general.service';

const routes: Routes = [
  {
    path: 'negocio',
    children: [
      {
        path: '',
        component: NegocioPageComponent,
        resolve: {
          negocioData: () => inject(ParametroGeneralService).GetNegocioAsync(),
          monedaData: () => inject(ParametroGeneralService).GetAllMonedaAsync(),
        },
        data: { title: 'Negocio' },
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NegocioRoutingModule { }
