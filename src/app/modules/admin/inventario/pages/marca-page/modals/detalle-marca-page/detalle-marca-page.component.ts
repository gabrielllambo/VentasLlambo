import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ToolService } from 'app/core/services/tool/tool.service';

@Component({
  selector: 'app-detalle-marca-page',
  templateUrl: './detalle-marca-page.component.html',
  styleUrl: './detalle-marca-page.component.scss'
})
export class DetalleMarcaPageComponent implements OnInit {

  userInfoLogueado: DecodedToken;
  detalleMarcaForm: UntypedFormGroup;

  public marca: MarcaDTO;

  constructor(
    public matDialogRef: MatDialogRef<DetalleMarcaPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,

    private _formBuilder: UntypedFormBuilder,
    private _toolService: ToolService,
  ) {
  }

  ngOnInit(): void {
    this.marca = this.paramsForms.marca;
    this.detalleMarcaForm = this._formBuilder.group({
      nombre: [this.marca.nombre],
      descripcion: [this.marca.descripcion],
      color: [this.marca.color],
      fechaRegistro: [this.marca.fechaRegistro],
      fechaActualizacion: [this.marca.fechaActualizacion],
      activo: [this.marca.activo],
    });
    this.detalleMarcaForm.disable();
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
