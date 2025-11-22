import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { Observable, tap } from 'rxjs';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { EliminarClienteRequest } from 'app/core/models/clientes/request/eliminar-cliente-request.model';
import { ActualizarActivoClienteRequest } from 'app/core/models/clientes/request/actualizar-activo-cliente-request.model';
import { RegistrarClienteRequest } from 'app/core/models/clientes/request/registrar-cliente-request.model';
import { ActualizarClienteRequest } from 'app/core/models/clientes/request/actualizar-cliente-request.model';
import { ObtenerClienteRequest } from 'app/core/models/clientes/request/obtener-cliente-request.model';
import { ClienteDTO } from 'app/core/models/clientes/response/cliente-dto.model';
import { ExistCorreoClienteRequest } from 'app/core/models/clientes/request/exist-correo-cliente-request.model';
import { ExistNumeroDocumentoClienteRequest } from 'app/core/models/clientes/request/exist-numero-documento-cliente-request.model';
import { ObtenerClientePorNumDocumentoCorreoRequest } from 'app/core/models/clientes/request/obtener-cliente-por-num-documento-correo-request.model';

@Injectable({
    providedIn: 'root'
})
export class ClienteService {

    constructor(private apiService: ApiService) { }

    GetAllByFilterAsync(request: ObtenerClienteRequest): Observable<ClienteDTO[]> {
        return this.apiService.post(Url.Cliente.GetAllByFilterAsync, request)
            .pipe(tap(data => data));
    }

    ExistCorreoAsync(request: ExistCorreoClienteRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Cliente.ExistCorreoAsync, request)
            .pipe(tap(data => data));
    }

    ExistNumeroDocumentoAsync(request: ExistNumeroDocumentoClienteRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Cliente.ExistNumeroDocumentoAsync, request)
            .pipe(tap(data => data));
    }

    GetByNumDocumentoCorreoAsync(request: ObtenerClientePorNumDocumentoCorreoRequest): Observable<ClienteDTO> {
        return this.apiService.query(Url.Cliente.GetByNumDocumentoCorreoAsync, request)
            .pipe(tap(data => data));
    }

    InsertAsync(request: RegistrarClienteRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Cliente.InsertAsync, request)
            .pipe(tap(data => data));
    }

    UpdateAsync(request: ActualizarClienteRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Cliente.UpdateAsync, request)
            .pipe(tap(data => data));
    }

    DeleteAsync(request: EliminarClienteRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Cliente.DeleteAsync, request)
            .pipe(tap(data => data));
    }

    UpdateActivoAsync(request: ActualizarActivoClienteRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Cliente.UpdateActivoAsync, request)
            .pipe(tap(data => data));
    }

}
