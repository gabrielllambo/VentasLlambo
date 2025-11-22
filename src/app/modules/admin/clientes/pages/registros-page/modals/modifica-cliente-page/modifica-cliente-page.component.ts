import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorCodigo, Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ToolService } from 'app/core/services/tool/tool.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { FuseValidators } from '@fuse/validators';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ClienteDTO } from 'app/core/models/clientes/response/cliente-dto.model';
import { CommonValidators } from 'app/core/util/functions';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { ActualizarClienteRequest } from 'app/core/models/clientes/request/actualizar-cliente-request.model';
import { ClienteService } from 'app/core/services/cliente/cliente.service';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';

@Component({
  selector: 'app-modifica-cliente-page',
  templateUrl: './modifica-cliente-page.component.html',
  styleUrl: './modifica-cliente-page.component.scss'
})
export class ModificaClientePageComponent implements OnInit {

  actualizaClienteForm: UntypedFormGroup;
  isCallingService: boolean = Flags.False;

  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();

  public cliente: ClienteDTO;
  public allTipoDocumento: TipoDocumentoDTO[];
  public allGeneros: GeneroDTO[];

  constructor(
    public matDialogRef: MatDialogRef<ModificaClientePageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _formBuilder: UntypedFormBuilder,
    private _clienteService: ClienteService,
    private _toolService: ToolService,
    private _securityService: SecurityService,
  ) {
  }

  ngOnInit(): void {

    this.cliente = this.paramsForms.cliente;
    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;
    this.allGeneros = this.paramsForms.lstGenero;

    this.actualizaClienteForm = this._formBuilder.group({
      tipoDocumento: [{ value: this.cliente.tipoDocumento, disabled: true }],
      numeroDocumento: [{ value: this.cliente.numeroDocumento, disabled: true }],
      nombres: [this.cliente.nombres, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      apellidos: [this.cliente.apellidos, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      genero: [{ value: this.cliente.genero, disabled: true }],
      correoElectronico: [{ value: this.cliente.correoElectronico, disabled: true }],
      celular: [this.cliente.celular, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
      direccion: [this.cliente.direccion, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
    });
  }

  UpdateAsync() {

    if (this.actualizaClienteForm.invalid) { return; }

    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const idClienteSelected = this.cliente.id;
    const txtNombres = this.actualizaClienteForm.value.nombres;
    const txtApellidos = this.actualizaClienteForm.value.apellidos;
    const txtCelular = this.actualizaClienteForm.value.celular;
    const txtDireccion = this.actualizaClienteForm.value.direccion;

    if (FuseValidators.isEmptyInputValue(idClienteSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidId, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
      this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(idUsuario)) {
      this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
      return;
    }


    if (FuseValidators.isEmptyInputValue(txtNombres)) {
      this._toolService.showWarning(DictionaryWarning.InvalidNombres, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtApellidos)) {
      this._toolService.showWarning(DictionaryWarning.InvalidApellidos, DictionaryWarning.Tittle);
      return;
    }

    const request = new ActualizarClienteRequest();

    request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
    request.id = idClienteSelected;
    request.idUsuario = idUsuario;
    request.nombres = txtNombres;
    request.apellidos = txtApellidos;
    request.celular = txtCelular;
    request.direccion = txtDireccion;

    this.actualizaClienteForm.disable();
    this.isCallingService = Flags.True;

    this._clienteService.UpdateAsync(request).subscribe((response: ResponseDTO) => {

      if (response.success) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }

      if (response.code == ErrorCodigo.Advertencia) {
        this._toolService.showWarning(response.message, response.titleMessage);
        this.actualizaClienteForm.enable();
        this.isCallingService = Flags.False;
        return;
      }

      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.actualizaClienteForm.enable();
      this.isCallingService = Flags.False;

    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.actualizaClienteForm.enable();
      this.isCallingService = Flags.False;
      console.log(err);
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1.id === o2.id;
  }

  cerrarVentanaEmergente() {
    this.matDialogRef.close();
  }

  isMobilSize(): boolean {
    return this._toolService.isMobilSize();
  }

  obtenerInfouserInfoLogueado(): DecodedToken {
    return this._securityService.getDecodetoken();
  }

}
