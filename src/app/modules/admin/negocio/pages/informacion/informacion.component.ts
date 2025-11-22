import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FuseValidators } from '@fuse/validators';
import { SecurityService } from 'app/core/auth/auth.service';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { NegocioDTO } from 'app/core/models/parametro/negocio-dto.model';
import { ParametroGeneralDTO } from 'app/core/models/parametro/parametro-general-dto.model';
import { ActualizarNegocioRequest } from 'app/core/models/parametro/request/actualizar-negocio-request.model';
import { Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ParametroGeneralService } from 'app/core/services/parametro/parametro-general.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { CommonValidators } from 'app/core/util/functions';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'informacion-negocio',
    templateUrl: './informacion.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class InformacionNegocioComponent implements OnInit {

    public isCallingService: boolean = Flags.False;
    public userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();

    public informacionForm: UntypedFormGroup;

    public moendas: MonedaDTO[];
    public _unsubscribeAll: Subject<any> = new Subject<any>();

    public showAlert: boolean = Flags.HideFuseAlert;

    @Input()
    public negocioDetalleInput: NegocioDTO;

    @Input()
    public parametrosGeneralesInput: ParametroGeneralDTO;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _router: Router,
        private _parametroService: ParametroGeneralService,
    ) {
    }

    ngOnInit(): void {
        this._parametroService.monedaData$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((monedas: MonedaDTO[]) => {
                this.moendas = monedas;
                this._changeDetectorRef.markForCheck();
            });

        this.informacionForm = this._formBuilder.group({
            razonSocial: [this.negocioDetalleInput.razonSocial, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
            ruc: [this.negocioDetalleInput.ruc, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
            direccion: [this.negocioDetalleInput.direccion, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
            celular: [this.negocioDetalleInput.celular, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
            correo: [this.negocioDetalleInput.correo, [Validators.required, CommonValidators.invalidEmail()]],
            moneda: [this.negocioDetalleInput.moneda, [Validators.required]],
            fechaRegistro: [{ value: this.negocioDetalleInput.fechaRegistro, disabled: Flags.Deshabilitado }],
        });
    }

    UpdateInformacionNegocioAsync() {

        this.showAlert = Flags.HideFuseAlert;

        if (this.informacionForm.invalid) { return; }

        const idUsuario = this.userInfoLogueado.idUsuario;
        const cboMonedaSelected = this.informacionForm.value.moneda;
        const destinationTimeZoneIdActualizacion = this._toolService.getTimeZone()
        const txtRazonSocial = this.informacionForm.value.razonSocial;
        const txtRuc = this.informacionForm.value.ruc;
        const txtDireccion = this.informacionForm.value.direccion;
        const txtCelular = this.informacionForm.value.celular;
        const txtCorreo = this.informacionForm.value.correo;

        debugger;

        if (FuseValidators.isEmptyInputValue(idUsuario)) {
            this._toolService.showWarning(DictionaryWarning.InvalidId, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(destinationTimeZoneIdActualizacion)) {
            this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(cboMonedaSelected)) {
            this._toolService.showWarning(DictionaryWarning.InvalidMoneda, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(txtRazonSocial)) {
            this._toolService.showWarning(DictionaryWarning.InvalidRazonSocial, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(txtRuc)) {
            this._toolService.showWarning(DictionaryWarning.InvalidRUC, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(txtCorreo)) {
            this._toolService.showWarning(DictionaryWarning.InvalidCorreo, DictionaryWarning.Tittle);
            return;
        }

        const request = new ActualizarNegocioRequest();

        request.idUsuario = idUsuario;
        request.idMoneda = cboMonedaSelected.id;
        request.destinationTimeZoneIdActualizacion = destinationTimeZoneIdActualizacion;
        request.razonSocial = txtRazonSocial;
        request.ruc = txtRuc;
        request.direccion = txtDireccion;
        request.celular = txtCelular;
        request.correo = txtCorreo;

        this.isCallingService = Flags.True;
        this.informacionForm.disable();

        this._parametroService.UpdateNegocioAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success) {
                this._toolService.showSuccess(response.message, response.titleMessage);
                this._securityService.signOut()
                this._router.navigate(['sign-in']);
                return;
            }
        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.informacionForm.enable();
            this.isCallingService = Flags.False;
            console.log(err);
        });
    }

    isMobilSize(): boolean {
        return this._toolService.isMobilSize();
    }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }

    compareObjects(o1: any, o2: any): boolean {
        return o1.codigoMoneda === o2.codigoMoneda;
    }
}
