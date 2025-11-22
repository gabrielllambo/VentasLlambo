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
import { CommonValidators } from 'app/core/util/functions';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import * as CustomValidator from 'app/core/util/functions';
import { RolDTO } from 'app/core/models/parametro/rol-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { ActualizarUsuarioRequest } from 'app/core/models/usuario/request/actualizar-usuario-request.model';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';

@Component({
  selector: 'app-modifica-usuarios-page',
  templateUrl: './modifica-usuarios-page.component.html',
  styleUrl: './modifica-usuarios-page.component.scss'
})
export class ModificaUsuariosPageComponent implements OnInit {

  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();
  public actualizaUsuarioForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;

  public usuario: UsuarioDTO;
  public allRol: RolDTO[];
  public allGenero: GeneroDTO[];
  public allTipoDocumento: TipoDocumentoDTO[];

  public minDate: Date = new Date(1920, 0, 1);
  public maxDate: Date = new Date();

  constructor(
    public matDialogRef: MatDialogRef<ModificaUsuariosPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _formBuilder: UntypedFormBuilder,
    private _usuarioService: UsuarioService,
    private _toolService: ToolService,
    private _securityService: SecurityService,
  ) {
  }

  ngOnInit(): void {
    this.usuario = this.paramsForms.usuario;
    this.allRol = this.paramsForms.lstRol;
    this.allGenero = this.paramsForms.lstGenero;
    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;

    this.actualizaUsuarioForm = this._formBuilder.group({
      tipoDocumento: [{ value: this.usuario.tipoDocumento, disabled: true }],
      numeroDocumento: [{ value: this.usuario.numeroDocumento, disabled: true }],
      rol: [this.usuario.rol, [Validators.required]],
      nombres: [{ value: this.usuario.nombres, disabled: true }],
      apellidos: [{ value: this.usuario.apellidos, disabled: true }],
      genero: [{ value: this.usuario.genero, disabled: true }],
      fechaNacimiento: [{ value: this.usuario.fechaNacimiento, disabled: true }],
      correoElectronico: [{ value: this.usuario.correoElectronico, disabled: true }],
      celular: [this.usuario.celular, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
      direccion: [this.usuario.direccion, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
    });
  }

  UpdateAsync() {

    if (this.actualizaUsuarioForm.invalid) { return; }

    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const cboRolSelected = this.actualizaUsuarioForm.get('rol').value.id;
    const txtCelular = this.actualizaUsuarioForm.get('celular').value;
    const txtDireccion = this.actualizaUsuarioForm.get('direccion').value;

    if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
      this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(idUsuario)) {
      this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
      return;
    }

    const request = new ActualizarUsuarioRequest();

    request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
    request.idUsuarioSeleccionado = this.usuario.usuarioID.idUsuarioGuid;
    request.idUsuario = idUsuario;
    request.idRol = cboRolSelected;
    request.celular = txtCelular;
    request.direccion = txtDireccion;

    this.actualizaUsuarioForm.disable();
    this.isCallingService = Flags.True;

    this._usuarioService.UpdateAsync(request).subscribe((response: ResponseDTO) => {
      if (response.success == Flags.SuccessTransaction) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }

      if (response.code == ErrorCodigo.Advertencia) {
        this._toolService.showWarning(response.message, response.titleMessage);
        this.actualizaUsuarioForm.enable();
        this.isCallingService = Flags.False;
        return;
      }

    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.actualizaUsuarioForm.enable();
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
