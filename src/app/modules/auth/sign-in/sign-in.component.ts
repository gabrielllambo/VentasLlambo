import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgForm, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { SecurityService } from 'app/core/auth/auth.service';
import { UsuarioIniciaSesionRequest } from 'app/core/models/auth/filtro/usuario-inicia-sesion-request.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { IniciaSesionDTO } from 'app/core/models/auth/response/inicia-sesion-dto.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ErrorCodigo, Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ToolService } from 'app/core/services/tool/tool.service';
import * as CustomValidator from 'app/core/util/functions';
import { CommonValidators } from 'app/core/util/functions';

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,

})
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };

    signInForm: UntypedFormGroup;
    showAlert: boolean = Flags.HideFuseAlert;
    initCorreo: string = "";
    initClave: string = "";
    initCheck: boolean = Flags.False;
    isCallingService: boolean = Flags.False;

    constructor(
        private _toolService: ToolService,
        private _activatedRoute: ActivatedRoute,
        private _securityService: SecurityService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private metaService: Meta
    ) {
    }

    ngOnInit(): void {
        this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
        const rememberuserInfoLogueadoData = localStorage.getItem('rememberuserInfoLogueado');
        const userInfoLogueadoDataObject = JSON.parse(rememberuserInfoLogueadoData);

        if (rememberuserInfoLogueadoData) {
            this.initCheck = true;
            this.initCorreo = userInfoLogueadoDataObject.correo;
            this.initClave = userInfoLogueadoDataObject.clave
        }

        this.signInForm = this._formBuilder.group({
            // correo: [this.initCorreo, [Validators.required, CommonValidators.invalidEmail()]],
            // password: [this.initClave, [Validators.required, Validators.minLength(Numeracion.Doce), Validators.maxLength(Numeracion.Ochenta)]],
            correo: ['', [Validators.required, CommonValidators.invalidEmail()]],
            password: ['', [Validators.required, Validators.minLength(Numeracion.Doce), Validators.maxLength(Numeracion.Ochenta)]],
            rememberMe: [this.initCheck],
        });
    }

    signIn(): void {

        if (this.signInForm.invalid) { return; }

        this.showAlert = Flags.HideFuseAlert;

        const request = new UsuarioIniciaSesionRequest();

        const txtUsuarioSelected = this.signInForm.value.correo;

        if (!this.validarUsuario(txtUsuarioSelected)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidCorreo,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        const txtContrasenia = this.signInForm.value.password;

        if (!CustomValidator.UtilExtension.isValidContrasenia(txtContrasenia)) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidContrasenia,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return;
        }

        request.correo = txtUsuarioSelected;
        request.clave = txtContrasenia;

        this.signInForm.disable();

        this.isCallingService = Flags.True;
        this._securityService.IniciaSesionAsync(request).subscribe((iniciaSesionResponse: IniciaSesionDTO) => {

            if (iniciaSesionResponse.response.success) {
                this.setRememberMe(this.signInForm.value.rememberMe, request.correo, request.clave);
                const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
                this._router.navigateByUrl(redirectURL);
                return;
            }

            this.signInForm.enable();
            this.signInNgForm.resetForm();

            if (iniciaSesionResponse.response.code == ErrorCodigo.Advertencia) {
                this.alert = {
                    type: 'warning',
                    message: iniciaSesionResponse.response.message,
                };
            }

            if (iniciaSesionResponse.response.code == ErrorCodigo.Error) {
                this.alert = {
                    type: 'error',
                    message: iniciaSesionResponse.response.message,
                };
            }

            this.showAlert = Flags.ShowFuseAlert;
            this.isCallingService = Flags.False;
            return;

        }, err => {
            this.alert = {
                type: 'error',
                message: DictionaryErrors.Transaction,
            };
            this.showAlert = Flags.ShowFuseAlert;
            this.signInForm.enable();
            this.isCallingService = Flags.False;
            console.log(err);
        });
    }

    validarUsuario(usuario): boolean {

        if (usuario.length < Numeracion.Doce) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidUsuarioMinLength,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return Flags.False;
        }

        if (usuario.length > Numeracion.Cuarenta) {
            this.alert = {
                type: 'warning',
                message: DictionaryWarning.InvalidUsuarioMaxLength,
            };
            this.showAlert = Flags.ShowFuseAlert;
            return Flags.False;
        }

        this.showAlert = Flags.HideFuseAlert;
        return Flags.True;
    }

    setRememberMe(rememberMe: boolean, correo: string, clave: string) {
        if (rememberMe) {
            localStorage.setItem('rememberuserInfoLogueado', JSON.stringify({ correo, clave }));
            return;
        }
        localStorage.removeItem('rememberuserInfoLogueado');
    }

    isMobilSize(): boolean {
        return this._toolService.isMobilSize();
    }

}
