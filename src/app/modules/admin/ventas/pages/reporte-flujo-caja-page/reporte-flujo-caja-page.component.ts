import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { Flags } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { DetalleVentaService } from 'app/core/services/detalleventa/detalleventa.service';
import { DetalleCompraService } from 'app/core/services/detallecompra/detallecompra.service';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ObtenerResumenReporteRequest } from 'app/core/models/venta/request/obtener-totalizado-fecha-request.model';
import { ObtenerResumenReporteCompraRequest } from 'app/core/models/compra/request/obtener-totalizado-fecha-request.model';
import { ApexOptions } from 'ng-apexcharts';

@Component({
    selector: 'app-reporte-flujo-caja-page',
    templateUrl: './reporte-flujo-caja-page.component.html',
    styleUrl: './reporte-flujo-caja-page.component.scss',
})
export class ReporteFlujosCajaPageComponent implements OnInit, OnDestroy {

    public _unsubscribeAll: Subject<any> = new Subject<any>();
    public filtroForm!: UntypedFormGroup;

    private decodeToken: DecodedToken = this._securityService.getDecodetoken();
    public monedaInfo: MonedaDTO = this._securityService.getMonedaStorage();
    public currencyNumberFormat!: Intl.NumberFormat;

    public skeleton: boolean = Flags.False;
    public disabledBuscar: boolean = Flags.False;
    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();
    public filtroRangoFecha: string = '';

    public totalIngresos: number = 0;
    public totalEgresos: number = 0;
    public saldoNeto: number = 0;
    public margenPct: number = 0;

    public chartFlujoCaja: ApexOptions = {};

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _formBuilder: UntypedFormBuilder,
        private _detalleVentaService: DetalleVentaService,
        private _detalleCompraService: DetalleCompraService,
    ) { }

    ngOnInit(): void {
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
        this.initForm();
        this.buscar();
    }

    initForm(): void {
        this.filtroForm = this._formBuilder.group({
            fechaInicio: [this._toolService.getStartDateOfMonth(), Validators.required],
            fechaFin: [this._toolService.getEndDateOfMonth(), Validators.required],
        });
    }

    buscar(): void {
        if (this.filtroForm.invalid) return;
        this.skeleton = Flags.True;
        this.disabledBuscar = Flags.True;

        const fi: Date = this.filtroForm.get('fechaInicio')?.value;
        const ff: Date = this.filtroForm.get('fechaFin')?.value;
        this.filtroRangoFecha = `Desde ${this._toolService.formatoFecha(fi)} Hasta ${this._toolService.formatoFecha(ff)}`;

        const ventaReq = new ObtenerResumenReporteRequest();
        ventaReq.destinationTimeZoneId = this._toolService.getTimeZone();
        ventaReq.idUsuario = this.decodeToken.idUsuario;
        ventaReq.fechaInicio = fi;
        ventaReq.fechaFin = ff;
        ventaReq.lstCategorias = [];
        ventaReq.lstMarcas = [];

        const compraReq = new ObtenerResumenReporteCompraRequest();
        compraReq.destinationTimeZoneId = this._toolService.getTimeZone();
        compraReq.idUsuario = this.decodeToken.idUsuario;
        compraReq.fechaInicio = fi;
        compraReq.fechaFin = ff;

        forkJoin({
            ventas: this._detalleVentaService.GetResumenReporteAsync(ventaReq),
            compras: this._detalleCompraService.GetResumenReporteAsync(compraReq),
        }).subscribe({
            next: ({ ventas, compras }) => {
                const evV = ventas.evolucionVentasFecha;
                const evC = compras.evolucionComprasFecha;

                const totalV = evV.totalVenta.reduce((a, b) => a + b, 0);
                const totalC = evC.totalCompra.reduce((a, b) => a + b, 0);
                this.totalIngresos = totalV;
                this.totalEgresos = totalC;
                this.saldoNeto = totalV - totalC;
                this.margenPct = totalV > 0 ? ((totalV - totalC) / totalV) * 100 : 0;

                this.generarChart(evV, evC);
                this.skeleton = Flags.False;
                this.disabledBuscar = Flags.False;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.skeleton = Flags.False;
                this.disabledBuscar = Flags.False;
            },
        });
    }

    generarChart(evV: any, evC: any): void {
        const toKey = (d: any) => new Date(d).toISOString().slice(0, 10);
        const cf = this.currencyNumberFormat;

        const ventasMap = new Map<string, number>();
        evV.fechaVenta.forEach((f: any, i: number) => ventasMap.set(toKey(f), evV.totalVenta[i]));

        const comprasMap = new Map<string, number>();
        evC.fechaCompra.forEach((f: any, i: number) => comprasMap.set(toKey(f), evC.totalCompra[i]));

        const allDates = Array.from(new Set([...ventasMap.keys(), ...comprasMap.keys()])).sort();

        const serieVentas = allDates.map(d => ventasMap.get(d) ?? 0);
        const serieCompras = allDates.map(d => comprasMap.get(d) ?? 0);
        const serieSaldo = allDates.map((d, i) => serieVentas[i] - serieCompras[i]);

        this.chartFlujoCaja = {
            series: [
                { name: 'Ingresos (Ventas)', data: serieVentas },
                { name: 'Egresos (Compras)', data: serieCompras },
                { name: 'Saldo Neto', data: serieSaldo },
            ],
            chart: { type: 'line', height: 380, toolbar: { show: false }, animations: { enabled: false } },
            colors: ['#10B981', '#EF4444', '#3B82F6'],
            stroke: { show: true, width: 2, curve: 'smooth' },
            dataLabels: { enabled: false },
            xaxis: { categories: allDates, labels: { rotateAlways: true, rotate: -45 } },
            yaxis: { labels: { formatter: (v: number) => cf.format(v) } },
            tooltip: { y: { formatter: (v: number) => cf.format(v) } },
            legend: { position: 'top' },
            noData: { text: 'Sin datos en el período', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    formatCurrency(v: number): string { return this.currencyNumberFormat?.format(v) ?? v.toString(); }
    formatPct(v: number): string { return `${v.toFixed(1)}%`; }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
