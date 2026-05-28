import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Devolucion } from 'app/core/constants/api.constants';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { RegistrarDevolucionRequest } from 'app/core/models/inventario/devolucion/request/registrar-devolucion-request.model';
import { ObtenerDevolucionesRequest } from 'app/core/models/inventario/devolucion/request/obtener-devoluciones-request.model';
import { DevolucionItemDTO } from 'app/core/models/inventario/devolucion/response/devolucion-item-dto.model';

@Injectable({ providedIn: 'root' })
export class DevolucionService {

    constructor(private apiService: ApiService) { }

    RegistrarAsync(request: RegistrarDevolucionRequest): Observable<ResponseDTO> {
        return this.apiService.post(Devolucion.RegistrarAsync, request).pipe(tap(data => data));
    }

    GetAllByFilterAsync(request: ObtenerDevolucionesRequest): Observable<DevolucionItemDTO[]> {
        return this.apiService.post(Devolucion.GetAllByFilterAsync, request).pipe(tap(data => data));
    }
}
