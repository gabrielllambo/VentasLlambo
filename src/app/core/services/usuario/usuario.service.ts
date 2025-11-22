import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { SecurityService } from 'app/core/auth/auth.service';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ActualizarContraseniaRequest } from 'app/core/models/usuario/request/actualizar-contrasenia-request.model';
import { ActualizarNoEsPrimerLogueoRequest } from 'app/core/models/auth/filtro/actualizar-no-es-primer-logueo-request.model';
import { ObtenerUsuarioRequest } from 'app/core/models/usuario/request/obtener-usuario-request.model';
import { RegistrarUsuarioRequest } from 'app/core/models/usuario/request/registrar-usuario-request.model';
import { ActualizarUsuarioRequest } from 'app/core/models/usuario/request/actualizar-usuario-request.model';
import { ActualizarActivoUsuarioRequest } from 'app/core/models/usuario/request/actualizar-activo-usuario-request.model';
import { EliminarUsuarioRequest } from 'app/core/models/usuario/request/eliminar-usuario-request.model';
import { ExistCorreoUsuarioRequest } from 'app/core/models/usuario/request/exist-correo-usuario-request.model';
import { ExistNumeroDocumentoUsuarioRequest } from 'app/core/models/usuario/request/exist-numero-documento-usuario-request.model';
import { ObtenerColaboradoresRequest } from 'app/core/models/usuario/request/obtener-colabores-request.model';
import { ObtenerColaboradoresActivosDTO } from 'app/core/models/usuario/response/obtener-colaboradores-activos-dto.model';
import { EnviarEnlacePagoRequest } from 'app/core/models/usuario/request/enviar-enlace-pago-request.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private _usuarioDetalleData: BehaviorSubject<UsuarioDTO> = new BehaviorSubject(null);

  constructor(private apiService: ApiService,
    private _securityService: SecurityService,
  ) { }

  get usuarioData$(): Observable<UsuarioDTO> {
    return this._usuarioDetalleData.asObservable();
  }

  GetAllByFilterAsync(request: ObtenerUsuarioRequest): Observable<UsuarioDTO[]> {
    return this.apiService.post(Url.Usuario.GetAllByFilterAsync, request)
      .pipe(tap(data => data));
  }
  
  GetAllActivesAsync(request: ObtenerColaboradoresRequest): Observable<ObtenerColaboradoresActivosDTO[]> {
    return this.apiService.post(Url.Usuario.GetAllActivesAsync, request)
      .pipe(tap(data => data));
  }

  ExistCorreoAsync(request: ExistCorreoUsuarioRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.ExistCorreoAsync, request)
      .pipe(tap(data => data));
  }

  ExistNumeroDocumentoAsync(request: ExistNumeroDocumentoUsuarioRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.ExistNumeroDocumentoAsync, request)
      .pipe(tap(data => data));
  }

  InsertAsync(request: RegistrarUsuarioRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.InsertAsync, request)
      .pipe(tap(data => data));
  }

  UpdateAsync(request: ActualizarUsuarioRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.UpdateAsync, request)
      .pipe(tap(data => data));
  }

  UpdateActivoAsync(request: ActualizarActivoUsuarioRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.UpdateActivoAsync, request)
      .pipe(tap(data => data));
  }

  DeleteAsync(request: EliminarUsuarioRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.DeleteAsync, request)
      .pipe(tap(data => data));
  }

  EnviarEnlacePagoAsync(request: EnviarEnlacePagoRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.EnviarEnlacePagoAsync, request)
      .pipe(tap(data => data));
  }

  GetPersonalInfoAsync(): Observable<UsuarioDTO> {
    const idUsuario = this._securityService.getDecodetoken().idUsuario;
    return this.apiService.query(Url.Usuario.GetPersonalInfoAsync, { idUsuario }).pipe(
      tap((response: UsuarioDTO) => { this._usuarioDetalleData.next(response); }),
    );
  }

  UpdateUsuarioContraseniaByIdAsync(request: ActualizarContraseniaRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Usuario.UpdateUsuarioContraseniaByIdAsync, request)
      .pipe(tap(data => data));
  }

  UpdateNoEsPrimerLogueoAsync(request: ActualizarNoEsPrimerLogueoRequest) {
    return this.apiService.post(Url.Usuario.UpdateNoEsPrimerLogueoAsync, request)
      .pipe(tap(data => data));
  }

}
