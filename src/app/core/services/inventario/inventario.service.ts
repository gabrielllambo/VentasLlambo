import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import * as Url from '../../constants/api.constants';
import { Observable, tap } from 'rxjs';
import { RegistrarCategoriaRequest } from 'app/core/models/inventario/categoria/request/registrar-categoria-request.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ObtenerCategoriaRequest } from 'app/core/models/inventario/categoria/request/obtener-categoria-request.model';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { ActualizarCategoriaRequest } from 'app/core/models/inventario/categoria/request/actualizar-categoria-request.model';
import { EliminarCategoriaRequest } from 'app/core/models/inventario/categoria/request/eliminar-categoria-request.model';
import { ActualizarActivoCategoriaRequest } from 'app/core/models/inventario/categoria/request/actualizar-activo-categoria-request.model';
import { MedidaDTO } from '../../models/inventario/medida/response/medida-dto.model';
import { ObtenerMarcaRequest } from 'app/core/models/inventario/marca/request/obtener-marca-request.model';
import { RegistrarMarcaRequest } from 'app/core/models/inventario/marca/request/registrar-marca-request.model';
import { ActualizarMarcaRequest } from 'app/core/models/inventario/marca/request/actualizar-marca-request.model';
import { ActualizarActivoMarcaRequest } from 'app/core/models/inventario/marca/request/actualizar-activo-marca-request.model';
import { EliminarMarcaRequest } from 'app/core/models/inventario/marca/request/eliminar-marca-request.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ObtenerProductoPorCodigoRequest } from 'app/core/models/inventario/producto/request/obtener-producto-por-codigo-request.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { ObtenerProductoRequest } from 'app/core/models/inventario/producto/request/obtener-producto-request.model';
import { RegistrarProductoRequest } from 'app/core/models/inventario/producto/request/registrar-producto-request.model';
import { ActualizarProductoRequest } from 'app/core/models/inventario/producto/request/actualizar-producto-request.model';
import { ActualizarActivoProductoRequest } from 'app/core/models/inventario/producto/request/actualizar-activo-producto-request.model';
import { EliminarProductoRequest } from 'app/core/models/inventario/producto/request/eliminar-producto-request.model';
import { CategoriaConConteoDTO } from 'app/core/models/inventario/producto/response/categoria-con-conteo-dto.model';

@Injectable({
    providedIn: 'root'
})
export class InventarioService {

    constructor(private apiService: ApiService) { }

    GetAllMedidaAsync(idUsuarioGuid: string): Observable<MedidaDTO[]> {
        return this.apiService.query(Url.Inventario.Medida.GetAllMedidaAsync, { idUsuarioGuid })
            .pipe(tap(data => data));
    }

    GetAllCategoriaByFilterAsync(request: ObtenerCategoriaRequest): Observable<CategoriaDTO[]> {
        return this.apiService.query(Url.Inventario.Categoria.GetAllCategoriaByFilterAsync, request)
            .pipe(tap(data => data));
    }

    GetAllCategoriasForComboBoxAsync(): Observable<CategoriaDTO[]> {
        return this.apiService.query(Url.Inventario.Categoria.GetAllCategoriasForComboBoxAsync, {})
            .pipe(tap(data => data));
    }

    InsertCategoriaAsync(request: RegistrarCategoriaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Categoria.InsertCategoriaAsync, request)
            .pipe(tap(data => data));
    }

    UpdateCategoriaAsync(request: ActualizarCategoriaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Categoria.UpdateCategoriaAsync, request)
            .pipe(tap(data => data));
    }

    GetProductoByCodeAsync(request: ObtenerProductoPorCodigoRequest): Observable<ProductoDTO[]> {
        return this.apiService.query(Url.Inventario.Producto.GetProductoByCodeAsync, request)
            .pipe(tap(data => data));
    }

    GetAllProductoByFilterAsync(request: ObtenerProductoRequest): Observable<ProductoDTO[]> {
        return this.apiService.post(Url.Inventario.Producto.GetAllProductoByFilterAsync, request)
            .pipe(tap(data => data));
    }

    GetCategoriesWithProductsCountAsync(): Observable<CategoriaConConteoDTO[]> {
        return this.apiService.query(Url.Inventario.Producto.GetCategoriesWithProductsCountAsync, {})
            .pipe(tap(data => data));
    }

    GetAllProductsByCategoryAsync(idCategory: number): Observable<ProductoDTO[]> {
        return this.apiService.query(Url.Inventario.Producto.GetAllProductsByCategoryAsync, { idCategory})
            .pipe(tap(data => data));
    }

    GetAllProductoForComboBoxAsync(): Observable<ProductoDTO[]> {
        return this.apiService.query(Url.Inventario.Producto.GetAllProductoForComboBoxAsync, {})
            .pipe(tap(data => data));
    }
 
    InsertProductoAsync(request: RegistrarProductoRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Producto.InsertProductoAsync, request)
            .pipe(tap(data => data));
    }

    UpdateProductoAsync(request: ActualizarProductoRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Producto.UpdateProductoAsync, request)
            .pipe(tap(data => data));
    }

    UpdateActivoProductoAsync(request: ActualizarActivoProductoRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Producto.UpdateActivoProductoAsync, request)
            .pipe(tap(data => data));
    }

    DeleteProductoAsync(request: EliminarProductoRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Producto.DeleteProductoAsync, request)
            .pipe(tap(data => data));
    }

    DeleteCategoriaAsync(request: EliminarCategoriaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Categoria.DeleteCategoriaAsync, request)
            .pipe(tap(data => data));
    }
 
    UpdateActivoCategoriaAsync(request: ActualizarActivoCategoriaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Categoria.UpdateActivoCategoriaAsync, request)
            .pipe(tap(data => data));
    }

    GetAllMarcaByFilterAsync(request: ObtenerMarcaRequest): Observable<MarcaDTO[]> {
        return this.apiService.query(Url.Inventario.Marca.GetAllMarcaByFilterAsync, request)
            .pipe(tap(data => data));
    }
 
    GetAllMarcasForComboBoxAsync(): Observable<MarcaDTO[]> {
        return this.apiService.query(Url.Inventario.Marca.GetAllMarcasForComboBoxAsync, {})
            .pipe(tap(data => data));
    }

    InsertMarcaAsync(request: RegistrarMarcaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Marca.InsertMarcaAsync, request)
            .pipe(tap(data => data));
    }

    UpdateMarcaAsync(request: ActualizarMarcaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Marca.UpdateMarcaAsync, request)
            .pipe(tap(data => data));
    }

    DeleteMarcaAsync(request: EliminarMarcaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Marca.DeleteMarcaAsync, request)
            .pipe(tap(data => data));
    }

    UpdateActivoMarcaAsync(request: ActualizarActivoMarcaRequest): Observable<ResponseDTO> {
        return this.apiService.post(Url.Inventario.Marca.UpdateActivoMarcaAsync, request)
            .pipe(tap(data => data));
    }

}
