import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ErrorCodigo, Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { FuseValidators } from '@fuse/validators';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ClienteService } from 'app/core/services/cliente/cliente.service';
import { RegistrarClienteRequest } from 'app/core/models/clientes/request/registrar-cliente-request.model';
import { CommonValidators } from 'app/core/util/functions';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';

@Component({
  selector: 'app-registro-cliente-page',
  templateUrl: './registro-cliente-page.component.html',
  styleUrl: './registro-cliente-page.component.scss'
})
export class RegistroClientePageComponent implements OnInit {

  public registroClienteForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;
  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();
  public allTipoDocumento: TipoDocumentoDTO[];
  public allGeneros: GeneroDTO[];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    public matDialogRef: MatDialogRef<RegistroClientePageComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _clienteService: ClienteService,
    private _toolService: ToolService,
    private _securityService: SecurityService,

  ) {
  }

  ngOnInit(): void {

    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;
    this.allGeneros = this.paramsForms.lstGenero;

    this.registroClienteForm = this._formBuilder.group({
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required, CommonValidators.onlyNumbersForm(), Validators.minLength(Numeracion.Tres)]],
      nombres: ['', [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      apellidos: ['', [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      genero: ['', [Validators.required]],
      correoElectronico: ['', [Validators.required, CommonValidators.invalidEmail()]],
      celular: ['', [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
      direccion: ['', [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
    });
  }

  InsertAsync() {

    if (this.registroClienteForm.invalid) { return; }

    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const cboTipoDocumentoSelected = this.registroClienteForm.get('tipoDocumento').value.id;
    const txtNumeroDocumento = this.registroClienteForm.get('numeroDocumento').value;
    const txtNombres = this.registroClienteForm.get('nombres').value;
    const txtApellidos = this.registroClienteForm.get('apellidos').value;
    const txtCorreo = this.registroClienteForm.get('correoElectronico').value;
    const txtCelular = this.registroClienteForm.get('celular').value;
    const txtDireccion = this.registroClienteForm.get('direccion').value;
    const cboGeneroSelected = this.registroClienteForm.get('genero').value.id;

    if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
      this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(idUsuario)) {
      this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(cboTipoDocumentoSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidTipoDocumento, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtNumeroDocumento)) {
      this._toolService.showWarning(DictionaryWarning.InvalidNumeroDocumento, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(cboGeneroSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidGenero, DictionaryWarning.Tittle);
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

    const request = new RegistrarClienteRequest();

    request.destinationTimeZoneIdRegistro = destinationTimeZoneId;
    request.idUsuario = idUsuario;
    request.idTipoDocumento = cboTipoDocumentoSelected;
    request.numeroDocumento = txtNumeroDocumento;
    request.nombres = txtNombres;
    request.apellidos = txtApellidos;
    request.idGenero = cboGeneroSelected;
    request.correoElectronico = txtCorreo;
    request.celular = txtCelular;
    request.direccion = txtDireccion;

    this.registroClienteForm.disable();
    this.isCallingService = Flags.True;

    this._clienteService.InsertAsync(request).subscribe((response: ResponseDTO) => {
      
      if (response.success == Flags.SuccessTransaction) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }

      if (response.code == ErrorCodigo.Advertencia) {
        this._toolService.showWarning(response.message, response.titleMessage);
        this.registroClienteForm.enable();
        this.isCallingService = Flags.False;
        return;
      }

      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroClienteForm.enable();
      this.isCallingService = Flags.False;

    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroClienteForm.enable();
      this.isCallingService = Flags.False;
      console.log(err);
    });

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
