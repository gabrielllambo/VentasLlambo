import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { DictionaryInfo, Flags, ImagenesUrl } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ApexOptions } from 'ng-apexcharts';
import { ObtenerHistorialInventarioFisicoRequest } from 'app/core/models/inventario/inventario-fisico/request/obtener-historial-inventario-fisico-request.model';
import { ReportePerdidasResumenDTO } from 'app/core/models/inventario/inventario-fisico/response/reporte-perdidas-resumen-dto.model';
import { HistorialInventarioFisicoDTO } from 'app/core/models/inventario/inventario-fisico/response/historial-inventario-fisico-dto.model';

interface RegistroGrupo {
    nombre: string;
    fecha: string;
    totalProductos: number;
    totalAjustados: number;
    productos: HistorialInventarioFisicoDTO[];
}

@Component({
    selector: 'app-reporte-tomas-fisicas-page',
    templateUrl: './reporte-tomas-fisicas-page.component.html',
    styleUrl: './reporte-tomas-fisicas-page.component.scss',
})
export class ReporteTomasFisicasPageComponent implements OnInit, OnDestroy {

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    public filtroForm!: UntypedFormGroup;

    private decodeToken: DecodedToken = this.obtenerInfouserInfoLogueado();
    public monedaInfo: MonedaDTO = this.obtenerInfoMoneda();
    public currencyNumberFormat!: Intl.NumberFormat;

    public skeleton: boolean = false;
    public disabledBuscar: boolean = false;

    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    public imgNoDataHome: string = ImagenesUrl.noDataHome;
    public textoResultado: string = DictionaryInfo.NoDataResult;
    public filtroRangoFecha: string = '';
    public fechaInicio!: Date;
    public fechaFin!: Date;

    public lstHistorial: HistorialInventarioFisicoDTO[] = [];
    public grupos: RegistroGrupo[] = [];
    public registroSeleccionado: RegistroGrupo | null = null;

    public totalRegistros: number = 0;
    public totalProductos: number = 0;
    public totalAjustados: number = 0;
    public totalValorPerdido: number = 0;

    public chartRegistros: ApexOptions = {};
    public chartProductosRegistro: ApexOptions = {};

    constructor(
        private _securityService: SecurityService,
        private _formBuilder: UntypedFormBuilder,
        private _toolService: ToolService,
        private _inventarioService: InventarioService,
        private _ngZone: NgZone,
    ) { }

    ngOnInit(): void {
        this.formFiltros();
        this.skeleton = true;
        this.getReporte();
    }

    formFiltros() {
        this.filtroForm = this._formBuilder.group({
            fechaInicio: [this._toolService.getStartDateOfMonth(), [Validators.required]],
            fechaFin: [this._toolService.getEndDateOfMonth(), [Validators.required]],
        });
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    }

    getReporte() {
        this.skeleton = true;
        this.disabledBuscar = true;
        this.registroSeleccionado = null;

        const request = new ObtenerHistorialInventarioFisicoRequest();
        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaInicio = this.filtroForm.get('fechaInicio')?.value;
        request.fechaFin = this.filtroForm.get('fechaFin')?.value;
        request.lstCategorias = [];
        request.lstMarcas = [];
        request.lstProductos = [];
        request.soloPerdidas = false;

        this.fechaInicio = request.fechaInicio;
        this.fechaFin = request.fechaFin;

        this._inventarioService.GetHistorialInventarioFisicoAsync(request).subscribe({
            next: (response: ReportePerdidasResumenDTO) => {
                this.lstHistorial = response.lstHistorial ?? [];
                this.procesarDatos();
                this.getFechaFiltroCadena();
                this.disabledBuscar = false;
                this.skeleton = false;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledBuscar = false;
                this.skeleton = false;
            },
        });
    }

    procesarDatos() {
        const mapaGrupos = new Map<string, HistorialInventarioFisicoDTO[]>();

        this.lstHistorial.forEach(item => {
            const key = item.nombreRegistro?.trim() || item.motivo?.trim() || 'Sin nombre';
            if (!mapaGrupos.has(key)) mapaGrupos.set(key, []);
            mapaGrupos.get(key)!.push(item);
        });

        this.grupos = Array.from(mapaGrupos.entries()).map(([nombre, items]) => {
            const ajustados = items.filter(i => i.ajustado).length;
            const fechaItem = items[0]?.fechaRegistro;
            const fecha = fechaItem ? this._toolService.formatoFecha(fechaItem) : '';
            return { nombre, fecha, totalProductos: items.length, totalAjustados: ajustados, productos: items };
        }).sort((a, b) => a.fecha.localeCompare(b.fecha));

        this.totalRegistros = this.grupos.length;
        this.totalProductos = this.lstHistorial.length;
        this.totalAjustados = this.lstHistorial.filter(i => i.ajustado).length;
        this.totalValorPerdido = this.lstHistorial.reduce((acc, i) => acc + (i.valorPerdida ?? 0), 0);

        this.generarChartRegistros();

        if (this.grupos.length > 0) {
            this.seleccionarRegistro(this.grupos[0]);
        }
    }

    generarChartRegistros() {
        const self = this;
        const etiquetas = this.grupos.map(g => `${g.nombre} (${g.fecha})`);
        const datos = this.grupos.map(g => g.totalProductos);
        const colores = this.grupos.map(g => {
            if (g.totalAjustados === g.totalProductos && g.totalProductos > 0) return '#10B981';
            if (g.totalAjustados === 0) return '#6B7280';
            return '#F59E0B';
        });

        this.chartRegistros = {
            series: [{ name: 'Productos contados', data: datos }],
            chart: {
                type: 'bar',
                height: Math.max(280, this.grupos.length * 44),
                toolbar: { show: false },
                events: {
                    dataPointSelection: (_event: any, _ctx: any, config: any) => {
                        self._ngZone.run(() => {
                            const idx = config.dataPointIndex;
                            if (idx >= 0 && idx < self.grupos.length) {
                                self.seleccionarRegistro(self.grupos[idx]);
                            }
                        });
                    },
                },
            },
            plotOptions: { bar: { barHeight: '70%', distributed: true, horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
            colors: colores,
            dataLabels: {
                enabled: true, textAnchor: 'start',
                formatter: (v: number) => `${v} prod.`,
                offsetX: 8, style: { colors: ['#333'], fontSize: '11px', fontWeight: '600' },
            },
            stroke: { width: 1, colors: ['#fff'] },
            xaxis: { categories: etiquetas, labels: { show: false } },
            tooltip: {
                y: {
                    formatter: (v: number, opts: any) => {
                        const g = self.grupos[opts.dataPointIndex];
                        return `${v} productos — ${g?.totalAjustados ?? 0} ajustados`;
                    }
                }
            },
            legend: { show: false },
            states: { active: { filter: { type: 'darken', value: 0.75 } } },
            noData: { text: 'Sin registros en el período', align: 'center', verticalAlign: 'middle', style: { fontSize: '14px' } },
        };
    }

    seleccionarRegistro(grupo: RegistroGrupo) {
        this.registroSeleccionado = grupo;
        this.generarChartProductosRegistro(grupo.productos);
    }

    generarChartProductosRegistro(productos: HistorialInventarioFisicoDTO[]) {
        const self = this;
        const nombres = productos.map(p => p.nombreProducto);
        const diferencias = productos.map(p => p.diferencia ?? 0);
        const colores = diferencias.map(d => d < 0 ? '#EF4444' : d > 0 ? '#10B981' : '#6B7280');

        this.chartProductosRegistro = {
            series: [{ name: 'Diferencia', data: diferencias }],
            chart: { type: 'bar', height: Math.max(280, productos.length * 40), toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '65%', distributed: true, horizontal: true, borderRadius: 4 } },
            colors: colores,
            dataLabels: {
                enabled: true, textAnchor: 'start',
                formatter: (v: number) => v > 0 ? `+${v}` : `${v}`,
                offsetX: 8, style: { colors: ['#333'], fontSize: '11px', fontWeight: '600' },
            },
            stroke: { width: 1, colors: ['#fff'] },
            xaxis: { categories: nombres, labels: { show: false } },
            tooltip: {
                y: {
                    formatter: (v: number, opts: any) => {
                        const p = productos[opts.dataPointIndex];
                        const estado = p?.ajustado ? '✓ Ajustado' : '⏳ Pendiente';
                        return `Diferencia: ${v > 0 ? '+' : ''}${v} | ${estado}`;
                    }
                }
            },
            legend: { show: false },
            noData: { text: 'Sin productos en este registro', align: 'center', verticalAlign: 'middle', style: { fontSize: '14px' } },
        };
    }

    tieneRegistros(): boolean { return this.grupos.length > 0; }

    getFechaFiltroCadena() {
        this.filtroRangoFecha = `Desde ${this._toolService.formatoFecha(this.fechaInicio)} Hasta ${this._toolService.formatoFecha(this.fechaFin)}`.trim();
    }

    obtenerInfouserInfoLogueado(): DecodedToken { return this._securityService.getDecodetoken(); }
    obtenerInfoMoneda(): MonedaDTO { return this._securityService.getMonedaStorage(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
