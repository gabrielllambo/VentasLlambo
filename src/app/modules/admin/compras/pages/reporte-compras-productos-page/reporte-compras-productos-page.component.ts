import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { DictionaryInfo, Flags, ImagenesUrl, Numeracion, StatusCode } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MatSelect } from '@angular/material/select';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ApexOptions } from 'ng-apexcharts';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { DetalleCompraService } from 'app/core/services/detallecompra/detallecompra.service';
import { CompraAnalisisProductosDTO } from 'app/core/models/compra/response/reporte/producto/compra-analisis-productos-dto.model';
import { ObtenerReporteProductoCompraRequest } from 'app/core/models/compra/request/obtener-reporte-producto-request.model';

@Component({
    selector: 'app-reporte-compras-productos-page',
    templateUrl: './reporte-compras-productos-page.component.html',
    styleUrl: './reporte-compras-productos-page.component.scss',
})
export class ReporteComprasProductosPageComponent implements OnInit, OnDestroy {

    @ViewChild('selectProductoItem') selectProductos!: MatSelect;
    @ViewChild('matDrawer') matDrawer!: MatDrawer;

    public disabledExportar: boolean = Flags.False;
    private decodeToken: DecodedToken = this.obtenerInfouserInfoLogueado();
    public monedaInfo: MonedaDTO = this.obtenerInfoMoneda();
    public isExportingReport: boolean = Flags.False;
    public currencyNumberFormat!: Intl.NumberFormat;

    public chartEvolucionComprasProductoFecha: ApexOptions = {};
    public chartTotalizadoProductos: ApexOptions = {};
    public chartTopDiezProductos: ApexOptions = {};

    public disabledBuscar: boolean = Flags.False;
    public _unsubscribeAll: Subject<any> = new Subject<any>();
    public filtroAnalisisComprasForm!: UntypedFormGroup;

    public comprasAnalisisDataSource!: CompraAnalisisProductosDTO;
    public allProductosDataSource!: ProductoDTO[];

    public skeleton: boolean = Flags.False;
    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    public imgNoDataHome: string = ImagenesUrl.noDataHome;
    public textoResultado: string = DictionaryInfo.NoDataResult;

    public rangoFecha!: string[];
    public filtroRangoFecha: string = '';
    public fechaInicio!: Date;
    public fechaFin!: Date;

    constructor(
        private _securityService: SecurityService,
        private _formBuilder: UntypedFormBuilder,
        private _toolService: ToolService,
        private _detalleComprasService: DetalleCompraService,
        private _inventarioService: InventarioService,
    ) { }

    ngOnInit(): void {
        this.formFiltros();
        this.showSkeleton();
        this.getResumen(Flags.False);
        this.getFilterComboConsulta();
    }

    formFiltros() {
        this.filtroAnalisisComprasForm = this._formBuilder.group({
            fechaCompraInicio: [this._toolService.getStartDateOfMonth(), [Validators.required]],
            fechaCompraFin: [this._toolService.getEndDateOfMonth(), [Validators.required]],
            productos: [''],
        });
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    }

    getFilterComboConsulta() {
        forkJoin({ dataProductos: this._inventarioService.GetAllProductoForComboBoxAsync() }).subscribe({
            next: (response) => {
                this.allProductosDataSource = response.dataProductos;
                this.filtroAnalisisComprasForm.get('productos')?.setValue(this.allProductosDataSource);
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledExportar = Flags.True;
            },
        });
    }

    getResumen(hideFilter: boolean) {
        this.showSkeleton();
        const request = this.obtenerRequest();
        this.disabledBuscar = Flags.True;
        this._detalleComprasService.GetAnalisisProductosByFilterAsync(request).subscribe({
            next: (response: CompraAnalisisProductosDTO) => {
                this.comprasAnalisisDataSource = response;
                this.disabledBuscar = Flags.False;
                this.getFechaFiltroCadena();
                this.generateCharts();
                if (hideFilter) { this.closedDrawer(); }
                this.hideSkeleton();
                this.disabledExportar = response.distribucionComprasProducto.totalComprasProductos.length > Numeracion.Cero ? Flags.False : Flags.True;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledBuscar = Flags.False;
                if (hideFilter) { this.closedDrawer(); }
            },
        });
    }

    generateCharts() {
        this.rangoFecha = this.getRangeDate();
        this.generarChartEvolucionProductoFecha();
        this.generarChartTotalizadoProductos();
        this.generarChartTopDiezProductos();
    }

    generarChartEvolucionProductoFecha() {
        const seriesData = this.comprasAnalisisDataSource.lstEvolucionComprasProductoFecha.map(prod => ({
            color: prod.colorProducto,
            name: prod.nombreProducto,
            data: this.rangoFecha.map(fecha => {
                const encontrado = prod.datosComprasAgrupados.find(g => this._toolService.formatoFecha(g.fechaCompra) === fecha);
                return encontrado ? encontrado.montoCompraTotal : Numeracion.Cero;
            }),
        }));

        this.chartEvolucionComprasProductoFecha = {
            series: seriesData,
            chart: { type: 'bar', height: 350, stacked: true, toolbar: { show: false } },
            noData: { text: 'Sin datos en el período', align: 'center', verticalAlign: 'middle', style: { color: '#000000', fontSize: '14px' } },
            plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: { categories: this.rangoFecha, labels: { rotateAlways: true, rotate: -45 } },
            yaxis: { labels: { formatter: (val: number) => this.currencyNumberFormat.format(val) } },
            fill: { opacity: 1 },
            tooltip: { enabled: true, y: { formatter: (val: number) => this.currencyNumberFormat.format(val) } },
        };
    }

    generarChartTotalizadoProductos() {
        const isMovilSize = this.isMobilSize();
        const total = this.comprasAnalisisDataSource.distribucionComprasProducto.totalComprasProductos.reduce((a, b) => a + b, 0);

        this.chartTotalizadoProductos = {
            chart: { type: 'donut', fontFamily: 'inherit', foreColor: 'inherit', height: '95%' },
            responsive: [{ breakpoint: 600, options: { chart: { width: '100%', height: 350 }, legend: { position: 'bottom' } } }],
            labels: this.comprasAnalisisDataSource.distribucionComprasProducto.nombreProductos,
            series: this.comprasAnalisisDataSource.distribucionComprasProducto.totalComprasProductos,
            noData: { text: 'Sin datos en el período', align: 'center', verticalAlign: 'middle', style: { color: '#000000', fontSize: '14px' } },
            colors: this.comprasAnalisisDataSource.distribucionComprasProducto.coloresProductos,
            tooltip: { enabled: true, y: { formatter: (val: number) => this.currencyNumberFormat.format(val) } },
            dataLabels: { enabled: true },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            name: { show: false },
                            value: { show: true, fontSize: isMovilSize ? '19px' : '22px', color: '#494949', offsetY: 0, formatter: () => this.currencyNumberFormat.format(total) },
                            total: { show: true, showAlways: true, label: '', fontSize: isMovilSize ? '19px' : '22px', color: '#494949', formatter: () => this.currencyNumberFormat.format(total) },
                        },
                    },
                },
            },
        };
    }

    generarChartTopDiezProductos() {
        const currencyFormat = this.currencyNumberFormat;
        this.chartTopDiezProductos = {
            series: [{ name: 'Total', data: this.comprasAnalisisDataSource.topDiezProductosCompras.totalMontos }],
            noData: { text: 'Sin datos en el período', align: 'center', verticalAlign: 'middle', style: { color: '#000000', fontSize: '14px' } },
            colors: this.comprasAnalisisDataSource.topDiezProductosCompras.colores,
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true, dataLabels: { position: 'top' } } },
            dataLabels: {
                enabled: true, textAnchor: 'middle', formatter: (val: number) => currencyFormat.format(val), offsetY: -6,
                style: { colors: ['#FFFFFF'], fontSize: '12px', fontWeight: 'bold' },
                dropShadow: { enabled: true, top: 1, left: 1, blur: 2, color: '#000000', opacity: 0.5 },
            },
            stroke: { width: 1, colors: ['#fff'] },
            tooltip: { enabled: true, y: { formatter: (val: number) => currencyFormat.format(val) } },
            xaxis: { categories: this.comprasAnalisisDataSource.topDiezProductosCompras.productos, labels: { show: false } },
        };
    }

    getReportePorProductoAsync() {
        if (!this.comprasAnalisisDataSource?.distribucionComprasProducto?.totalComprasProductos?.length) return;
        if (this.filtroAnalisisComprasForm.invalid) return;
        const request = this.obtenerRequestReporte();
        this.isExportingReport = Flags.True;
        this._detalleComprasService.GetReportePorProductosAsync(request).subscribe({
            next: (response: any) => {
                this.isExportingReport = Flags.False;
                if (response) {
                    const url = window.URL.createObjectURL(new Blob([response], { type: 'application/vnd.ms-excel' }));
                    const a = document.createElement('a');
                    a.download = `Reporte_Compra_Por_Productos_${this.getFechaFiltroCadenaReporte()}.xlsx`;
                    a.href = url; a.click(); a.parentNode?.removeChild(a);
                }
            },
            error: (err: any) => {
                if (err.status == StatusCode.Forbidden) { this._toolService.showWarning(DictionaryWarning.InvalidPermisos, DictionaryWarning.Tittle); }
                else { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); }
                this.isExportingReport = Flags.False;
            },
        });
    }

    obtenerRequest(): ObtenerReporteProductoCompraRequest {
        const request = new ObtenerReporteProductoCompraRequest();
        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaCompraInicio = this.filtroAnalisisComprasForm.get('fechaCompraInicio')?.value ?? null;
        request.fechaCompraFin = this.filtroAnalisisComprasForm.get('fechaCompraFin')?.value ?? null;
        request.lstProductos = [];
        if (this.selectProductos) {
            this.selectProductos.options.filter(x => x.selected && x.value != 0).forEach(x => request.lstProductos.push(x.value.id));
        }
        this.fechaInicio = request.fechaCompraInicio;
        this.fechaFin = request.fechaCompraFin;
        return request;
    }

    obtenerRequestReporte(): ObtenerReporteProductoCompraRequest {
        const request = new ObtenerReporteProductoCompraRequest();
        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaCompraInicio = this.filtroAnalisisComprasForm.get('fechaCompraInicio')?.value ?? null;
        request.fechaCompraFin = this.filtroAnalisisComprasForm.get('fechaCompraFin')?.value ?? null;
        request.lstProductos = [];
        this.fechaInicio = request.fechaCompraInicio;
        this.fechaFin = request.fechaCompraFin;
        if (this.selectProductos) {
            this.selectProductos.options.filter(x => x.selected && x.value != 0).forEach(x => request.lstProductos.push(x.value.id));
        }
        return request;
    }

    getFechaFiltroCadena() {
        this.filtroRangoFecha = `Desde ${this._toolService.formatoFecha(this.fechaInicio)} Hasta ${this._toolService.formatoFecha(this.fechaFin)}`.trim();
    }

    getFechaFiltroCadenaReporte(): string {
        return `del_${this._toolService.formatoFecha(this.fechaInicio)}_hasta_${this._toolService.formatoFecha(this.fechaFin)}`.trim();
    }

    getRangeDate(): string[] {
        return this.comprasAnalisisDataSource.evolucionComprasFecha.fechaCompra.map(f => this._toolService.formatoFecha(f));
    }

    isMobilSize(): boolean { return this._toolService.isMobilSize(); }
    closedDrawer() { this.matDrawer.close(); }
    showSkeleton() { this.skeleton = Flags.Show; }
    hideSkeleton() { this.skeleton = Flags.Hide; }
    obtenerInfouserInfoLogueado(): DecodedToken { return this._securityService.getDecodetoken(); }
    obtenerInfoMoneda(): MonedaDTO { return this._securityService.getMonedaStorage(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
