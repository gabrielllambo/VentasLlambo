import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import * as CustomValidator from 'app/core/util/functions';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ToolService } from 'app/core/services/tool/tool.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { FuseValidators } from '@fuse/validators';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ActualizarMarcaRequest } from 'app/core/models/inventario/marca/request/actualizar-marca-request.model';

@Component({
  selector: 'app-modifica-marca-page',
  templateUrl: './modifica-marca-page.component.html',
  styleUrl: './modifica-marca-page.component.scss'
})
export class ModificaMarcaPageComponent implements OnInit {

  actualizaMarcaForm: UntypedFormGroup;
  isCallingService: boolean = Flags.False;

  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();

  public marca: MarcaDTO;

  constructor(
    public matDialogRef: MatDialogRef<ModificaMarcaPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _toolService: ToolService,
    private _securityService: SecurityService,
  ) {
  }

  ngOnInit(): void {
    this.marca = this.paramsForms.marca;
    this.actualizaMarcaForm= this._formBuilder.group({
      nombre: [this.marca.nombre, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta)]],
      descripcion: [this.marca.descripcion, [Validators.maxLength(Numeracion.DoscientosCincuenta)]],
      color: [this.marca.color, [Validators.required]],
      activo: [this.marca.activo],
    });
  }

  UpdateMarcaAsync() {

    if (this.actualizaMarcaForm.invalid) { return; }

    const idMarcaSelected = this.marca.id;
    const txtNombre = this.actualizaMarcaForm.value.nombre;
    const txtDescripcion = this.actualizaMarcaForm.value.descripcion;
    const txtColor = this.actualizaMarcaForm.value.color;
    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const cboActivo = this.actualizaMarcaForm.value.activo;

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

    if (FuseValidators.isEmptyInputValue(idMarcaSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidId, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtNombre)) {
      this._toolService.showWarning(DictionaryWarning.InvalidNombre, DictionaryWarning.Tittle);
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

    const request = new ActualizarMarcaRequest();

    request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
    request.color = txtColor;
    request.id = idMarcaSelected;
    request.idUsuario = idUsuario;
    request.nombre = txtNombre;
    request.descripcion = txtDescripcion;
    request.activo = cboActivo;

    this.actualizaMarcaForm.disable();
    this.isCallingService = Flags.True;

    this._inventarioService.UpdateMarcaAsync(request).subscribe((response: ResponseDTO) => {
      if (response.success) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }
    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.actualizaMarcaForm.enable();
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
