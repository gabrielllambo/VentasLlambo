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
import { ProveedorService } from 'app/core/services/proveedores/proveedor.service';
import { RegistrarProveedorRequest } from 'app/core/models/proveedores/request/registrar-proveedor-request.model';
import { CommonValidators } from 'app/core/util/functions';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';

@Component({
  selector: 'app-registro-proveedor-page',
    templateUrl: './registro-proveedor-page.component.html',
    styleUrls: ['./registro-proveedor-page.component.scss'],
})
export class RegistroProveedorPageComponent implements OnInit {

  public registroProveedorForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;
  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();
  public allTipoDocumento: TipoDocumentoDTO[];
  public allGeneros: GeneroDTO[];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    public matDialogRef: MatDialogRef<RegistroProveedorPageComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _ProveedorService: ProveedorService,
    private _toolService: ToolService,
    private _securityService: SecurityService,

  ) {
  }

  ngOnInit(): void {

    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;
    this.allGeneros = this.paramsForms.lstGenero;

    this.registroProveedorForm = this._formBuilder.group({
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required, CommonValidators.onlyNumbersForm(), Validators.minLength(Numeracion.Tres)]],
      correo: ['', [Validators.required, CommonValidators.invalidEmail()]],
      telefono: ['', [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
      direccion: ['', [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
      razonSocial: ['', Validators.required],
      activo:[true],
      nombreComercial: [''],
      estado:[true],
    });
  }

  InsertAsync() {

    if (this.registroProveedorForm.invalid) { return; }

    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const cboTipoDocumentoSelected = this.registroProveedorForm.get('tipoDocumento').value.id;
    const txtNumeroDocumento = this.registroProveedorForm.get('numeroDocumento').value;
    const txtCorreo = this.registroProveedorForm.get('correo').value;
    const txtTelefono = this.registroProveedorForm.get('telefono').value;
    const txtDireccion = this.registroProveedorForm.get('direccion').value;
    const txtActivo = this.registroProveedorForm.get('activo').value;
    const txtRazonSocial = this.registroProveedorForm.get('razonSocial').value;
    const txtNombreComercial = this.registroProveedorForm.get('nombreComercial').value;
    const txtEstado = this.registroProveedorForm.get('estado').value;


    console.log(this.registroProveedorForm.value);


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

    const request = new RegistrarProveedorRequest();

    request.destinationTimeZoneIdRegistro = destinationTimeZoneId;
    request.idUsuario = idUsuario;
    request.tipoDocumentoId = cboTipoDocumentoSelected;
    request.numeroDocumento = txtNumeroDocumento;
    request.correo = txtCorreo;
    request.telefono = txtTelefono;
    request.direccion = txtDireccion;
    request.activo = txtActivo;
    request.razonSocial = txtRazonSocial;
    request.nombreComercial = txtNombreComercial;
    request.estado = txtEstado;

    console.log('Request a enviar:', request);


    this.registroProveedorForm.disable();
    this.isCallingService = Flags.True;

    this._ProveedorService.InsertAsync(request).subscribe((response: ResponseDTO) => {
      
      if (response.success == Flags.SuccessTransaction) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }

      if (response.code == ErrorCodigo.Advertencia) {
        this._toolService.showWarning(response.message, response.titleMessage);
        this.registroProveedorForm.enable();
        this.isCallingService = Flags.False;
        return;
      }

      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroProveedorForm.enable();
      this.isCallingService = Flags.False;

    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroProveedorForm.enable();
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
