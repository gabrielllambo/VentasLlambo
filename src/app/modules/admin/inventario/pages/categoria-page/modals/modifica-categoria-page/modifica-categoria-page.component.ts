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
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { ActualizarCategoriaRequest } from 'app/core/models/inventario/categoria/request/actualizar-categoria-request.model';
import { MedidaDTO } from 'app/core/models/inventario/medida/response/medida-dto.model';

@Component({
  selector: 'app-modifica-categoria-page',
  templateUrl: './modifica-categoria-page.component.html',
  styleUrl: './modifica-categoria-page.component.scss'
})
export class ModificaCategoriaPageComponent implements OnInit {

  actualizaCategoriaForm: UntypedFormGroup;
  isCallingService: boolean = Flags.False;

  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();

  public allMedidaDataSource: MedidaDTO[];
  public categoria: CategoriaDTO;

  constructor(
    public matDialogRef: MatDialogRef<ModificaCategoriaPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _toolService: ToolService,
    private _securityService: SecurityService,
  ) {
  }

  ngOnInit(): void {
    this.allMedidaDataSource = this.paramsForms.lstMedida;
    this.categoria = this.paramsForms.categoria;
    this.actualizaCategoriaForm = this._formBuilder.group({
      nombre: [this.categoria.nombre, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta)]],
      medida: [this.categoria.medida, [Validators.required]],
      descripcion: [this.categoria.descripcion, [Validators.maxLength(Numeracion.DoscientosCincuenta)]],
      color: [this.categoria.color, [Validators.required]],
      activo: [this.categoria.activo],
    });
  }

  UpdateCategoriaAsync() {

    if (this.actualizaCategoriaForm.invalid) { return; }

    const idCategoriaSelected = this.categoria.id;
    const txtNombre = this.actualizaCategoriaForm.value.nombre;
    const cboMedidaSelected = this.actualizaCategoriaForm.value.medida.id;
    const txtDescripcion = this.actualizaCategoriaForm.value.descripcion;
    const txtColor = this.actualizaCategoriaForm.value.color;
    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const cboActivo = this.actualizaCategoriaForm.value.activo;

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

    if (FuseValidators.isEmptyInputValue(idCategoriaSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidId, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtNombre)) {
      this._toolService.showWarning(DictionaryWarning.InvalidNombre, DictionaryWarning.Tittle);
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

    const request = new ActualizarCategoriaRequest();

    request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
    request.color = txtColor;
    request.id = idCategoriaSelected;
    request.idMedida = cboMedidaSelected;
    request.idUsuario = idUsuario;
    request.nombre = txtNombre;
    request.descripcion = txtDescripcion;
    request.activo = cboActivo;

    this.actualizaCategoriaForm.disable();
    this.isCallingService = Flags.True;

    this._inventarioService.UpdateCategoriaAsync(request).subscribe((response: ResponseDTO) => {
      if (response.success) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }
    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.actualizaCategoriaForm.enable();
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
