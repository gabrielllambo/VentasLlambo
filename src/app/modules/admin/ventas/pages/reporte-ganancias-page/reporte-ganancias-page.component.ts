import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { DictionaryInfo, Flags, ImagenesUrl, Numeracion } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ApexOptions } from 'ng-apexcharts';
import { DetalleVentaService } from 'app/core/services/detalleventa/detalleventa.service';
import { ReporteResumenDTO } from 'app/core/models/venta/response/reporte/reporte-resumen-dto.model';
import { ObtenerResumenReporteRequest } from 'app/core/models/venta/request/obtener-totalizado-fecha-request.model';

interface FilaGanancia {
    nombre: string;
    color: string;
    totalVendido: number;
    totalCosto: number;
    ganancia: number;
}

// Definimos una paleta de colores vibrante y profesional
const PALETA_COLORES = [
    '#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', 
    '#8B5CF6', '#14B8A6', '#F43F5E', '#0EA5E9', '#F97316'
];

@Component({
    selector: 'app-reporte-ganancias-page',
    templateUrl: './reporte-ganancias-page.component.html',
    styleUrl: './reporte-ganancias-page.component.scss',
})
export class ReporteGananciasPageComponent implements OnInit, OnDestroy {

    @ViewChild('matDrawer') matDrawer!: MatDrawer;

    public _unsubscribeAll: Subject<any> = new Subject<any>();
    public filtroForm!: UntypedFormGroup;

    private decodeToken: DecodedToken = this.obtenerInfouserInfoLogueado();
    public monedaInfo: MonedaDTO = this.obtenerInfoMoneda();
    public currencyNumberFormat!: Intl.NumberFormat;

    public skeleton: boolean = Flags.False;
    public disabledBuscar: boolean = Flags.False;

    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    public imgNoDataHome: string = ImagenesUrl.noDataHome;
    public textoResultado: string = DictionaryInfo.NoDataResult;

    public filtroRangoFecha: string = '';
    public fechaInicio!: Date;
    public fechaFin!: Date;

    public ventasResumen!: ReporteResumenDTO;

    public totalIngresos: number = Numeracion.Cero;
    public totalCostos: number = Numeracion.Cero;
    public gananciaBruta: number = Numeracion.Cero;
    public margenPorcentaje: number = Numeracion.Cero;

    public chartIngresosVsCostosFecha: ApexOptions = {};
    public chartTopProductosVendidos: ApexOptions = {};
    public chartTopCostosProductos: ApexOptions = {};
    public chartGananciaProductos: ApexOptions = {};
    public tablaGanancias: FilaGanancia[] = [];

    constructor(
        private _securityService: SecurityService,
        private _formBuilder: UntypedFormBuilder,
        private _toolService: ToolService,
        private _detalleVentaService: DetalleVentaService,
    ) { }

    ngOnInit(): void {
        this.formFiltros();
        this.showSkeleton();
        this.getReporte(Flags.False);
    }

    formFiltros() {
        this.filtroForm = this._formBuilder.group({
            fechaInicio: [this._toolService.getStartDateOfMonth(), [Validators.required]],
            fechaFin: [this._toolService.getEndDateOfMonth(), [Validators.required]],
        });
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    }

    getReporte(hideFilter: boolean) {
        this.showSkeleton();
        this.disabledBuscar = Flags.True;

        this._detalleVentaService.GetResumenReporteAsync(this.construirRequestVenta()).subscribe({
            next: (ventas) => {
                this.ventasResumen = ventas;
                this.calcularTotales();
                this.getFechaFiltroCadena();
                this.generateCharts();
                this.disabledBuscar = Flags.False;
                this.hideSkeleton();
                if (hideFilter) { this.closedDrawer(); }
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledBuscar = Flags.False;
                this.hideSkeleton();
                if (hideFilter) { this.closedDrawer(); }
            },
        });
    }

    calcularTotales() {
        this.totalIngresos = (this.ventasResumen.evolucionVentasFecha?.totalVenta ?? [])
            .reduce((acc, val) => acc + val, Numeracion.Cero);
        this.totalCostos = this.ventasResumen.totalCostoVentas ?? Numeracion.Cero;
        this.gananciaBruta = this.totalIngresos - this.totalCostos;
        this.margenPorcentaje = this.totalIngresos > Numeracion.Cero
            ? (this.gananciaBruta / this.totalIngresos) * 100
            : Numeracion.Cero;
    }

    generateCharts() {
        this.generarChartIngresosVsCostos();
        this.generarChartTopProductosVendidos();
        this.generarChartTopCostosProductos();
        this.generarChartGananciaProductos();
        this.construirTablaGanancias();
    }

    generarChartIngresosVsCostos() {
        const fechasVenta = (this.ventasResumen.evolucionVentasFecha?.fechaVenta ?? [])
            .map(f => this._toolService.formatoFecha(f));
        const currencyFormat = this.currencyNumberFormat;

        this.chartIngresosVsCostosFecha = {
            series: [
                {
                    name: 'Ingresos (Ventas)',
                    data: this.ventasResumen.evolucionVentasFecha?.totalVenta ?? [],
                    color: '#10B981', // Verde Esmeralda
                },
                {
                    name: 'Costo de Venta',
                    data: this.ventasResumen.totalCostosVentasPorFecha ?? [],
                    color: '#F43F5E', // Rosa/Rojo
                },
            ],
            chart: {
                height: 350,
                type: 'line',
                zoom: { enabled: false },
                toolbar: { show: false },
                animations: { enabled: true, easing: 'easeinout', speed: 800 },
            },
            stroke: { show: true, width: 3, curve: 'smooth' },
            dataLabels: { enabled: false },
            tooltip: {
                enabled: true,
                y: { formatter: (val: number) => currencyFormat.format(val) },
            },
            xaxis: {
                categories: fechasVenta,
                labels: { rotateAlways: true, rotate: -45 },
            },
            yaxis: {
                labels: {
                    formatter: (val: number) => currencyFormat.format(val),
                    style: { fontSize: '12px' },
                },
            },
            fill: { opacity: 1 },
            legend: { position: 'top' },
            noData: {
                text: 'Sin datos en el período',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#000000', fontSize: '14px' },
            },
        };
    }

    generarChartTopProductosVendidos() {
        const top = this.ventasResumen.topDiezProductosVentas;
        const currencyFormat = this.currencyNumberFormat;

        this.chartTopProductosVendidos = {
            series: [{ name: 'Total Vendido', data: top?.totalMontos ?? [] }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: {
                bar: { 
                    barHeight: '85%', 
                    distributed: true, // Esto hace que cada barra use un color distinto
                    horizontal: true, 
                    dataLabels: { position: 'top' } 
                },
            },
            colors: PALETA_COLORES, // Aplicamos la paleta personalizada
            dataLabels: {
                enabled: true,
                textAnchor: 'start',
                formatter: (val: number) => currencyFormat.format(val),
                offsetX: 10,
                style: { colors: ['#333'], fontSize: '11px', fontWeight: '600' },
            },
            stroke: { width: 1, colors: ['#fff'] },
            tooltip: { enabled: true, y: { formatter: (val: number) => currencyFormat.format(val) } },
            xaxis: { categories: top?.productos ?? [], labels: { show: false } },
            legend: { show: false }, // Ocultamos leyenda porque los nombres ya están en el eje Y
            noData: {
                text: 'Sin ventas en el período',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#000000', fontSize: '14px' },
            },
        };
    }

    generarChartTopCostosProductos() {
        const top = this.ventasResumen.topDiezProductosVentas;
        const currencyFormat = this.currencyNumberFormat;

        this.chartTopCostosProductos = {
            series: [{ name: 'Costo de Venta', data: top?.totalCostosProductos ?? [] }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: {
                bar: { 
                    barHeight: '85%', 
                    distributed: true, 
                    horizontal: true, 
                    dataLabels: { position: 'top' } 
                },
            },
            colors: [...PALETA_COLORES].reverse(), // Invertimos la paleta para diferenciar visualmente
            dataLabels: {
                enabled: true,
                textAnchor: 'start',
                formatter: (val: number) => currencyFormat.format(val),
                offsetX: 10,
                style: { colors: ['#333'], fontSize: '11px', fontWeight: '600' },
            },
            stroke: { width: 1, colors: ['#fff'] },
            tooltip: { enabled: true, y: { formatter: (val: number) => currencyFormat.format(val) } },
            xaxis: { categories: top?.productos ?? [], labels: { show: false } },
            legend: { show: false },
            noData: {
                text: 'Sin datos de costo en el período',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#000000', fontSize: '14px' },
            },
        };
    }

    generarChartGananciaProductos() {
        const top = this.ventasResumen.topDiezProductosVentas;
        const currencyFormat = this.currencyNumberFormat;

        const ganancias = (top?.productos ?? []).map((nombre, idx) => {
            const totalVendido = top.totalMontos?.[idx] ?? Numeracion.Cero;
            const totalCosto = top.totalCostosProductos?.[idx] ?? Numeracion.Cero;
            return { nombre, ganancia: totalVendido - totalCosto };
        });
        
        ganancias.sort((a, b) => b.ganancia - a.ganancia);

        this.chartGananciaProductos = {
            series: [{ name: 'Ganancia Bruta', data: ganancias.map(g => g.ganancia) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { 
                bar: { 
                    distributed: true, 
                    horizontal: false, 
                    columnWidth: '55%',
                    borderRadius: 4
                } 
            },
            // Verde si es ganancia, Rojo si es pérdida
            colors: ganancias.map(g => g.ganancia >= 0 ? '#10B981' : '#F43F5E'),
            dataLabels: {
                enabled: true,
                formatter: (val: number) => currencyFormat.format(val),
                style: { fontSize: '10px' },
                offsetY: -20
            },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            tooltip: { enabled: true, y: { formatter: (val: number) => currencyFormat.format(val) } },
            xaxis: { categories: ganancias.map(g => g.nombre), labels: { rotateAlways: true, rotate: -45, style: { fontSize: '10px' } } },
            yaxis: { labels: { formatter: (val: number) => currencyFormat.format(val) } },
            legend: { show: false },
            noData: {
                text: 'Sin datos para calcular ganancia',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#000000', fontSize: '14px' },
            },
        };
    }

    construirTablaGanancias() {
        const top = this.ventasResumen.topDiezProductosVentas;

        this.tablaGanancias = (top?.productos ?? []).map((nombre, idx) => {
            const totalVendido = top.totalMontos?.[idx] ?? Numeracion.Cero;
            const totalCosto = top.totalCostosProductos?.[idx] ?? Numeracion.Cero;
            return {
                nombre,
                // Asignamos el color de la paleta basado en el índice
                color: PALETA_COLORES[idx % PALETA_COLORES.length],
                totalVendido,
                totalCosto,
                ganancia: totalVendido - totalCosto,
            };
        });

        this.tablaGanancias.sort((a, b) => b.ganancia - a.ganancia);
    }

    tieneIngresos(): boolean {
        return (this.ventasResumen?.evolucionVentasFecha?.totalVenta?.length ?? 0) > Numeracion.Cero;
    }

    construirRequestVenta(): ObtenerResumenReporteRequest {
        const request = new ObtenerResumenReporteRequest();
        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaInicio = this.filtroForm.get('fechaInicio')?.value ?? null;
        request.fechaFin = this.filtroForm.get('fechaFin')?.value ?? null;
        this.fechaInicio = request.fechaInicio;
        this.fechaFin = request.fechaFin;
        return request;
    }

    getFechaFiltroCadena() {
        this.filtroRangoFecha = `Desde ${this._toolService.formatoFecha(this.fechaInicio)} Hasta ${this._toolService.formatoFecha(this.fechaFin)}`.trim();
    }

    closedDrawer() { this.matDrawer.close(); }
    showSkeleton() { this.skeleton = Flags.Show; }
    hideSkeleton() { this.skeleton = Flags.Hide; }
    isMobilSize(): boolean { return this._toolService.isMobilSize(); }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }

    obtenerInfoMoneda(): MonedaDTO {
        return this._securityService.getMonedaStorage();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}