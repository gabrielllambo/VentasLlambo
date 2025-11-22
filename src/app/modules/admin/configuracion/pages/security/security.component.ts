import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { SecurityService } from 'app/core/auth/auth.service';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ActualizarContraseniaRequest } from 'app/core/models/usuario/request/actualizar-contrasenia-request.model';
import { ErrorCodigo, Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';
import * as CustomValidator from 'app/core/util/functions';

@Component({
    selector: 'settings-security',
    templateUrl: './security.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class SettingsSecurityComponent implements OnInit {

    isCallingService: boolean = Flags.False;
    securityForm: UntypedFormGroup;

    showAlert: boolean = Flags.HideFuseAlert;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };

    public userlogin: DecodedToken;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _usuarioService: UsuarioService,
        private _router: Router
    ) {
    }

    ngOnInit(): void {

        this.userlogin = this.obtenerInfouserInfoLogueado();

        this.securityForm = this._formBuilder.group({
            txtContraseniaActual: ['', [Validators.required, Validators.maxLength(Numeracion.Ochenta)]],
            txtContraseniaNueva: ['', [Validators.required, Validators.maxLength(Numeracion.Ochenta)]],
            txtConfirmarContraseniaNueva: ['', [Validators.required, Validators.maxLength(Numeracion.Ochenta)]],
        },
            {
                validators: FuseValidators.mustMatch('txtContraseniaNueva', 'txtConfirmarContraseniaNueva')
            });
    }

    UpdateUsuarioContraseniaByIdAsync() {

        this.showAlert = Flags.HideFuseAlert;
        if (this.securityForm.invalid) { return; }

        const txtContraseniaActual = this.securityForm.get('txtContraseniaActual').value;

        if (!CustomValidator.UtilExtension.isValidContrasenia(txtContraseniaActual)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidContraseniaSegura,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        const txtContraseniaNueva = this.securityForm.get('txtContraseniaNueva').value;

        if (!CustomValidator.UtilExtension.isValidContrasenia(txtContraseniaNueva)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidContraseniaSegura,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        const txtConfirmarContraseniaNueva = this.securityForm.get('txtConfirmarContraseniaNueva').value;

        if (!CustomValidator.UtilExtension.isValidContrasenia(txtConfirmarContraseniaNueva)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidContraseniaSegura,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        if (!CustomValidator.UtilExtension.isEqualString(txtContraseniaNueva.value, txtConfirmarContraseniaNueva.value)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.ContraseniaNotEquals,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        const request = new ActualizarContraseniaRequest();

        const idUsuario = this.userlogin.idUsuario;
        const destinationTimeZoneIdActualizacion = this._toolService.getTimeZone()

        request.destinationTimeZoneIdActualizacion = destinationTimeZoneIdActualizacion;
        request.idUsuario = idUsuario;
        request.contraseniaActual = txtContraseniaActual;
        request.contraseniaNueva = txtConfirmarContraseniaNueva;

        this.isCallingService = Flags.True;
        this.securityForm.disable();

        this._usuarioService.UpdateUsuarioContraseniaByIdAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success) {
                this._toolService.showSuccess(response.message, response.titleMessage);
                this._securityService.signOut()
                this._router.navigate(['sign-in']);
                return;
            }

            if (response.code == ErrorCodigo.Advertencia) {
                this.alert = {
                    type: 'warning',
                    message: response.message,
                };
                this.showAlert = Flags.ShowFuseAlert;
                this.isCallingService = Flags.False;

                this.securityForm.enable();
                return;
            }

        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.securityForm.enable();
            this.isCallingService = Flags.False;
            console.log(err);
        });

    }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }

}
