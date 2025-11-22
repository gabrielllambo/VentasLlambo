import { EventEmitter, Injectable } from '@angular/core';
import { Numeracion } from 'app/core/resource/dictionary.constants';
import { DateTime } from 'luxon';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../http/api.service';
import { Observable, tap } from 'rxjs';
import * as Url from '../../constants/api.constants';
import { CambiarMonedaRequest } from 'app/core/models/tools/cambiar-moneda-request.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { SecurityService } from 'app/core/auth/auth.service';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';

@Injectable({
  providedIn: 'root'
})
export class ToolService {

  public too: EventEmitter<any>;
  private warningDisplayed = false;
  constructor(
    private apiService: ApiService,
    private _toastService: ToastrService,
    private _securityService: SecurityService,
  ) { }

  obtenerInfouserInfoLogueado(): DecodedToken {
    return this._securityService.getDecodetoken();
  }

  obtenerInfoMoneda(): MonedaDTO {
    return this._securityService.getMonedaStorage();
  }

  GetExchangeRateAsync(request: CambiarMonedaRequest): Observable<ResponseDTO> {
    return this.apiService.post(Url.Tool.GetExchangeRateAsync, request)
      .pipe(tap(data => data));
  }

  getTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  getLocale(): string {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  }

  getDateTimeNow(): Date {
    return new Date();
  }

  getuserInfoLogueadoCultureInfo(): string {
    const cultureInfo = this.obtenerInfoMoneda().cultureInfo
    return cultureInfo
  }

  showWarning(message: string, title: string) {
    if (this.warningDisplayed) return; 
    this.warningDisplayed = true; 
    this._toastService.warning(message, title, {
      positionClass: 'toast-bottom-right'
    });
 
    setTimeout(() => {
      this.warningDisplayed = false;
    }, 3000);
  }

  showError(message: string, title: string) {
    this._toastService.error(message, '', { positionClass: 'toast-bottom-right' });
  }

  showInfo(message: string, title: string) {
    this._toastService.info(message, '', { positionClass: 'toast-bottom-right' });
  }

  showSuccess(message: string, title: string) {
    this._toastService.success(message, '', { positionClass: 'toast-bottom-right' });
  }

  sortingActivoData = (data: any, sortHeaderId: string) => {
    switch (sortHeaderId) {
      case 'activarDesactivar':
        return data.activo ? Numeracion.Uno : Numeracion.Cero;
      default:
        return data[sortHeaderId];
    }
  };

  getNameOfMonth(date: any): string {
    const fecha = DateTime.fromJSDate(new Date(date)).setLocale(this.getuserInfoLogueadoCultureInfo());
    const currentMonthName = fecha.toFormat('LLLL');
    const currentYear = fecha.toFormat('yyyy');
    const capitalizedMonthName = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1).toLowerCase();
    return `${capitalizedMonthName}, ${currentYear}`;
  }

  getCurrencyNumberFormat(codigoMoneda: string): Intl.NumberFormat {
    const userInfoLogueadoLocale = this.getuserInfoLogueadoCultureInfo();
    return new Intl.NumberFormat(userInfoLogueadoLocale, {
      style: 'currency',
      currency: codigoMoneda,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatoFecha(fecha: Date): string {
    const cultureInfo = this.getuserInfoLogueadoCultureInfo();
    const date: Date = new Date(fecha);
    const dateString: string = date.toLocaleDateString(cultureInfo);

    return dateString;
  }

  getMaxDate(): Date {
    return new Date();
  }

  getMinDateFIlter(): Date {
    return new Date(2000, 0, 1);
  }

  getMaxDateFIlter(): Date {
    return new Date(2100, 0, 1);
  }

  getStartDateOfMonth(): Date {
    const today = DateTime.now();
    const cultureInfo = this.getuserInfoLogueadoCultureInfo();
    const firstDayOfMonth = today.setLocale(cultureInfo).startOf('month').startOf('day');
    return firstDayOfMonth.toJSDate();
  }

  getEndDateOfMonth(): Date {
    const today = DateTime.now();
    const cultureInfo = this.getuserInfoLogueadoCultureInfo();
    const endOfMonth = today.setLocale(cultureInfo).endOf('month').startOf('day').plus({ days: Numeracion.Uno });
    return endOfMonth.toJSDate();
  }

  isMobilSize(): boolean {
    return window.screen.width < 1100;
  }

} 
