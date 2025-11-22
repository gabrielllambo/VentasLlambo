import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { MedidaDTO } from 'app/core/models/inventario/medida/response/medida-dto.model';
import { ToolService } from 'app/core/services/tool/tool.service';

@Component({
  selector: 'app-detalle-categoria-page',
  templateUrl: './detalle-categoria-page.component.html',
  styleUrl: './detalle-categoria-page.component.scss'
})
export class DetalleCategoriaPageComponent implements OnInit {

  userInfoLogueado: DecodedToken;
  detalleCategoriaForm: UntypedFormGroup;

  public allMedidaDataSource: MedidaDTO[];
  public categoria: CategoriaDTO;

  constructor(
    public matDialogRef: MatDialogRef<DetalleCategoriaPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,

    private _formBuilder: UntypedFormBuilder,
    private _toolService: ToolService,
  ) {
  }

  ngOnInit(): void {
    this.allMedidaDataSource = this.paramsForms.lstMedida;
    this.categoria = this.paramsForms.categoria;
    this.detalleCategoriaForm = this._formBuilder.group({
      nombre: [this.categoria.nombre],
      medida: [this.categoria.medida],
      descripcion: [this.categoria.descripcion],
      color: [this.categoria.color],
      fechaRegistro: [this.categoria.fechaRegistro],
      fechaActualizacion: [this.categoria.fechaActualizacion],
      activo: [this.categoria.activo],
    });
    this.detalleCategoriaForm.disable();
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1.codigoMoneda === o2.codigoMoneda;
  }

  cerrarVentanaEmergente() {
    this.matDialogRef.close();
  }

  isMobilSize(): boolean {
    return this._toolService.isMobilSize();
  }

}
