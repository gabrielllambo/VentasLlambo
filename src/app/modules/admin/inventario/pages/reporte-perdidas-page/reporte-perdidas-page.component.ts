import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { DictionaryInfo, Flags, ImagenesUrl, Numeracion } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSelect } from '@angular/material/select';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ApexOptions } from 'ng-apexcharts';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { ObtenerCategoriaRequest } from 'app/core/models/inventario/categoria/request/obtener-categoria-request.model';
import { ObtenerMarcaRequest } from 'app/core/models/inventario/marca/request/obtener-marca-request.model';
import { ObtenerHistorialInventarioFisicoRequest } from 'app/core/models/inventario/inventario-fisico/request/obtener-historial-inventario-fisico-request.model';
import { ReportePerdidasResumenDTO } from 'app/core/models/inventario/inventario-fisico/response/reporte-perdidas-resumen-dto.model';

@Component({
    selector: 'app-reporte-perdidas-page',
    templateUrl: './reporte-perdidas-page.component.html',
    styleUrl: './reporte-perdidas-page.component.scss',
})
export class ReportePerdidasPageComponent implements OnInit, OnDestroy {

    @ViewChild('matDrawer') matDrawer!: MatDrawer;
    @ViewChild('selectCategoriaItem') selectCategorias!: MatSelect;
    @ViewChild('selectMarcaItem') selectMarcas!: MatSelect;
    @ViewChild('selectProductoItem') selectProductos!: MatSelect;

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

    public allCategoriaDataSource: CategoriaDTO[] = [];
    public allMarcasDataSource: MarcaDTO[] = [];
    public allProductosDataSource: ProductoDTO[] = [];

    public reporteData!: ReportePerdidasResumenDTO;

    public chartTopPerdidas: ApexOptions = {};
    public chartEvolucionPerdidas: ApexOptions = {};
    public chartDistribucionCategoria: ApexOptions = {};

    public columnasMostradas: string[] = [
        'producto', 'lote', 'stockSistema', 'cantidadFisica',
        'diferencia', 'valorPerdida', 'usuario', 'fecha', 'estado'
    ];

    constructor(
        private _securityService: SecurityService,
        private _formBuilder: UntypedFormBuilder,
        private _toolService: ToolService,
        private _inventarioService: InventarioService,
    ) { }

    ngOnInit(): void {
        this.formFiltros();
        this.getFilterComboConsulta();
        this.showSkeleton();
        this.getReporte(Flags.False);
    }

    formFiltros() {
        this.filtroForm = this._formBuilder.group({
            fechaInicio: [this._toolService.getStartDateOfMonth(), [Validators.required]],
            fechaFin: [this._toolService.getEndDateOfMonth(), [Validators.required]],
            categoria: [''],
            marca: [''],
            producto: [''],
            soloPerdidas: [false],
        });
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    }

    getFilterComboConsulta() {
        const categoriaRequest = new ObtenerCategoriaRequest();
        categoriaRequest.nombre = '';
        categoriaRequest.idUsuario = this.decodeToken.idUsuario;

        const marcaRequest = new ObtenerMarcaRequest();
        marcaRequest.nombre = '';
        marcaRequest.idUsuario = this.decodeToken.idUsuario;

        forkJoin({
            dataCategorias: this._inventarioService.GetAllCategoriaByFilterAsync(categoriaRequest),
            dataMarcas: this._inventarioService.GetAllMarcaByFilterAsync(marcaRequest),
            dataProductos: this._inventarioService.GetAllProductoForComboBoxAsync(),
        }).subscribe({
            next: (response) => {
                this.allCategoriaDataSource = response.dataCategorias;
                this.allMarcasDataSource = response.dataMarcas;
                this.allProductosDataSource = response.dataProductos;
                this.filtroForm.get('categoria')?.setValue(this.allCategoriaDataSource);
                this.filtroForm.get('marca')?.setValue(this.allMarcasDataSource);
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            },
        });
    }

    getReporte(hideFilter: boolean) {
        this.showSkeleton();
        const request = this.construirRequest();
        this.disabledBuscar = Flags.True;

        this._inventarioService.GetHistorialInventarioFisicoAsync(request).subscribe({
            next: (response: ReportePerdidasResumenDTO) => {
                this.reporteData = response;
                this.disabledBuscar = Flags.False;
                this.getFechaFiltroCadena();
                this.generateCharts();
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

    generateCharts() {
        this.generarChartTopPerdidas();
        this.generarChartEvolucionPerdidas();
        this.generarChartDistribucionCategoria();
    }

    generarChartTopPerdidas() {
        const top = this.reporteData.topProductosPerdidas;
        this.chartTopPerdidas = {
            series: [{ name: 'Unidades Perdidas', data: top.cantidadesPerdidas }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: {
                bar: { barHeight: '100%', distributed: true, horizontal: true, dataLabels: { position: 'top' } },
            },
            colors: top.colores?.length ? top.colores : ['#EF4444'],
            dataLabels: {
                enabled: true,
                textAnchor: 'middle',
                formatter: (val: number) => `${val} uds`,
                offsetY: -6,
                style: { colors: ['#FFFFFF'], fontSize: '12px', fontWeight: 'bold' },
                dropShadow: { enabled: true, top: 1, left: 1, blur: 2, color: '#000', opacity: 0.5 },
            },
            stroke: { width: 1, colors: ['#fff'] },
            tooltip: { enabled: true, y: { formatter: (val: number) => `${val} unidades perdidas` } },
            xaxis: { categories: top.productos, labels: { show: false } },
            noData: {
                text: 'Sin pérdidas en el período',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#000000', fontSize: '14px' },
            },
        };
    }

    generarChartEvolucionPerdidas() {
        const evolucion = this.reporteData.evolucionPerdidasFecha;
        const fechas = evolucion.fechas.map(f => this._toolService.formatoFecha(f));
        const currencyFormat = this.currencyNumberFormat;

        this.chartEvolucionPerdidas = {
            series: [
                { name: 'Unidades Perdidas', data: evolucion.cantidadesPerdidas },
                { name: 'Valor Perdido', data: evolucion.valoresPerdidos },
            ],
            chart: { height: 350, type: 'line', zoom: { enabled: false }, toolbar: { show: false }, animations: { enabled: false } },
            colors: ['#EF4444', '#F97316'],
            stroke: { show: true, width: 2, curve: 'smooth' },
            dataLabels: { enabled: false },
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val: number, opts: any) =>
                        opts.seriesIndex === 1 ? currencyFormat.format(val) : `${val} unidades`,
                },
            },
            xaxis: { categories: fechas, labels: { rotateAlways: true, rotate: -45 } },
            yaxis: [
                {
                    seriesName: 'Unidades Perdidas',
                    title: { text: 'Unidades' },
                    labels: { formatter: (val: number) => `${val}` },
                },
                {
                    seriesName: 'Valor Perdido',
                    opposite: true,
                    title: { text: 'Valor' },
                    labels: { formatter: (val: number) => currencyFormat.format(val) },
                },
            ],
            noData: {
                text: 'Sin pérdidas en el período',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#000000', fontSize: '14px' },
            },
        };
    }

    generarChartDistribucionCategoria() {
        const distribucion = this.reporteData.distribucionPerdidasCategoria;
        const currencyFormat = this.currencyNumberFormat;
        const totalPerdido = distribucion.valoresPerdidosCategorias.reduce((a, b) => a + b, 0);

        this.chartDistribucionCategoria = {
            chart: { type: 'donut', fontFamily: 'inherit', foreColor: 'inherit', height: '95%' },
            labels: distribucion.nombreCategorias,
            series: distribucion.valoresPerdidosCategorias,
            colors: distribucion.coloresCategorias?.length ? distribucion.coloresCategorias : undefined,
            tooltip: { enabled: true, y: { formatter: (val: number) => currencyFormat.format(val) } },
            dataLabels: { enabled: true },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            name: { show: false },
                            value: {
                                show: true, fontSize: '22px', color: '#494949', offsetY: 0,
                                formatter: () => currencyFormat.format(totalPerdido),
                            },
                            total: {
                                show: true, showAlways: true, label: '', fontSize: '22px', color: '#494949',
                                formatter: () => currencyFormat.format(totalPerdido),
                            },
                        },
                    },
                },
            },
            responsive: [{
                breakpoint: 600,
                options: { chart: { width: '100%', height: 350 }, legend: { position: 'bottom' } },
            }],
            noData: {
                text: 'Sin pérdidas en el período',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#000000', fontSize: '14px' },
            },
        };
    }

    construirRequest(): ObtenerHistorialInventarioFisicoRequest {
        const request = new ObtenerHistorialInventarioFisicoRequest();
        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaInicio = this.filtroForm.get('fechaInicio')?.value ?? null;
        request.fechaFin = this.filtroForm.get('fechaFin')?.value ?? null;
        request.soloPerdidas = this.filtroForm.get('soloPerdidas')?.value ?? false;
        request.lstCategorias = [];
        request.lstMarcas = [];
        request.lstProductos = [];

        if (this.selectCategorias) {
            this.selectCategorias.options
                .filter(o => o.selected && o.value !== Numeracion.Cero)
                .forEach(o => request.lstCategorias.push(o.value.id));
        }
        if (this.selectMarcas) {
            this.selectMarcas.options
                .filter(o => o.selected && o.value !== Numeracion.Cero)
                .forEach(o => request.lstMarcas.push(o.value.id));
        }
        if (this.selectProductos) {
            this.selectProductos.options
                .filter(o => o.selected && o.value !== Numeracion.Cero)
                .forEach(o => request.lstProductos.push(o.value.id));
        }

        this.fechaInicio = request.fechaInicio;
        this.fechaFin = request.fechaFin;
        return request;
    }

    getFechaFiltroCadena() {
        this.filtroRangoFecha = `Desde ${this._toolService.formatoFecha(this.fechaInicio)} Hasta ${this._toolService.formatoFecha(this.fechaFin)}`.trim();
    }

    tieneHistorial(): boolean {
        return this.reporteData?.lstHistorial?.length > Numeracion.Cero;
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
