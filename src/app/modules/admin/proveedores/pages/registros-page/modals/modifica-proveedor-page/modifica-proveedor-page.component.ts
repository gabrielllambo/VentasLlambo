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

import { ProveedorDTO } from 'app/core/models/proveedores/response/proveedor-dto.model';
import { ActualizarProveedorRequest } from 'app/core/models/proveedores/request/actualizar-proveedor-request.model';
import { ProveedorService } from 'app/core/services/proveedores/proveedor.service';

import { CommonValidators } from 'app/core/util/functions';

@Component({
    selector: 'app-modifica-proveedor-page',
    templateUrl: './modifica-proveedor-page.component.html',
    styleUrls: ['./modifica-proveedor-page.component.scss'],
})
export class ModificaProveedorPageComponent implements OnInit {

    actualizaProveedorForm: UntypedFormGroup;
    isCallingService: boolean = Flags.False;

    private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();

    public proveedor: ProveedorDTO;

    constructor(
        public matDialogRef: MatDialogRef<ModificaProveedorPageComponent>,
        @Inject(MAT_DIALOG_DATA)
        public paramsForms: any,
        private _formBuilder: UntypedFormBuilder,
        private _proveedorService: ProveedorService,
        private _toolService: ToolService,
        private _securityService: SecurityService,
    ) { }

    ngOnInit(): void {

        this.proveedor = this.paramsForms.proveedor;

        this.actualizaProveedorForm = this._formBuilder.group({
            numeroDocumento: [{ value: this.proveedor.numeroDocumento, disabled: true }],
            razonSocial: [
                this.proveedor.razonSocial,
                [
                    Validators.required,
                    Validators.minLength(Numeracion.Dos),
                    Validators.maxLength(Numeracion.Cien)
                ]
            ],
            correo: [
                this.proveedor.correoElectronico,
                [
                    Validators.required,
                    Validators.maxLength(Numeracion.Cincuenta),
                    //CommonValidators.emailForm()
                ]
            ],
            telefono: [
                this.proveedor.telefono,
                [
                    Validators.maxLength(Numeracion.Cincuenta),
                    CommonValidators.onlyPhoneNumbersForm()
                ]
            ],
            direccion: [
                this.proveedor.direccion,
                [
                    Validators.minLength(Numeracion.Dos),
                    Validators.maxLength(Numeracion.Cien)
                ]
            ],
            activo: [this.proveedor.activo],
            nombreComercial: [this.proveedor.nombreComercial, [
                Validators.required,
                Validators.minLength(Numeracion.Dos),
                Validators.maxLength(Numeracion.Cien)
            ]],

        });
    }

    UpdateAsync() {

        if (this.actualizaProveedorForm.invalid) { return; }

        const destinationTimeZoneId = this._toolService.getTimeZone();
        const idUsuario = this.userInfoLogueado.idUsuario;
        const idProveedorSelected = this.proveedor.id;

        const txtRazonSocial = this.actualizaProveedorForm.value.razonSocial;
        const txtCorreo = this.actualizaProveedorForm.value.correo;
        const txtTelefono = this.actualizaProveedorForm.value.telefono;
        const txtDireccion = this.actualizaProveedorForm.value.direccion;
        const txtActivo = this.actualizaProveedorForm.value.activo;
        const txtEstado = this.actualizaProveedorForm.value.estado;
        const txtNombreComercial = this.actualizaProveedorForm.value.nombreComercial;


        // VALIDACIONES
        if (FuseValidators.isEmptyInputValue(idProveedorSelected)) {
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

        if (FuseValidators.isEmptyInputValue(txtRazonSocial)) {
            this._toolService.showWarning(DictionaryWarning.InvalidRazonSocial, DictionaryWarning.Tittle);
            return;
        }

        // CREACIÓN REQUEST
        const request = new ActualizarProveedorRequest();

        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.id = idProveedorSelected;
        request.idUsuario = idUsuario;
        request.razonSocial = txtRazonSocial;
        request.correo = txtCorreo;
        request.telefono = txtTelefono;
        request.direccion = txtDireccion;
        request.activo = txtActivo;
        request.estado = txtEstado;
        request.nombreComercial = txtNombreComercial

        console.log(this.actualizaProveedorForm.value);

        this.actualizaProveedorForm.disable();
        this.isCallingService = Flags.True;

        this._proveedorService.UpdateAsync(request).subscribe((response: ResponseDTO) => {

            if (response.success) {
                this._toolService.showSuccess(response.message, response.titleMessage);
                this.matDialogRef.close(response);
                this.isCallingService = Flags.False;
                return;
            }

            if (response.code == ErrorCodigo.Advertencia) {
                this._toolService.showWarning(response.message, response.titleMessage);
                this.actualizaProveedorForm.enable();
                this.isCallingService = Flags.False;
                return;
            }

            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.actualizaProveedorForm.enable();
            this.isCallingService = Flags.False;

        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.actualizaProveedorForm.enable();
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
