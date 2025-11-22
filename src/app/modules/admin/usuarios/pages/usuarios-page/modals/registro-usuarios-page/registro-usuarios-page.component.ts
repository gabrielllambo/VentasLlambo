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
import { CommonValidators } from 'app/core/util/functions';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';
import { RegistrarUsuarioRequest } from 'app/core/models/usuario/request/registrar-usuario-request.model';
import { RolDTO } from 'app/core/models/parametro/rol-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';
import * as CustomValidator from 'app/core/util/functions';

@Component({
  selector: 'app-registro-usuarios-page',
  templateUrl: './registro-usuarios-page.component.html',
  styleUrl: './registro-usuarios-page.component.scss'
})
export class RegistroUsuariosPageComponent implements OnInit {

  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();
  public registroUsuarioForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;

  public allRol: RolDTO[];
  public allGenero: GeneroDTO[];
  public allTipoDocumento: TipoDocumentoDTO[];

  public minDate: Date;
  public maxDate: Date;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    public matDialogRef: MatDialogRef<RegistroUsuariosPageComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _usuarioService: UsuarioService,
    private _toolService: ToolService,
    private _securityService: SecurityService,
  ) {
  }

  ngOnInit(): void {

    this.allRol = this.paramsForms.lstRol;
    this.allGenero = this.paramsForms.lstGenero;
    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;

    this.minDate = new Date(1920, 0, 1);
    this.maxDate = new Date();

    this.registroUsuarioForm = this._formBuilder.group({
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.minLength(Numeracion.Tres)]],
      rol: ['', [Validators.required]],
      nombres: ['', [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      apellidos: ['', [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      genero: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      correoElectronico: ['', [Validators.required, CommonValidators.invalidEmail()]],
      contrasenia: ['', [Validators.required, Validators.maxLength(Numeracion.Ochenta)]],
      confirmarContrasenia: ['', [Validators.required, Validators.maxLength(Numeracion.Ochenta)]],
      celular: ['', [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
      direccion: ['', [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
    },
      {
        validators: FuseValidators.mustMatch('contrasenia', 'confirmarContrasenia')
      });
  }

  InsertAsync() {

    if (this.registroUsuarioForm.invalid) { return; }

    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const cboRolSelected = this.registroUsuarioForm.get('rol').value.id;
    const cboTipoDocumentoSelected = this.registroUsuarioForm.get('tipoDocumento').value.id;
    const txtNumeroDocumento = this.registroUsuarioForm.get('numeroDocumento').value;
    const txtNombres = this.registroUsuarioForm.get('nombres').value;
    const txtApellidos = this.registroUsuarioForm.get('apellidos').value;
    const cboGeneroSelected = this.registroUsuarioForm.get('genero').value.id;
    const txtCorreo = this.registroUsuarioForm.get('correoElectronico').value;
    const txtContrasenia = this.registroUsuarioForm.get('contrasenia').value;
    const txtConfirmarContrasenia = this.registroUsuarioForm.get('confirmarContrasenia').value;
    const txtFechaNacimientoSelected = this.registroUsuarioForm.get('fechaNacimiento').value;
    const txtCelular = this.registroUsuarioForm.get('celular').value;
    const txtDireccion = this.registroUsuarioForm.get('direccion').value;

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

    if (FuseValidators.isEmptyInputValue(cboGeneroSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidGenero, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtNumeroDocumento)) {
      this._toolService.showWarning(DictionaryWarning.InvalidNumeroDocumento, DictionaryWarning.Tittle);
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

    if (!CustomValidator.UtilExtension.isValidFechaNacimiento(txtFechaNacimientoSelected)) {

      this._toolService.showWarning(DictionaryWarning.InvalidFechaNacimiento, DictionaryWarning.Tittle);
      return;
    }

    if (!CustomValidator.UtilExtension.isValidContrasenia(txtContrasenia)) {
      this._toolService.showWarning(DictionaryWarning.InvalidContraseniaSegura, DictionaryWarning.Tittle);
      return;
    }

    if (!CustomValidator.UtilExtension.isEqualString(txtContrasenia, txtConfirmarContrasenia)) {
      this._toolService.showWarning(DictionaryWarning.ContraseniaNotEquals, DictionaryWarning.Tittle);
      return;
    }

    const request = new RegistrarUsuarioRequest();

    request.destinationTimeZoneIdRegistro = destinationTimeZoneId;
    request.idUsuario = idUsuario;
    request.idRol = cboRolSelected;
    request.idTipoDocumento = cboTipoDocumentoSelected;
    request.numeroDocumento = txtNumeroDocumento;
    request.nombres = txtNombres;
    request.apellidos = txtApellidos;
    request.idGenero = cboGeneroSelected;
    request.correoElectronico = txtCorreo;
    request.fechaNacimiento = txtFechaNacimientoSelected;
    request.celular = txtCelular;
    request.direccion = txtDireccion;
    request.contrasenia = txtContrasenia;

    this.registroUsuarioForm.disable();
    this.isCallingService = Flags.True;

    this._usuarioService.InsertAsync(request).subscribe((response: ResponseDTO) => {
      if (response.success == Flags.SuccessTransaction) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }

      if (response.code == ErrorCodigo.Advertencia) {
        this._toolService.showWarning(response.message, response.titleMessage);
        this.registroUsuarioForm.enable();
        this.isCallingService = Flags.False;
        return;
      }

    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroUsuarioForm.enable();
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
