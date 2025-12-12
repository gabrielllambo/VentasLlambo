import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { Observable, tap } from 'rxjs';

// REQUESTS
import { ObtenerDetalleCompraRequest } from 'app/core/models/compra/request/obtener-detalle-compra-request.model';
import { ObtenerReporteProductoCompraRequest } from 'app/core/models/compra/request/obtener-reporte-producto-request.model';
import { ObtenerReporteMarcaCompraRequest } from 'app/core/models/compra/request/obtener-reporte-marca-request.model';
import { ObtenerReporteCategoriaCompraRequest } from 'app/core/models/compra/request/obtener-reporte-categoria-request.model';
import { ObtenerResumenReporteCompraRequest } from 'app/core/models/compra/request/obtener-totalizado-fecha-request.model';

// RESPONSES
import { DetalleCompraDTO } from 'app/core/models/compra/response/detalle-compra-dto.model';
import { CompraAnalisisProductosDTO } from 'app/core/models/compra/response/reporte/producto/compra-analisis-productos-dto.model';
import { CompraAnalisisCategoriasDTO } from 'app/core/models/compra/response/reporte/categoria/compra-analisis-categorias-dto.model';
import { CompraAnalisisMarcasDTO } from 'app/core/models/compra/response/reporte/marca/compra-analisis-marcas-dto.model';
import { ReporteResumenComprasDTO } from 'app/core/models/compra/response/reporte/reporte-resumen-dto.model';

// GENERIC
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';

@Injectable({
    providedIn: 'root'
})
export class DetalleCompraService {

    constructor(private apiService: ApiService) {}

    /** ============================
     *   DETALLE POR ID COMPRA
     * ============================ */
    GetDetalleAsync(request: ObtenerDetalleCompraRequest): Observable<DetalleCompraDTO[]> {
        return this.apiService.query(Url.DetalleCompra.GetDetalleAsync, request)
            .pipe(tap(data => data));
    }

    /** ============================
     *   ANÁLISIS POR PRODUCTO
     * ============================ */
    GetAnalisisProductosByFilterAsync(
        request: ObtenerReporteProductoCompraRequest
    ): Observable<CompraAnalisisProductosDTO> {
        return this.apiService.post(Url.DetalleCompra.GetAnalisisProductosByFilterAsync, request)
            .pipe(tap(data => data));
    }

    /** ============================
     *   ANÁLISIS POR CATEGORÍA
     * ============================ */
    GetAnalisisCategoriasByFilterAsync(
        request: ObtenerReporteCategoriaCompraRequest
    ): Observable<CompraAnalisisCategoriasDTO> {
        return this.apiService.post(Url.DetalleCompra.GetAnalisisCategoriasByFilterAsync, request)
            .pipe(tap(data => data));
    }

    /** ============================
     *   ANÁLISIS POR MARCA
     * ============================ */
    GetAnalisisMarcasByFilterAsync(
        request: ObtenerReporteMarcaCompraRequest
    ): Observable<CompraAnalisisMarcasDTO> {
        return this.apiService.post(Url.DetalleCompra.GetAnalisisMarcasByFilterAsync, request)
            .pipe(tap(data => data));
    }

    /** ============================
     *   RESUMEN TOTALIZADO FECHAS
     * ============================ */
    GetResumenReporteAsync(
        request: ObtenerResumenReporteCompraRequest
    ): Observable<ReporteResumenComprasDTO> {
        return this.apiService.post(Url.DetalleCompra.GetResumenReporteAsync, request)
            .pipe(tap(data => data));
    }

    /** ============================
     *   REPORTES EXPORT (EXCEL)
     * ============================ */
    GetReportePorProductosAsync(request: ObtenerReporteProductoCompraRequest): Observable<any> {
        return this.apiService.postBlob(Url.DetalleCompra.GetReportePorProductosAsync, request)
            .pipe(tap(data => data));
    }

    GetReportePorCategoriasAsync(request: ObtenerReporteCategoriaCompraRequest): Observable<any> {
        return this.apiService.postBlob(Url.DetalleCompra.GetReportePorCategoriasAsync, request)
            .pipe(tap(data => data));
    }

    GetReportePorMarcasAsync(request: ObtenerReporteMarcaCompraRequest): Observable<any> {
        return this.apiService.postBlob(Url.DetalleCompra.GetReportePorMarcasAsync, request)
            .pipe(tap(data => data));
    }
}
