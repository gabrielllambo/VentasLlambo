import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { NotifyOlvideContraseniaRequest } from 'app/core/models/usuario/request/notify-olvide-contrasenia-request.model';
import { Flags, PasosRestablecerContrasenia } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { AuthService } from 'app/core/services/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { CommonValidators } from 'app/core/util/functions';
import * as CustomValidator from 'app/core/util/functions';

@Component({
    selector: 'forgot-password-classic',
    templateUrl: './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: false
})
export class ForgotPasswordClassicComponent implements OnInit {

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    isCallingService: boolean = Flags.False;
    forgotPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    response: ResponseDTO;

    public restablecerContraseniaForm: UntypedFormGroup;
    public pasosRestablecerContrasenia: string = PasosRestablecerContrasenia.SOLICITAR_CODIGO;

    constructor(
        private _toolService: ToolService,
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private metaService: Meta
    ) {
    }

    ngOnInit(): void {
        this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
        this.forgotPasswordForm = this._formBuilder.group({correo: ['', [Validators.required, CommonValidators.invalidEmail()]],
        });
    }

    NotifyOlvideContraseniaAsync() {

        this.showAlert = Flags.HideFuseAlert;
        if (this.forgotPasswordForm.invalid) { return; }

        const request = new NotifyOlvideContraseniaRequest()

        const txtCorreoElectronico = this.forgotPasswordForm.get('correo').value;

        if (!CustomValidator.UtilExtension.isValidCorreo(txtCorreoElectronico)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidCorreo,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        request.correo = txtCorreoElectronico;
        request.destinationTimeZone = this._toolService.getTimeZone();

        this.forgotPasswordForm.disable();
        this.isCallingService = Flags.True;
        this._authService.NotifyOlvideContraseniaAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success) {
                this.response = response;
                this.isCallingService = Flags.False;
                this.pasosRestablecerContrasenia = PasosRestablecerContrasenia.VALIDAR_CODIGO_TOKEN;
                return;
            }
            this.alert = {
                type: 'warning',
                message: response.message,
            };
            this.showAlert = Flags.ShowFuseAlert;
            this.isCallingService = Flags.False;
            this.forgotPasswordForm.enable();
            return;
        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.isCallingService = Flags.False;
            this.forgotPasswordForm.enable();
            console.log(err);
        });
    }


}
