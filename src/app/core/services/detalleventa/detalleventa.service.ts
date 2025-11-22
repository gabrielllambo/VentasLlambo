import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { Observable, tap } from 'rxjs';
import { ObtenerDetalleVentaRequest } from 'app/core/models/venta/request/obtener-detalle-venta-request.model';
import { DetalleVentaDTO } from 'app/core/models/venta/response/detalle-venta-dto.model';
import { ObtenerReporteMarcaRequest } from 'app/core/models/venta/request/obtener-reporte-marca-request.model';
import { VentaAnalisisCategoriasDTO, } from 'app/core/models/venta/response/reporte/categoria/venta-analisis-categorias-dto.model';
import { ObtenerReporteCategoriaRequest } from 'app/core/models/venta/request/obtener-reporte-categoria-request.model';
import { VentaAnalisisMarcasDTO } from 'app/core/models/venta/response/reporte/marca/venta-analisis-marcas-dto.model';
import { ObtenerResumenReporteRequest } from 'app/core/models/venta/request/obtener-totalizado-fecha-request.model';
import { ReporteResumenDTO } from 'app/core/models/venta/response/reporte/reporte-resumen-dto.model';
import { ObtenerReporteProductoRequest } from 'app/core/models/venta/request/obtener-reporte-producto-request.model';
import { VentaAnalisisProductosDTO } from 'app/core/models/venta/response/reporte/producto/venta-analisis-productos-dto.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';

@Injectable({
    providedIn: 'root'
})
export class DetalleVentaService {

    constructor(private apiService: ApiService) { }

    GetDetalleAsync(request: ObtenerDetalleVentaRequest): Observable<DetalleVentaDTO[]> {
        return this.apiService.query(Url.DetalleVenta.GetDetalleAsync, request)
            .pipe(tap(data => data));
    }

    GetAnalisisProductosByFilterAsync(request: ObtenerReporteProductoRequest): Observable<VentaAnalisisProductosDTO> {
        return this.apiService.post(Url.DetalleVenta.GetAnalisisProductosByFilterAsync, request)
            .pipe(tap(data => data));
    }

    GetAnalisisCategoriasByFilterAsync(request: ObtenerReporteCategoriaRequest): Observable<VentaAnalisisCategoriasDTO> {
        return this.apiService.post(Url.DetalleVenta.GetAnalisisCategoriasByFilterAsync, request)
            .pipe(tap(data => data));
    }

    GetAnalisisMarcasByFilterAsync(request: ObtenerReporteMarcaRequest): Observable<VentaAnalisisMarcasDTO> {
        return this.apiService.post(Url.DetalleVenta.GetAnalisisMarcasByFilterAsync, request)
            .pipe(tap(data => data));
    }

    GetResumenReporteAsync(request: ObtenerResumenReporteRequest): Observable<ReporteResumenDTO> {
        return this.apiService.post(Url.DetalleVenta.GetResumenReporteAsync, request)
            .pipe(tap(data => data));
    }

    GetReportePorProductosAsync(request: ObtenerReporteProductoRequest): Observable<any> {
        return this.apiService.postBlob(Url.DetalleVenta.GetReportePorProductosAsync, request)
            .pipe(tap(data => data));
    }

    GetReportePorCategoriasAsync(request: ObtenerReporteCategoriaRequest): Observable<any> {
        return this.apiService.postBlob(Url.DetalleVenta.GetReportePorCategoriasAsync, request)
            .pipe(tap(data => data));
    }

    GetReportePorMarcasAsync(request: ObtenerReporteMarcaRequest): Observable<any> {
        return this.apiService.postBlob(Url.DetalleVenta.GetReportePorMarcasAsync, request)
            .pipe(tap(data => data));
    }

}
