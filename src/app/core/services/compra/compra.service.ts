import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { Observable, tap } from 'rxjs';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';

import { RegistrarCompraRequest } from 'app/core/models/compra/request/registrar-compra-request.model';
import { ObtenerCompraRequest } from 'app/core/models/compra/request/obtener-compra-request.model';
import { CompraDTO } from 'app/core/models/compra/response/compra-dto.model';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { AnularCompraRequest } from 'app/core/models/compra/request/anular-compra-request.model';

@Injectable({
    providedIn: 'root'
})
export class CompraService {

    constructor(private apiService: ApiService) { }

    // 📌 Obtener compras filtradas (por fecha, proveedor, etc.)
    GetAllByFilterAsync(request: ObtenerCompraRequest): Observable<CompraDTO[]> {
        return this.apiService.post(Url.Compra.GetAllByFilterAsync, request)
            .pipe(tap(data => data));
    }

    // 📌 Obtener usuarios (si compras también necesita usuarios)
    GetAllUsuariosAsync(): Observable<UsuarioDTO[]> {
        return this.apiService.query(Url.Compra.GetAllUsuariosAsync, {})
            .pipe(tap(data => data));
    }

    // 📌 Registrar compra
    InsertAsync(request: RegistrarCompraRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Compra.InsertAsync, request)
            .pipe(tap(data => data));
    }

    // 📌 Anular compra
    AnulaAsync(request: AnularCompraRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Compra.AnulaAsync, request)
            .pipe(tap(data => data));
    }

}
