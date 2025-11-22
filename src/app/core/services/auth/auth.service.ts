import { Injectable } from '@angular/core';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ApiService } from '../http/api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import * as Url from '../../constants/api.constants';
import { UsuarioIniciaSesionRequest } from 'app/core/models/auth/filtro/usuario-inicia-sesion-request.model';
import { ParametroGeneralDTO } from 'app/core/models/parametro/parametro-general-dto.model';
import { RegistrarUsuarioRequest } from 'app/core/models/usuario/request/registrar-usuario-request.model';
import { Country } from 'app/core/models/auth/filtro/countries.request.model';
import { HttpClient } from '@angular/common/http';
import { ExistEmailRequest } from 'app/core/models/auth/filtro/exist-email-request.model';
import { VerifyOTPEmailRequest } from 'app/core/models/auth/filtro/verify-otp-email-request.model';
import { GenerateOTPEmailRequest } from 'app/core/models/auth/filtro/generate-otp-email-request.model';
import { NotifyOlvideContraseniaRequest } from 'app/core/models/usuario/request/notify-olvide-contrasenia-request.model';
import { RestablecerContraseniaRequest } from 'app/core/models/usuario/request/restablecer--contrasenia-request.model';
import { VerifyTokenRestablecerContraseniaRequest } from 'app/core/models/auth/filtro/verify-token-restablecer-contrasenia-request.model';
import { ToolService } from '../tool/tool.service';
import { ObtenerUsuarioRequest } from 'app/core/models/usuario/request/obtener-usuario-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _countries: BehaviorSubject<Country[] | null> = new BehaviorSubject(null);

  get countries$(): Observable<Country[]> {
    return this._countries.asObservable();
  }

  private _responseValidateToken: BehaviorSubject<ResponseDTO | null> = new BehaviorSubject(null);

  get responseValidateToken$(): Observable<ResponseDTO> {
    return this._responseValidateToken.asObservable();
  }

  constructor(private apiService: ApiService,
    private _httpClient: HttpClient,
    private _toolService: ToolService) { }

  ExistEmailAsync(request: ExistEmailRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Auth.ExistEmailAsync, request)
      .pipe(tap(data => data));
  }

  IniciaSesionAsync(request: UsuarioIniciaSesionRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Auth.IniciaSesionAsync, request)
      .pipe(tap(data => data));
  }

  GenerateOTPEmailAsync(request: GenerateOTPEmailRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Auth.GenerateOTPEmailAsync, request)
      .pipe(tap(data => data));
  }

  NotifyOlvideContraseniaAsync(request: NotifyOlvideContraseniaRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Auth.NotifyOlvideContraseniaAsync, request)
      .pipe(tap(data => data));
  }

  RestablecerContraseniaAsync(request: RestablecerContraseniaRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Auth.RestablecerContraseniaAsync, request)
      .pipe(tap(data => data));
  }

  VerifyOTPEmailAsync(request: VerifyOTPEmailRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Auth.VerifyOTPEmailAsync, request)
      .pipe(tap(data => data));
  }

  GetParametersSignUpAsync(): Observable<ParametroGeneralDTO> {
    return this.apiService.query(Url.Auth.GetParametersSignUpAsync, '')
      .pipe(tap(data => data));
  }

  getCountries(): Observable<Country[]> {
    return this._httpClient.get<Country[]>('api/apps/contacts/countries').pipe(
      tap((countries) => {
        this._countries.next(countries);
      }),
    );
  }

  VerifyTokenRestablecerContraseniaAsync(): Observable<ResponseDTO> {

    const request = new VerifyTokenRestablecerContraseniaRequest();

    const fullUrl = window.location.href;
    const correoSegment = fullUrl.split('reset-password/')[1];
    const token = decodeURIComponent(correoSegment);
    request.destinationTimeZone = this._toolService.getTimeZone();
    request.token = token;

    return this.apiService.query(Url.Auth.VerifyTokenRestablecerContraseniaAsync, request).pipe(
      tap((response: ResponseDTO) => {

        this._responseValidateToken.next(response);
      }),
    );
  }


}
