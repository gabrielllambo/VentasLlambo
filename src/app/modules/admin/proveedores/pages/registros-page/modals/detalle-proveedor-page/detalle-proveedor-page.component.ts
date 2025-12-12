import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProveedorDTO } from 'app/core/models/proveedores/response/proveedor-dto.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonValidators } from 'app/core/util/functions';
import { Numeracion } from 'app/core/resource/dictionary.constants';
import { ToolService } from 'app/core/services/tool/tool.service';

@Component({
  selector: 'app-detalle-proveedor-page',
  templateUrl: './detalle-proveedor-page.component.html'
})
export class DetalleProveedorPageComponent implements OnInit {

  detalleProveedorForm: FormGroup;
  public proveedor: ProveedorDTO;

  allTipoDocumento = [];
  allGeneros = [];

  constructor(
    public matDialogRef: MatDialogRef<DetalleProveedorPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _formBuilder: UntypedFormBuilder,
    private _toolService: ToolService,
  ) { }

  ngOnInit(): void {

    this.proveedor = this.paramsForms.proveedor;
    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;

    this.detalleProveedorForm = this._formBuilder.group({
      tipoDocumento: [this.proveedor.tipoDocumento, [Validators.required]],
      numeroDocumento: [this.proveedor.numeroDocumento, [Validators.required, CommonValidators.onlyNumbersForm()]],
      razonSocial: [this.proveedor.razonSocial, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      correoElectronico: [this.proveedor.correoElectronico, [Validators.required, CommonValidators.invalidEmail()]],
      telefono: [this.proveedor.telefono, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
      direccion: [this.proveedor.direccion, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
      activo: [true],
      nombreComercial: [this.proveedor.nombreComercial, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien), CommonValidators.onlyLettersForm()]],
      fechaRegistro: [this.proveedor.fechaRegistro],
      fechaActualizacion: [this.proveedor.fechaActualizacion],
    });

    this.detalleProveedorForm.disable();
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1.codigoMoneda === o2.codigoMoneda;
  }

  isMobilSize() {
    return this._toolService.isMobilSize();
  }

  cerrarVentanaEmergente() {
    this.matDialogRef.close();
  }
}
