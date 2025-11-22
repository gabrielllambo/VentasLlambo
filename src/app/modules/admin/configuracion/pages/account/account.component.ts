import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FuseValidators } from '@fuse/validators';
import { SecurityService } from 'app/core/auth/auth.service';
import { Country } from 'app/core/models/auth/filtro/countries.request.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ParametroGeneralDTO } from 'app/core/models/parametro/parametro-general-dto.model';
import { ActualizarUsuarioRequest } from 'app/core/models/usuario/request/actualizar-usuario-request.model';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { ErrorCodigo, Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { AuthService } from 'app/core/services/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';
import { CommonValidators } from 'app/core/util/functions';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'settings-account',
    templateUrl: './account.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class SettingsAccountComponent implements OnInit {

    public selectedFiles: FileList;
    public actualizaUsuarioForm: UntypedFormGroup;
    public countries: Country[];
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    public isCallingService: boolean = Flags.False;
    public nombreArchivo: string;
    public foto: string;

    showAlert: boolean = Flags.HideFuseAlert;
    @Input() public usuarioDetalleInput: UsuarioDTO;
    @Input() public parametrosGeneralesInput: ParametroGeneralDTO;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private _usuarioService: UsuarioService,
        private cdr: ChangeDetectorRef,
        private _securityService: SecurityService,
        private _toolService: ToolService,
    ) {
    }

    ngOnInit(): void {

        this.foto = this.usuarioDetalleInput.urlFoto;

        this._authService.countries$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((codes: Country[]) => {
                this.countries = codes;
                this.cdr.markForCheck();
            });

        this.actualizaUsuarioForm = this._formBuilder.group({
            nombres: [{ value: this.usuarioDetalleInput.nombres, disabled: Flags.Deshabilitado }],
            apellidos: [{ value: this.usuarioDetalleInput.apellidos, disabled: Flags.Deshabilitado }],
            genero: [{ value: this.usuarioDetalleInput.genero.id, disabled: Flags.Deshabilitado }],
            correoElectronico: [{ value: this.usuarioDetalleInput.correoElectronico, disabled: Flags.Deshabilitado }],
            tipoDocumento: [{ value: this.usuarioDetalleInput.tipoDocumento.id, disabled: Flags.Deshabilitado }],
            rol: [{ value: this.usuarioDetalleInput.rol.id, disabled: Flags.Deshabilitado }],
            numeroDocumento: [{ value: this.usuarioDetalleInput.numeroDocumento, disabled: Flags.Deshabilitado }],
            direccion: [this.usuarioDetalleInput.direccion, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cien)]],
            celular: [this.usuarioDetalleInput.celular, [Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Cincuenta), CommonValidators.onlyPhoneNumbersForm()]],
            fechaNacimiento: [{ value: this.usuarioDetalleInput.fechaNacimiento, disabled: Flags.Deshabilitado }],
            fechaRegistro: [{ value: this.usuarioDetalleInput.fechaRegistro, disabled: Flags.Deshabilitado }],
        });
    }

    UpdateUsuarioDetalleAsync() {

        if (this.actualizaUsuarioForm.invalid) { return; }

        const destinationTimeZoneId = this._toolService.getTimeZone();
        const idUsuario = this.usuarioDetalleInput.usuarioID.idUsuarioGuid;
        const cboRolSelected = this.actualizaUsuarioForm.get('rol').value;
        const txtCelular = this.actualizaUsuarioForm.get('celular').value;
        const txtDireccion = this.actualizaUsuarioForm.get('direccion').value;

        if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
            this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(idUsuario)) {
            this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
            return;
        }

        const request = new ActualizarUsuarioRequest();

        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.idUsuario = idUsuario;
        request.idUsuarioSeleccionado = idUsuario;
        request.idRol = cboRolSelected;
        request.celular = txtCelular;
        request.direccion = txtDireccion;
        request.nombreArchivo = this.nombreArchivo;
        request.foto = this.foto;

        this.actualizaUsuarioForm.disable();
        this.isCallingService = Flags.True;

        this._usuarioService.UpdateAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success == Flags.SuccessTransaction) {
                
                this._toolService.showSuccess(response.message, response.titleMessage);
                this.actualizaUsuarioForm.enable();
                this.isCallingService = Flags.False;

                const currentDecodeToken = this._securityService.getDecodetoken();
                currentDecodeToken.urlfoto = response.value;

                this._securityService.setDecodeTokenStorage(currentDecodeToken);

                return;
            }

            if (response.code == ErrorCodigo.Advertencia) {
                this._toolService.showWarning(response.message, response.titleMessage);
                this.actualizaUsuarioForm.enable();
                this.isCallingService = Flags.False;
                return;
            }

        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.actualizaUsuarioForm.enable();
            this.isCallingService = Flags.False;
            console.log(err);
        });
    }

    isMobilSize(): boolean {
        return this._toolService.isMobilSize();
    }

    onFileSelected(event: any) {

        if (this.excedeTamanioFiles(event.target.files)) {
            event.target.value = ''
            this.selectedFiles = null;
            this._toolService.showWarning(DictionaryWarning.ExcedeTamanioArchivos, DictionaryWarning.Tittle)
            return;
        }

        const files = event.target.files;

        if (files.length > Numeracion.Cero) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.selectedFiles = e.target.result;
                const base64String = e.target.result as string;
                this.foto = base64String.split(',')[1];
                this.nombreArchivo = file.name;

                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }

    excedeTamanioFiles(selectedFiles: FileList): boolean {

        let totalSizeInBytes = Numeracion.Cero;

        for (let i = Numeracion.Cero; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            totalSizeInBytes += file.size;
        }

        const totalSizeInKB = totalSizeInBytes / 1024;

        const maxSizeInKB = 250;

        if (totalSizeInKB > maxSizeInKB) {
            return Flags.True;
        }

        return Flags.False;
    }

    eliminarFoto() {
        this.selectedFiles = null;
        this.nombreArchivo = null;
        this.foto = null;

    }

}
