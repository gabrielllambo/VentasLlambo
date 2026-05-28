import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { Flags } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { VentaService } from 'app/core/services/venta/venta.service';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ObtenerVentaRequest } from 'app/core/models/venta/request/obtener-venta-request.model';
import { VentaDTO } from 'app/core/models/venta/response/venta-dto.model';
import { ApexOptions } from 'ng-apexcharts';

@Component({
    selector: 'app-reporte-tendencia-page',
    templateUrl: './reporte-tendencia-page.component.html',
    styleUrl: './reporte-tendencia-page.component.scss',
})
export class ReporteTendenciaPageComponent implements OnInit, OnDestroy {

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

    public totalVentas: number = 0;
    public horaPico: string = '—';
    public diaPico: string = '—';
    public ticketPromedio: number = 0;

    public chartPorHora: ApexOptions = {};
    public chartPorDia: ApexOptions = {};

    private DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _formBuilder: UntypedFormBuilder,
        private _ventaService: VentaService,
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

        const req = new ObtenerVentaRequest();
        req.destinationTimeZoneId = this._toolService.getTimeZone();
        req.idUsuario = this.decodeToken.idUsuario;
        req.lstUsuario = [];
        req.fechaVentaInicio = fi;
        req.fechaVentaFin = ff;
        req.montoVentaInicio = 0;
        req.montoVentaFin = 9999999;

        this._ventaService.GetAllByFilterAsync(req).subscribe({
            next: (ventas: VentaDTO[]) => {
                const activas = ventas.filter(v => v.estado);
                this.totalVentas = activas.length;
                this.ticketPromedio = activas.length > 0
                    ? activas.reduce((s, v) => s + v.totalVenta, 0) / activas.length
                    : 0;
                this.generarCharts(activas);
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

    generarCharts(ventas: VentaDTO[]): void {
        const cf = this.currencyNumberFormat;

        const porHora = new Array(24).fill(0);
        const totalPorHora = new Array(24).fill(0);
        const porDia = new Array(7).fill(0);
        const totalPorDia = new Array(7).fill(0);

        for (const v of ventas) {
            const d = new Date(v.fechaVenta);
            const h = d.getHours();
            const wd = d.getDay();
            porHora[h]++;
            totalPorHora[h] += v.totalVenta;
            porDia[wd]++;
            totalPorDia[wd] += v.totalVenta;
        }

        const maxHora = porHora.indexOf(Math.max(...porHora));
        this.horaPico = `${maxHora}:00 – ${maxHora + 1}:00`;
        const maxDia = porDia.indexOf(Math.max(...porDia));
        this.diaPico = this.DIAS[maxDia];

        this.chartPorHora = {
            series: [
                { name: 'Ventas', data: porHora },
                { name: 'Ingresos', data: totalPorHora },
            ],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            colors: ['#3B82F6', '#10B981'],
            plotOptions: { bar: { columnWidth: '70%' } },
            dataLabels: { enabled: false },
            xaxis: { categories: Array.from({ length: 24 }, (_, i) => `${i}h`), labels: { rotate: -45 } },
            yaxis: [
                { seriesName: 'Ventas', title: { text: '# Ventas' }, labels: { formatter: (v: number) => `${v}` } },
                { seriesName: 'Ingresos', opposite: true, title: { text: 'Ingresos' }, labels: { formatter: (v: number) => cf.format(v) } },
            ],
            tooltip: {
                y: {
                    formatter: (v: number, opts: any) =>
                        opts.seriesIndex === 1 ? cf.format(v) : `${v} ventas`,
                },
            },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };

        this.chartPorDia = {
            series: [
                { name: 'Ventas', data: porDia },
                { name: 'Ingresos', data: totalPorDia },
            ],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            colors: ['#8B5CF6', '#F59E0B'],
            plotOptions: { bar: { columnWidth: '60%' } },
            dataLabels: { enabled: false },
            xaxis: { categories: this.DIAS },
            yaxis: [
                { seriesName: 'Ventas', title: { text: '# Ventas' }, labels: { formatter: (v: number) => `${v}` } },
                { seriesName: 'Ingresos', opposite: true, title: { text: 'Ingresos' }, labels: { formatter: (v: number) => cf.format(v) } },
            ],
            tooltip: {
                y: {
                    formatter: (v: number, opts: any) =>
                        opts.seriesIndex === 1 ? cf.format(v) : `${v} ventas`,
                },
            },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    formatCurrency(v: number): string { return this.currencyNumberFormat?.format(v) ?? v.toString(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
