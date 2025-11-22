import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ClienteDTO } from 'app/core/models/clientes/response/cliente-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { Numeracion } from 'app/core/resource/dictionary.constants';
import { ToolService } from 'app/core/services/tool/tool.service';
import { CommonValidators } from 'app/core/util/functions';

@Component({
  selector: 'app-detalle-cliente-page',
  templateUrl: './detalle-cliente-page.component.html',
  styleUrl: './detalle-cliente-page.component.scss'
})
export class DetalleClientePageComponent implements OnInit {

  userInfoLogueado: DecodedToken;
  detalleClienteForm: UntypedFormGroup;

  public cliente: ClienteDTO;
  public allTipoDocumento: TipoDocumentoDTO;
  public allGeneros: GeneroDTO[];

  constructor(
    public matDialogRef: MatDialogRef<DetalleClientePageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _formBuilder: UntypedFormBuilder,
    private _toolService: ToolService,
  ) {
  }

  ngOnInit(): void {

    this.cliente = this.paramsForms.cliente;
    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;
    this.allGeneros = this.paramsForms.lstGenero;

    this.detalleClienteForm = this._formBuilder.group({
      genero: [this.cliente.genero],
      tipoDocumento: [this.cliente.tipoDocumento, [Validators.required]],
      numeroDocumento: [this.cliente.numeroDocumento, [Validators.required, CommonValidators.onlyNumbersForm()]],
      nombres: [this.cliente.nombres, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      apellidos: [this.cliente.apellidos, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      correoElectronico: [this.cliente.correoElectronico, [Validators.required, CommonValidators.invalidEmail()]],
      celular: [this.cliente.celular, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
      direccion: [this.cliente.direccion, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
      fechaRegistro: [this.cliente.fechaRegistro],
      fechaActualizacion: [this.cliente.fechaActualizacion],
    });

    this.detalleClienteForm.disable();
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
