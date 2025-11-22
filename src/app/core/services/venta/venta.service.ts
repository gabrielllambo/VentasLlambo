import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { Observable, tap } from 'rxjs';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { RegistrarVentaRequest } from 'app/core/models/venta/request/registrar-venta-request.model';
import { ObtenerVentaRequest } from 'app/core/models/venta/request/obtener-venta-request.model';
import { VentaDTO } from 'app/core/models/venta/response/venta-dto.model';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { AnularVentaRequest } from 'app/core/models/venta/request/anular-venta-request.model';

@Injectable({
    providedIn: 'root'
})
export class VentaService {

    constructor(private apiService: ApiService) { }

    GetAllByFilterAsync(request: ObtenerVentaRequest): Observable<VentaDTO[]> {
        return this.apiService.post(Url.Venta.GetAllByFilterAsync, request)
            .pipe(tap(data => data));
    }
 
    GetAllUsuariosAsync(): Observable<UsuarioDTO[]> {
        return this.apiService.query(Url.Venta.GetAllUsuariosAsync, {})
            .pipe(tap(data => data));
    }

    InsertAsync(request: RegistrarVentaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Venta.InsertAsync, request)
            .pipe(tap(data => data));
    }

    AnulaAsync(request: AnularVentaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Venta.AnulaAsync, request)
            .pipe(tap(data => data));
    }
 
}
