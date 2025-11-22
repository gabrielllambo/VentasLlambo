import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Colores, Flags, Numeracion, StatusCode } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import * as CustomValidator from 'app/core/util/functions';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { FuseValidators } from '@fuse/validators';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { RegistrarCategoriaRequest } from 'app/core/models/inventario/categoria/request/registrar-categoria-request.model';
import { MedidaDTO } from 'app/core/models/inventario/medida/response/medida-dto.model';

@Component({
  selector: 'app-registro-categoria-page',
  templateUrl: './registro-categoria-page.component.html',
  styleUrl: './registro-categoria-page.component.scss'
})
export class RegistroCategoriaPageComponent implements OnInit {

  public registroCategoriaForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;
  public colorSelected: string = Colores.DefaultColor;

  public allMedidaDataSource: MedidaDTO[];

  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    public matDialogRef: MatDialogRef<RegistroCategoriaPageComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _toolService: ToolService,
    private _securityService: SecurityService,

  ) {
  }

  ngOnInit(): void {

    this.allMedidaDataSource = this.paramsForms.lstMedida;

    this.registroCategoriaForm = this._formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta)]],
      medida: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(Numeracion.DoscientosCincuenta)]],
      color: ['', []]
    });
  }

  AddCategoriaAsync() {

    if (this.registroCategoriaForm.invalid) { return; }

    const txtNombre = this.registroCategoriaForm.get('nombre').value;
    const cboMedidaSelected = this.registroCategoriaForm.get('medida').value.id;
    const txtDescripcion = this.registroCategoriaForm.get('descripcion').value;
    const txtColor = this.registroCategoriaForm.get('color').value;
    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;

    if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
      this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(idUsuario)) {
      this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtColor)) {
      this._toolService.showWarning(DictionaryWarning.InvalidColor, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtNombre)) {
      this._toolService.showWarning(DictionaryWarning.InvalidOrigenRegistro, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(cboMedidaSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidMedida, DictionaryWarning.Tittle);
      return;
    }

    if (!CustomValidator.UtilExtension.isValidMinTwoLength(txtNombre)) {
      this._toolService.showWarning(DictionaryWarning.AllowMinTwoLength, DictionaryWarning.Tittle);
      return;
    }

    if (!CustomValidator.UtilExtension.isValidFiftyLength(txtNombre)) {
      this._toolService.showWarning(DictionaryWarning.AllowMaxFiftyLength, DictionaryWarning.Tittle);
      return;
    }

    if (!CustomValidator.UtilExtension.isValidTwoHundredFiftyLength(txtDescripcion)) {
      this._toolService.showWarning(DictionaryWarning.AllowMaxTwoHundredFiftyLength, DictionaryWarning.Tittle);
      return;
    }

    const request = new RegistrarCategoriaRequest();

    request.destinationTimeZoneIdRegistro = destinationTimeZoneId;
    request.color = txtColor;
    request.idUsuario = idUsuario;
    request.nombre = txtNombre;
    request.descripcion = txtDescripcion;
    request.idMedida = cboMedidaSelected;

    this.registroCategoriaForm.disable();
    this.isCallingService = Flags.True;

    this._inventarioService.InsertCategoriaAsync(request).subscribe((response: ResponseDTO) => {
      if (response.success == Flags.SuccessTransaction) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }
    }, err => {
      if (err.status == StatusCode.Forbidden) {
        this._toolService.showWarning(err.error, DictionaryWarning.Tittle);
        this.registroCategoriaForm.enable();
        this.isCallingService = Flags.False;
        console.log(err);
        return;
      }
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroCategoriaForm.enable();
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
