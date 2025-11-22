import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { Observable, of, switchMap } from 'rxjs';
import * as Url from '../constants/api.constants';
import { Flags } from '../resource/dictionary.constants';
import { UsuarioIniciaSesionRequest } from '../models/auth/filtro/usuario-inicia-sesion-request.model';
import { ApiService } from '../services/http/api.service';
import { DecodedToken } from '../models/auth/response/decode-token-dto.model';
import { IniciaSesionDTO } from '../models/auth/response/inicia-sesion-dto.model';
import { MenuRolDTO } from '../models/parametro/menu-rol-dto.model';
import { MonedaDTO } from '../models/parametro/moneda-dto.model';

@Injectable({ providedIn: 'root' })
export class SecurityService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _apiservice = inject(ApiService);
    public decodeToken: DecodedToken;

    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    IniciaSesionAsync(request: UsuarioIniciaSesionRequest): Observable<IniciaSesionDTO> {
        return this._apiservice.post(Url.Auth.IniciaSesionAsync, request).pipe(
            switchMap((iniciaSesionResponse: IniciaSesionDTO) => {
                if (iniciaSesionResponse.response.success) {
                    const decodeToken = AuthUtils._decodeToken(iniciaSesionResponse.response.value);
                    this.setAccessTokenStorage(iniciaSesionResponse.response.value);
                    this.setDecodeTokenStorage(decodeToken);
                    this.setMenuStorage(iniciaSesionResponse.menuRol);
                    this.setMonedaStorage(iniciaSesionResponse.moneda);
                    this._authenticated = Flags.Autenticado;
                }
                return of(iniciaSesionResponse);
            }),
        );
    }

    signInuserInfoLogueadoStorage(): Observable<any> {
        const userInfoLogueadoData = localStorage.getItem('decodeTokenStorage');
        const userInfoLogueadoDataObject = JSON.parse(userInfoLogueadoData);

        if (userInfoLogueadoDataObject) {
            this.decodeToken = userInfoLogueadoDataObject
        }

        else {
            return of(false);
        }


        if (this.decodeToken.idUsuario != '') {
            this._authenticated = true;
            return of(true);
        }

        return of(false);
    }

    signOut(): Observable<any> {

        localStorage.removeItem('accessToken');
        localStorage.removeItem('decodeTokenStorage');
        localStorage.removeItem('menuStorage');
        localStorage.removeItem('monedaStorage');

        this._authenticated = false;

        return of(true);
    }

    check(): Observable<boolean> {

        let accessToken = this.getAccessTokenStorage();

        if (!accessToken) { return of(Flags.TokenInvalido); }

        if (AuthUtils.isTokenExpired(accessToken)) { return of(Flags.TokenExpirado); }

        return this.signInuserInfoLogueadoStorage();
    }

    getAccessTokenStorage(): string {
        const accessToken = localStorage.getItem('accessToken');
        return accessToken;
    }

    getDecodetoken(): DecodedToken {
        const objStorage = localStorage.getItem('decodeTokenStorage');
        return objStorage ? JSON.parse(objStorage).decodeToken : null;
    }

    setAccessTokenStorage(accessToken: string) {
        localStorage.removeItem('accessToken');
        localStorage.setItem('accessToken', accessToken);
    }

    setDecodeTokenStorage(decodeToken: DecodedToken) {
        localStorage.removeItem('decodeTokenStorage');
        localStorage.setItem('decodeTokenStorage', JSON.stringify({ decodeToken }));
    }

    setMenuStorage(menu: MenuRolDTO[]) {
        localStorage.removeItem('menuStorage');
        localStorage.setItem('menuStorage', JSON.stringify({ menu }));
    }

    getMenuStorage(): MenuRolDTO[] {
        const objStorage = localStorage.getItem('menuStorage');
        return objStorage ? JSON.parse(objStorage).menu : null;
    }

    setMonedaStorage(moneda: MonedaDTO) {
        localStorage.removeItem('monedaStorage');
        localStorage.setItem('monedaStorage', JSON.stringify({ moneda }));
    }

    getMonedaStorage(): MonedaDTO {
        const objStorage = localStorage.getItem('monedaStorage');
        return objStorage ? JSON.parse(objStorage).moneda : null;
    }

}
