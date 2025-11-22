import { Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import * as Url from '../../constants/api.constants';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';
import { RolDTO } from 'app/core/models/parametro/rol-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { NegocioDTO } from 'app/core/models/parametro/negocio-dto.model';
import { ActualizarNegocioRequest } from 'app/core/models/parametro/request/actualizar-negocio-request.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';

@Injectable({
  providedIn: 'root'
})
export class ParametroGeneralService {

  private _negocioData: BehaviorSubject<NegocioDTO> = new BehaviorSubject(null);
  private _monedaData: BehaviorSubject<MonedaDTO[]> = new BehaviorSubject(null);

  constructor(private apiService: ApiService) { }

  get negocioData$(): Observable<NegocioDTO> {
    return this._negocioData.asObservable();
  }

  get monedaData$(): Observable<MonedaDTO[]> {
    return this._monedaData.asObservable();
  }

  GetAllRolAsync(): Observable<RolDTO[]> {
    return this.apiService.query(Url.Parametro.GetAllRolAsync, {})
      .pipe(tap(data => data));
  }

  GetAllMonedaAsync(): Observable<MonedaDTO[]> {
    return this.apiService.query(Url.Parametro.GetAllMonedaAsync, {}).pipe(
      tap((response: MonedaDTO[]) => { this._monedaData.next(response); }),
    );
  }

  GetAllGeneroAsync(): Observable<GeneroDTO[]> {
    return this.apiService.query(Url.Parametro.GetAllGeneroAsync, {})
      .pipe(tap(data => data));
  }

  GetNegocioAsync(): Observable<NegocioDTO> {
    return this.apiService.query(Url.Parametro.GetNegocioAsync, {}).pipe(
      tap((response: NegocioDTO) => { this._negocioData.next(response); }),
    );
  }

  GetAllTipoDocumentoAsync(): Observable<TipoDocumentoDTO[]> {
    return this.apiService.query(Url.Parametro.GetAllTipoDocumentoAsync, {})
      .pipe(tap(data => data));
  } 
  
  UpdateNegocioAsync(request: ActualizarNegocioRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Parametro.UpdateNegocioAsync, request)
      .pipe(tap(data => data));
  }

}
