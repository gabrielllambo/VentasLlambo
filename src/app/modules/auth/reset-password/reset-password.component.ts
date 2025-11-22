import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { RestablecerContraseniaRequest } from 'app/core/models/usuario/request/restablecer--contrasenia-request.model';
import { Flags, Numeracion, PasosRestablecerContrasenia } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { AuthService } from 'app/core/services/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import * as CustomValidator from 'app/core/util/functions';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'reset-password-classic',
    templateUrl: './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: false
})
export class ResetPasswordClassicComponent implements OnInit {
    public token: string;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    isCallingService: boolean = Flags.False;
    showAlert: boolean = false;
    response: ResponseDTO;
    resetPasswordForm: UntypedFormGroup;
    public restablecerContraseniaForm: UntypedFormGroup;
    public pasosRestablecerContrasenia: string = PasosRestablecerContrasenia.VALIDAR_CODIGO_TOKEN;
    public _unsubscribeAll: Subject<any> = new Subject<any>();
    public validateTokenDataSource: ResponseDTO;
    constructor(
        private _toolService: ToolService,
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private metaService: Meta
    ) {
    }

    ngOnInit(): void {
        this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
        this._authService.responseValidateToken$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response: ResponseDTO) => {

                this.validateTokenDataSource = response;

                if (response.success) {
                    this.pasosRestablecerContrasenia = PasosRestablecerContrasenia.INGRESO_CONTRASENIA;
                    this.initForm();
                    return;
                }

                this.alert = {
                    type: 'warning',
                    message: response.message,
                };
                this.showAlert = Flags.ShowFuseAlert;
            });
    }

    initForm() {
        this.resetPasswordForm = this._formBuilder.group({
            txtContrasenia: ['', [Validators.required, Validators.maxLength(Numeracion.Ochenta)]],
            txtConfirmarContrasenia: ['', [Validators.required, Validators.maxLength(Numeracion.Ochenta)]],
        },
            {
                validators: FuseValidators.mustMatch('txtContrasenia', 'txtConfirmarContrasenia'),
            },

        );
    }

    RestablecerContraseniaAsync() {
        if (this.resetPasswordForm.invalid) { return; }
        this.showAlert = Flags.HideFuseAlert;

        const request = new RestablecerContraseniaRequest()
        const destinationTimeZoneId = this._toolService.getTimeZone()
        const txtConfirmarContrasenia = this.resetPasswordForm.get('txtConfirmarContrasenia').value;

        const fullUrl = window.location.href;
        const correoSegment = fullUrl.split('reset-password/')[1];
        const token = decodeURIComponent(correoSegment);

        if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidLocalizacion,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        if (!CustomValidator.UtilExtension.isValidContrasenia(txtConfirmarContrasenia)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidContraseniaSegura,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        if (FuseValidators.isEmptyInputValue(token)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidToken,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.token = token;
        request.contrasenia = txtConfirmarContrasenia;

        this.resetPasswordForm.disable();
        this.isCallingService = Flags.True;
        this._authService.RestablecerContraseniaAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success) {
                this.response = response;
                this.isCallingService = Flags.False;
                this.pasosRestablecerContrasenia = PasosRestablecerContrasenia.CONTRASENIA_RESTABLECIDA;
                return;
            }
            this.alert = {
                type: 'warning',
                message: response.message,
            };
            this.showAlert = Flags.ShowFuseAlert;
            this.isCallingService = Flags.False;
            this.resetPasswordForm.enable();
            return;
        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.isCallingService = Flags.False;
            this.resetPasswordForm.enable();
            console.log(err);
        });
    }


}
