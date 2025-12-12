import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { Observable, tap } from 'rxjs';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';

import { EliminarProveedorRequest } from 'app/core/models/proveedores/request/eliminar-proveedor-request.model';
import { ActualizarActivoProveedorRequest } from 'app/core/models/proveedores/request/actualizar-activo-proveedor-request.model';
import { RegistrarProveedorRequest } from 'app/core/models/proveedores/request/registrar-proveedor-request.model';
import { ActualizarProveedorRequest } from 'app/core/models/proveedores/request/actualizar-proveedor-request.model';
import { ObtenerProveedorRequest } from 'app/core/models/proveedores/request/obtener-proveedor-request.model';

import { ProveedorDTO } from 'app/core/models/proveedores/response/proveedor-dto.model';
import { ExistCorreoProveedorRequest } from 'app/core/models/proveedores/request/exist-correo-proveedor-request.model';
import { ExistNumeroDocumentoProveedorRequest } from 'app/core/models/proveedores/request/exist-numero-documento-proveedor-request.model';
import { ObtenerProveedorPorNumDocumentoCorreoRequest } from 'app/core/models/proveedores/request/obtener-proveedor-por-num-documento-correo-request.model';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {

    constructor(private apiService: ApiService) { }

    GetAllByFilterAsync(request: ObtenerProveedorRequest): Observable<ProveedorDTO[]> {
        return this.apiService.post(Url.Proveedor.GetAllByFilterAsync, request)
            .pipe(tap(data => data));
    }

    ExistCorreoAsync(request: ExistCorreoProveedorRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Proveedor.ExistCorreoAsync, request)
            .pipe(tap(data => data));
    }

    ExistNumeroDocumentoAsync(request: ExistNumeroDocumentoProveedorRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Proveedor.ExistNumeroDocumentoAsync, request)
            .pipe(tap(data => data));
    }

    GetByNumDocumentoCorreoAsync(request: ObtenerProveedorPorNumDocumentoCorreoRequest): Observable<ProveedorDTO> {
        return this.apiService.query(Url.Proveedor.GetByNumDocumentoCorreoAsync, request)
            .pipe(tap(data => data));
    }

    InsertAsync(request: RegistrarProveedorRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Proveedor.InsertAsync, request)
            .pipe(tap(data => data));
    }

    UpdateAsync(request: ActualizarProveedorRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Proveedor.UpdateAsync, request)
            .pipe(tap(data => data));
    }

    DeleteAsync(request: EliminarProveedorRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Proveedor.DeleteAsync, request)
            .pipe(tap(data => data));
    }

    UpdateActivoAsync(request: ActualizarActivoProveedorRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Proveedor.UpdateActivoAsync, request)
            .pipe(tap(data => data));
    }

}
