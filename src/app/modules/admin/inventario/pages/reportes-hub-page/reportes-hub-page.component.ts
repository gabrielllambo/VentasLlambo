import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DevolucionDialogComponent } from './devolucion-dialog/devolucion-dialog.component';
import { Subject, forkJoin } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { DetalleVentaService } from 'app/core/services/detalleventa/detalleventa.service';
import { DetalleCompraService } from 'app/core/services/detallecompra/detallecompra.service';
import { VentaService } from 'app/core/services/venta/venta.service';
import { PromocionService, PromocionDTO } from 'app/core/services/promocion/promocion.service';
import { DevolucionService } from 'app/core/services/devolucion/devolucion.service';
import { ObtenerDevolucionesRequest } from 'app/core/models/inventario/devolucion/request/obtener-devoluciones-request.model';
import { DevolucionItemDTO } from 'app/core/models/inventario/devolucion/response/devolucion-item-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { LoteDTO } from 'app/core/models/inventario/lote/response/lote-dto-request.model';
import { ObtenerLoteRequest } from 'app/core/models/inventario/lote/request/obtener-lotes-request.model';
import { ObtenerResumenReporteRequest } from 'app/core/models/venta/request/obtener-totalizado-fecha-request.model';
import { ObtenerResumenReporteCompraRequest } from 'app/core/models/compra/request/obtener-totalizado-fecha-request.model';
import { ObtenerReporteProductoRequest } from 'app/core/models/venta/request/obtener-reporte-producto-request.model';
import { ObtenerProductoRequest } from 'app/core/models/inventario/producto/request/obtener-producto-request.model';
import { ObtenerVentaRequest } from 'app/core/models/venta/request/obtener-venta-request.model';
import { VentaDTO } from 'app/core/models/venta/response/venta-dto.model';
import { ApexOptions } from 'ng-apexcharts';

type EstadoVencimiento = 'vencido' | 'critico' | 'alerta' | 'vigente' | 'sin_fecha';

interface LoteConEstado extends Omit<LoteDTO, 'estado'> {
    diasParaVencer: number | null;
    estado: EstadoVencimiento;
}

interface ProductoConMargen extends ProductoDTO {
    margenPct: number;
    gananciaUnitaria: number;
}

interface ProductoRotacion {
    nombre: string;
    categoria: string;
    stockActual: number;
    totalVendido: number;
    rotacion: number;
    clasificacion: 'alta' | 'media' | 'baja' | 'muerto';
}

interface ProductoSinMovimiento extends ProductoDTO {
    valorInmovilizado: number;
}

interface PromocionConImpacto extends PromocionDTO {
    estado: string;
    ahorroEstimado: number;
    productosConPrecio: { nombre: string; precioOriginal: number; precioConDescuento: number; }[];
}

@Component({
    selector: 'app-reportes-hub-page',
    templateUrl: './reportes-hub-page.component.html',
    styleUrl: './reportes-hub-page.component.scss',
})
export class ReportesHubPageComponent implements OnInit, OnDestroy {

    private _unsubscribeAll = new Subject<any>();
    private decodeToken: DecodedToken;
    public monedaInfo: MonedaDTO;
    public currencyNumberFormat!: Intl.NumberFormat;

    readonly GRUPOS = ['Ventas', 'Inventario', 'Promociones', 'Devoluciones'];
    readonly REPORTES = [
        { id: 'flujo-caja',     label: 'Flujo de Caja',          grupo: 'Ventas',        icon: 'heroicons_outline:arrows-right-left',       needsDate: true  },
        { id: 'tendencia',      label: 'Tendencia de Ventas',     grupo: 'Ventas',        icon: 'heroicons_outline:clock',                   needsDate: true  },
        { id: 'stock',          label: 'Stock y Valorización',    grupo: 'Inventario',    icon: 'heroicons_outline:cube',                    needsDate: false },
        { id: 'vencimientos',   label: 'Vencimientos de Lotes',   grupo: 'Inventario',    icon: 'heroicons_outline:calendar',                needsDate: false },
        { id: 'margen',         label: 'Margen de Ganancia',      grupo: 'Inventario',    icon: 'heroicons_outline:presentation-chart-line', needsDate: false },
        { id: 'rotacion',       label: 'Rotación de Inventario',  grupo: 'Inventario',    icon: 'heroicons_outline:arrow-path',              needsDate: true  },
        { id: 'sin-movimiento', label: 'Sin Movimiento',          grupo: 'Inventario',    icon: 'heroicons_outline:archive-box-x-mark',      needsDate: true  },
        { id: 'descuentos',     label: 'Impacto de Descuentos',   grupo: 'Promociones',   icon: 'heroicons_outline:tag',                    needsDate: false },
        { id: 'devoluciones',   label: 'Historial Devoluciones',  grupo: 'Devoluciones',  icon: 'heroicons_outline:arrow-uturn-left',        needsDate: true  },
    ];

    reporteActivo = 'flujo-caja';
    private loaded = new Set<string>();

    filtroForm!: UntypedFormGroup;
    skeleton = false;
    disabledBuscar = false;
    minDate!: Date;
    maxDate!: Date;

    // ── Flujo de Caja ──────────────────────────────────────────────────────────
    fc_totalIngresos = 0;
    fc_totalEgresos = 0;
    fc_saldoNeto = 0;
    fc_margenPct = 0;
    fc_rangoFecha = '';
    fc_chart: ApexOptions = {};

    // ── Tendencia ──────────────────────────────────────────────────────────────
    td_totalVentas = 0;
    td_horaPico = '—';
    td_diaPico = '—';
    td_ticketPromedio = 0;
    td_rangoFecha = '';
    td_chartHora: ApexOptions = {};
    td_chartDia: ApexOptions = {};
    private readonly DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // ── Stock ──────────────────────────────────────────────────────────────────
    sk_allProductos: ProductoDTO[] = [];
    sk_filtrados: ProductoDTO[] = [];
    sk_texto = '';
    sk_soloSinStock = false;
    sk_categorias: string[] = [];
    sk_categoriaSel = '';
    sk_chartCat: ApexOptions = {};
    sk_chartTop: ApexOptions = {};
    sk_columnas = ['codigo', 'nombre', 'categoria', 'marca', 'stock', 'precioCompra', 'valorTotal'];

    get sk_totalProductos(): number { return this.sk_filtrados.length; }
    get sk_totalUnidades(): number { return this.sk_filtrados.reduce((s, p) => s + (p.stock ?? 0), 0); }
    get sk_valorizacion(): number { return this.sk_filtrados.reduce((s, p) => s + ((p.stock ?? 0) * (p.precioCompra ?? 0)), 0); }
    get sk_sinStock(): number { return this.sk_filtrados.filter(p => (p.stock ?? 0) === 0).length; }

    // ── Vencimientos ───────────────────────────────────────────────────────────
    vc_todosLotes: LoteConEstado[] = [];
    vc_filtrados: LoteConEstado[] = [];
    vc_filtroEstado = 'todos';
    vc_texto = '';
    vc_fechaInicio: Date | null = null;
    vc_fechaFin: Date | null = null;
    vc_columnas = ['producto', 'proveedor', 'lote', 'fechaVencimiento', 'diasParaVencer', 'stock', 'estado', 'acciones'];

    get vc_totalVencidos(): number { return this.vc_todosLotes.filter(l => l.estado === 'vencido').length; }
    get vc_totalCriticos(): number { return this.vc_todosLotes.filter(l => l.estado === 'critico').length; }
    get vc_totalAlerta(): number { return this.vc_todosLotes.filter(l => l.estado === 'alerta').length; }
    get vc_totalVigentes(): number { return this.vc_todosLotes.filter(l => l.estado === 'vigente').length; }

    // ── Margen ─────────────────────────────────────────────────────────────────
    mg_todos: ProductoConMargen[] = [];
    mg_filtrados: ProductoConMargen[] = [];
    mg_texto = '';
    mg_ordenDir: 'asc' | 'desc' = 'desc';
    mg_chart: ApexOptions = {};
    mg_columnas = ['nombre', 'categoria', 'precioCompra', 'precioVenta', 'gananciaUnitaria', 'margenPct'];

    get mg_promedio(): number {
        const v = this.mg_filtrados.filter(p => isFinite(p.margenPct));
        return v.length > 0 ? v.reduce((s, p) => s + p.margenPct, 0) / v.length : 0;
    }
    get mg_mejor(): ProductoConMargen | null {
        return this.mg_filtrados.length > 0 ? this.mg_filtrados.reduce((a, b) => a.margenPct > b.margenPct ? a : b) : null;
    }
    get mg_peor(): ProductoConMargen | null {
        const v = this.mg_filtrados.filter(p => (p.precioCompra ?? 0) > 0);
        return v.length > 0 ? v.reduce((a, b) => a.margenPct < b.margenPct ? a : b) : null;
    }

    // ── Rotación ───────────────────────────────────────────────────────────────
    rt_todos: ProductoRotacion[] = [];
    rt_filtrados: ProductoRotacion[] = [];
    rt_filtroClasif = 'todos';
    rt_rangoFecha = '';
    rt_chart: ApexOptions = {};
    rt_columnas = ['nombre', 'categoria', 'stockActual', 'totalVendido', 'rotacion', 'clasificacion'];

    get rt_totalAlta(): number { return this.rt_todos.filter(p => p.clasificacion === 'alta').length; }
    get rt_totalMedia(): number { return this.rt_todos.filter(p => p.clasificacion === 'media').length; }
    get rt_totalBaja(): number { return this.rt_todos.filter(p => p.clasificacion === 'baja').length; }
    get rt_totalMuerto(): number { return this.rt_todos.filter(p => p.clasificacion === 'muerto').length; }

    // ── Sin Movimiento ─────────────────────────────────────────────────────────
    sm_productos: ProductoSinMovimiento[] = [];
    sm_filtrados: ProductoSinMovimiento[] = [];
    sm_texto = '';
    sm_rangoFecha = '';
    sm_columnas = ['nombre', 'categoria', 'marca', 'stock', 'precioVenta', 'valorInmovilizado'];

    get sm_totalSin(): number { return this.sm_productos.length; }
    get sm_stockInmovilizado(): number { return this.sm_productos.reduce((s, p) => s + (p.stock ?? 0), 0); }
    get sm_valorInmovilizado(): number { return this.sm_productos.reduce((s, p) => s + p.valorInmovilizado, 0); }

    // ── Devoluciones ───────────────────────────────────────────────────────────
    dv_todos: DevolucionItemDTO[] = [];
    dv_filtrados: DevolucionItemDTO[] = [];
    dv_texto = '';
    dv_rangoFecha = '';
    dv_columnas = ['fecha', 'producto', 'lote', 'cantidad', 'motivo', 'observacion', 'usuario', 'valor'];

    get dv_totalDevoluciones(): number { return this.dv_todos.length; }
    get dv_totalUnidades(): number { return this.dv_todos.reduce((s, d) => s + d.cantidadDevuelta, 0); }
    get dv_totalValor(): number { return this.dv_todos.reduce((s, d) => s + d.valorDevuelto, 0); }
    get dv_motivoFrecuente(): string {
        if (!this.dv_todos.length) return '—';
        const cnt = new Map<string, number>();
        this.dv_todos.forEach(d => cnt.set(d.motivo, (cnt.get(d.motivo) ?? 0) + 1));
        return [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    // ── Descuentos ─────────────────────────────────────────────────────────────
    dc_promos: PromocionConImpacto[] = [];
    dc_filtradas: PromocionConImpacto[] = [];
    dc_filtroEstado = 'todos';
    dc_expandedId: string | null = null;
    dc_chart: ApexOptions = {};

    get dc_totalPromos(): number { return this.dc_promos.length; }
    get dc_activasHoy(): number { return this.dc_promos.filter(p => p.estado === 'activa').length; }
    get dc_descuentoPromedio(): number {
        return this.dc_promos.length > 0
            ? this.dc_promos.reduce((s, p) => s + p.descuentoPorcentaje, 0) / this.dc_promos.length
            : 0;
    }
    get dc_totalProductosEnPromo(): number {
        const ids = new Set<number>();
        this.dc_promos.filter(p => p.estado === 'activa').forEach(p => p.productos.forEach(pr => ids.add(pr.id)));
        return ids.size;
    }

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _formBuilder: UntypedFormBuilder,
        private _inventarioService: InventarioService,
        private _detalleVentaService: DetalleVentaService,
        private _detalleCompraService: DetalleCompraService,
        private _ventaService: VentaService,
        private _promocionService: PromocionService,
        private _dialog: MatDialog,
        private _devolucionService: DevolucionService,
    ) {
        this.decodeToken = this._securityService.getDecodetoken();
        this.monedaInfo = this._securityService.getMonedaStorage();
    }

    get reporteActual() { return this.REPORTES.find(r => r.id === this.reporteActivo)!; }
    getReportesPorGrupo(grupo: string) { return this.REPORTES.filter(r => r.grupo === grupo); }

    ngOnInit(): void {
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
        this.minDate = this._toolService.getMinDateFIlter();
        this.maxDate = this._toolService.getMaxDateFIlter();
        this.filtroForm = this._formBuilder.group({
            fechaInicio: [this._toolService.getStartDateOfMonth(), Validators.required],
            fechaFin: [this._toolService.getEndDateOfMonth(), Validators.required],
        });
        this.seleccionarReporte('flujo-caja');
    }

    seleccionarReporte(id: string): void {
        this.reporteActivo = id;
        if (!this.loaded.has(id)) {
            this._cargarReporte(id);
        }
    }

    buscar(): void {
        if (this.filtroForm.invalid) return;
        this.loaded.delete(this.reporteActivo);
        this._cargarReporte(this.reporteActivo);
    }

    private _cargarReporte(id: string): void {
        switch (id) {
            case 'flujo-caja':     this._cargarFlujoCaja(); break;
            case 'tendencia':      this._cargarTendencia(); break;
            case 'stock':          this._cargarStock(); break;
            case 'vencimientos':   this._cargarVencimientos(); break;
            case 'margen':         this._cargarMargen(); break;
            case 'rotacion':       this._cargarRotacion(); break;
            case 'sin-movimiento': this._cargarSinMovimiento(); break;
            case 'descuentos':     this._cargarDescuentos(); break;
            case 'devoluciones':   this._cargarDevoluciones(); break;
        }
    }

    // ── Loaders ─────────────────────────────────────────────────────────────────

    private _cargarFlujoCaja(): void {
        if (this.filtroForm.invalid) return;
        this.skeleton = true;
        this.disabledBuscar = true;
        const fi: Date = this.filtroForm.get('fechaInicio')?.value;
        const ff: Date = this.filtroForm.get('fechaFin')?.value;
        this.fc_rangoFecha = `Desde ${this._toolService.formatoFecha(fi)} Hasta ${this._toolService.formatoFecha(ff)}`;

        const vReq = new ObtenerResumenReporteRequest();
        vReq.destinationTimeZoneId = this._toolService.getTimeZone();
        vReq.idUsuario = this.decodeToken.idUsuario;
        vReq.fechaInicio = fi; vReq.fechaFin = ff;
        vReq.lstCategorias = []; vReq.lstMarcas = [];

        const cReq = new ObtenerResumenReporteCompraRequest();
        cReq.destinationTimeZoneId = this._toolService.getTimeZone();
        cReq.idUsuario = this.decodeToken.idUsuario;
        cReq.fechaInicio = fi; cReq.fechaFin = ff;

        forkJoin({ ventas: this._detalleVentaService.GetResumenReporteAsync(vReq), compras: this._detalleCompraService.GetResumenReporteAsync(cReq) }).subscribe({
            next: ({ ventas, compras }) => {
                const evV = ventas.evolucionVentasFecha;
                const evC = compras.evolucionComprasFecha;
                const totalV = evV.totalVenta.reduce((a: number, b: number) => a + b, 0);
                const totalC = evC.totalCompra.reduce((a: number, b: number) => a + b, 0);
                this.fc_totalIngresos = totalV;
                this.fc_totalEgresos = totalC;
                this.fc_saldoNeto = totalV - totalC;
                this.fc_margenPct = totalV > 0 ? ((totalV - totalC) / totalV) * 100 : 0;
                this._fcGenerarChart(evV, evC);
                this.loaded.add('flujo-caja');
                this.skeleton = false; this.disabledBuscar = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; this.disabledBuscar = false; },
        });
    }

    private _fcGenerarChart(evV: any, evC: any): void {
        const toKey = (d: any) => new Date(d).toISOString().slice(0, 10);
        const cf = this.currencyNumberFormat;
        const ventasMap = new Map<string, number>();
        evV.fechaVenta.forEach((f: any, i: number) => ventasMap.set(toKey(f), evV.totalVenta[i]));
        const comprasMap = new Map<string, number>();
        evC.fechaCompra.forEach((f: any, i: number) => comprasMap.set(toKey(f), evC.totalCompra[i]));
        const allDates = Array.from(new Set([...ventasMap.keys(), ...comprasMap.keys()])).sort();
        const sV = allDates.map(d => ventasMap.get(d) ?? 0);
        const sC = allDates.map(d => comprasMap.get(d) ?? 0);
        const sS = allDates.map((_, i) => sV[i] - sC[i]);
        this.fc_chart = {
            series: [{ name: 'Ingresos', data: sV }, { name: 'Egresos', data: sC }, { name: 'Saldo Neto', data: sS }],
            chart: { type: 'line', height: 380, toolbar: { show: false }, animations: { enabled: false } },
            colors: ['#10B981', '#EF4444', '#3B82F6'],
            stroke: { show: true, width: 2, curve: 'smooth' },
            dataLabels: { enabled: false },
            xaxis: { categories: allDates, labels: { rotateAlways: true, rotate: -45 } },
            yaxis: { labels: { formatter: (v: number) => cf.format(v) } },
            tooltip: { y: { formatter: (v: number) => cf.format(v) } },
            legend: { show: false },
            noData: { text: 'Sin datos en el período', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    private _cargarTendencia(): void {
        if (this.filtroForm.invalid) return;
        this.skeleton = true;
        this.disabledBuscar = true;
        const fi: Date = this.filtroForm.get('fechaInicio')?.value;
        const ff: Date = this.filtroForm.get('fechaFin')?.value;
        this.td_rangoFecha = `Desde ${this._toolService.formatoFecha(fi)} Hasta ${this._toolService.formatoFecha(ff)}`;
        const req = new ObtenerVentaRequest();
        req.destinationTimeZoneId = this._toolService.getTimeZone();
        req.idUsuario = this.decodeToken.idUsuario;
        req.lstUsuario = []; req.fechaVentaInicio = fi; req.fechaVentaFin = ff;
        req.montoVentaInicio = 0; req.montoVentaFin = 9999999;
        this._ventaService.GetAllByFilterAsync(req).subscribe({
            next: (ventas: VentaDTO[]) => {
                const activas = ventas.filter(v => v.estado);
                this.td_totalVentas = activas.length;
                this.td_ticketPromedio = activas.length > 0 ? activas.reduce((s, v) => s + v.totalVenta, 0) / activas.length : 0;
                this._tdGenerarCharts(activas);
                this.loaded.add('tendencia');
                this.skeleton = false; this.disabledBuscar = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; this.disabledBuscar = false; },
        });
    }

    private _tdGenerarCharts(ventas: VentaDTO[]): void {
        const cf = this.currencyNumberFormat;
        const porHora = new Array(24).fill(0), totalPorHora = new Array(24).fill(0);
        const porDia = new Array(7).fill(0), totalPorDia = new Array(7).fill(0);
        for (const v of ventas) {
            const d = new Date(v.fechaVenta);
            porHora[d.getHours()]++; totalPorHora[d.getHours()] += v.totalVenta;
            porDia[d.getDay()]++; totalPorDia[d.getDay()] += v.totalVenta;
        }
        const maxH = porHora.indexOf(Math.max(...porHora));
        this.td_horaPico = `${maxH}:00 – ${maxH + 1}:00`;
        const maxD = porDia.indexOf(Math.max(...porDia));
        this.td_diaPico = this.DIAS[maxD];

        const tooltipFmt = (v: number, opts: any) => opts.seriesIndex === 1 ? cf.format(v) : `${v} ventas`;
        this.td_chartHora = {
            series: [{ name: 'Ventas', data: porHora }, { name: 'Ingresos', data: totalPorHora }],
            chart: { type: 'bar', height: 300, toolbar: { show: false } },
            colors: ['#3B82F6', '#10B981'],
            plotOptions: { bar: { columnWidth: '70%' } },
            dataLabels: { enabled: false },
            legend: { show: false },
            xaxis: { categories: Array.from({ length: 24 }, (_, i) => `${i}h`), labels: { rotate: -45 } },
            yaxis: [
                { seriesName: 'Ventas', title: { text: '# Ventas' }, labels: { formatter: (v: number) => `${v}` } },
                { seriesName: 'Ingresos', opposite: true, title: { text: 'Ingresos' }, labels: { formatter: (v: number) => cf.format(v) } },
            ],
            tooltip: { y: { formatter: tooltipFmt } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
        this.td_chartDia = {
            series: [{ name: 'Ventas', data: porDia }, { name: 'Ingresos', data: totalPorDia }],
            chart: { type: 'bar', height: 300, toolbar: { show: false } },
            colors: ['#8B5CF6', '#F59E0B'],
            plotOptions: { bar: { columnWidth: '60%' } },
            dataLabels: { enabled: false },
            legend: { show: false },
            xaxis: { categories: this.DIAS },
            yaxis: [
                { seriesName: 'Ventas', title: { text: '# Ventas' }, labels: { formatter: (v: number) => `${v}` } },
                { seriesName: 'Ingresos', opposite: true, title: { text: 'Ingresos' }, labels: { formatter: (v: number) => cf.format(v) } },
            ],
            tooltip: { y: { formatter: tooltipFmt } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    private _cargarStock(): void {
        this.skeleton = true;
        this._inventarioService.GetAllProductoByFilterAsync(this._openProductoReq()).subscribe({
            next: (productos: ProductoDTO[]) => {
                this.sk_allProductos = productos;
                this.sk_categorias = [...new Set(productos.map(p => p.categoria?.nombre ?? 'Sin categoría'))].sort();
                this._skAplicarFiltros();
                this.loaded.add('stock');
                this.skeleton = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; },
        });
    }

    skFiltrar(): void { this._skAplicarFiltros(); }

    private _skAplicarFiltros(): void {
        const txt = this.sk_texto.trim().toLowerCase();
        this.sk_filtrados = this.sk_allProductos.filter(p => {
            const matchTexto = !txt || p.nombre?.toLowerCase().includes(txt) || p.codigo?.toLowerCase().includes(txt);
            const matchSinStock = !this.sk_soloSinStock || (p.stock ?? 0) === 0;
            const matchCat = !this.sk_categoriaSel || (p.categoria?.nombre ?? 'Sin categoría') === this.sk_categoriaSel;
            return matchTexto && matchSinStock && matchCat;
        });
        this._skGenerarGraficos();
    }

    private _skGenerarGraficos(): void {
        const cf = this.currencyNumberFormat;
        const catMap = new Map<string, number>();
        for (const p of this.sk_filtrados) {
            const cat = p.categoria?.nombre ?? 'Sin categoría';
            catMap.set(cat, (catMap.get(cat) ?? 0) + ((p.stock ?? 0) * (p.precioCompra ?? 0)));
        }
        const labels = Array.from(catMap.keys());
        const series = Array.from(catMap.values());
        const total = series.reduce((a, b) => a + b, 0);
        this.sk_chartCat = {
            chart: { type: 'donut', fontFamily: 'inherit', foreColor: 'inherit', height: 350 },
            labels, series,
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
            tooltip: { enabled: true, y: { formatter: (val: number) => cf.format(val) } },
            dataLabels: { enabled: true },
            plotOptions: { pie: { donut: { labels: { show: true, name: { show: false }, value: { show: true, fontSize: '22px', color: '#494949', offsetY: 0, formatter: () => cf.format(total) }, total: { show: true, showAlways: true, label: '', fontSize: '22px', color: '#494949', formatter: () => cf.format(total) } } } } },
            legend: { show: false },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
        const top10 = [...this.sk_filtrados].map(p => ({ nombre: p.nombre, valor: (p.stock ?? 0) * (p.precioCompra ?? 0) })).sort((a, b) => b.valor - a.valor).slice(0, 10);
        this.sk_chartTop = {
            series: [{ name: 'Valorización', data: top10.map(t => t.valor) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true, dataLabels: { position: 'top' } } },
            colors: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6366F1'],
            dataLabels: { enabled: true, textAnchor: 'start', formatter: (val: number) => cf.format(val), offsetX: 5, style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' } },
            xaxis: { categories: top10.map(t => t.nombre), labels: { show: false } },
            legend: { show: false },
            tooltip: { enabled: true, y: { formatter: (val: number) => cf.format(val) } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    private _cargarVencimientos(): void {
        this.skeleton = true;
        const req = new ObtenerLoteRequest();
        req.idUsuario = this.decodeToken.idUsuario;
        req.nombre = '';
        this._inventarioService.GetAllLotesByFilterAsync(req).subscribe({
            next: (lotes: LoteDTO[]) => {
                this.vc_todosLotes = lotes.map(l => this._vcClasificar(l));
                this._vcAplicarFiltro();
                this.loaded.add('vencimientos');
                this.skeleton = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; },
        });
    }

    private _vcClasificar(lote: LoteDTO): LoteConEstado {
        if (!lote.fechaCaducidad) return { ...lote, diasParaVencer: null, estado: 'sin_fecha' };
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const fv = new Date(lote.fechaCaducidad); fv.setHours(0, 0, 0, 0);
        const dias = Math.floor((fv.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        let estado: EstadoVencimiento;
        if (dias < 0)    estado = 'vencido';
        else if (dias <= 5)  estado = 'critico';
        else if (dias <= 15) estado = 'alerta';
        else estado = 'vigente';
        return { ...lote, diasParaVencer: dias, estado };
    }

    vcSetFiltro(estado: string): void {
        this.vc_filtroEstado = estado;
        this._vcAplicarFiltro();
    }

    vcFiltrar(): void { this._vcAplicarFiltro(); }

    vcLimpiarFiltros(): void {
        this.vc_texto = '';
        this.vc_fechaInicio = null;
        this.vc_fechaFin = null;
        this._vcAplicarFiltro();
    }

    private _vcAplicarFiltro(): void {
        let result = this.vc_filtroEstado === 'todos'
            ? [...this.vc_todosLotes]
            : this.vc_todosLotes.filter(l => l.estado === this.vc_filtroEstado);

        const txt = this.vc_texto.trim().toLowerCase();
        if (txt) {
            result = result.filter(l => l.nombreProducto?.toLowerCase().includes(txt));
        }

        if (this.vc_fechaInicio) {
            const fi = new Date(this.vc_fechaInicio); fi.setHours(0, 0, 0, 0);
            result = result.filter(l => l.fechaCaducidad != null && new Date(l.fechaCaducidad) >= fi);
        }

        if (this.vc_fechaFin) {
            const ff = new Date(this.vc_fechaFin); ff.setHours(23, 59, 59, 999);
            result = result.filter(l => l.fechaCaducidad != null && new Date(l.fechaCaducidad) <= ff);
        }

        this.vc_filtrados = result;
    }

    vcGetRowClass(estado: string): string {
        switch (estado) {
            case 'vencido': return 'bg-red-50 dark:bg-red-900/20';
            case 'critico': return 'bg-orange-50 dark:bg-orange-900/20';
            case 'alerta': return 'bg-yellow-50 dark:bg-yellow-900/20';
            case 'vigente': return 'bg-green-50 dark:bg-green-900/20';
            default: return '';
        }
    }

    vcGetBadgeClass(estado: string): string {
        switch (estado) {
            case 'vencido': return 'bg-red-100 text-red-700';
            case 'critico': return 'bg-orange-100 text-orange-700';
            case 'alerta': return 'bg-yellow-100 text-yellow-700';
            case 'vigente': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    vcGetBadgeLabel(estado: string): string {
        switch (estado) {
            case 'vencido': return 'Vencido'; case 'critico': return 'Crítico';
            case 'alerta': return 'Alerta'; case 'vigente': return 'Vigente';
            default: return 'Sin fecha';
        }
    }

    abrirDevolucion(lote: LoteConEstado): void {
        const ref = this._dialog.open(DevolucionDialogComponent, {
            width: '480px',
            disableClose: true,
            data: {
                idLote: lote.id,
                nombreProducto: lote.nombreProducto,
                stockDisponible: lote.cantidadDisponible,
                fechaVencimiento: lote.fechaCaducidad ?? null,
            },
        });
        ref.afterClosed().subscribe((registrado: boolean) => {
            if (registrado) {
                this.loaded.delete('vencimientos');
                this._cargarVencimientos();
            }
        });
    }

    private _cargarMargen(): void {
        this.skeleton = true;
        this._inventarioService.GetAllProductoByFilterAsync(this._openProductoReq()).subscribe({
            next: (productos: ProductoDTO[]) => {
                this.mg_todos = productos
                    .filter(p => p.precioCompra != null && p.precioVenta != null)
                    .map(p => {
                        const ganancia = p.precioVenta - (p.precioCompra ?? 0);
                        const margen = (p.precioCompra ?? 0) > 0 ? (ganancia / (p.precioCompra ?? 1)) * 100 : 0;
                        return { ...p, margenPct: margen, gananciaUnitaria: ganancia } as ProductoConMargen;
                    });
                this._mgAplicarFiltro();
                this.loaded.add('margen');
                this.skeleton = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; },
        });
    }

    mgFiltrar(): void { this._mgAplicarFiltro(); }

    mgToggleOrden(): void {
        this.mg_ordenDir = this.mg_ordenDir === 'desc' ? 'asc' : 'desc';
        this._mgAplicarFiltro();
    }

    private _mgAplicarFiltro(): void {
        const txt = this.mg_texto.trim().toLowerCase();
        let filtered = txt
            ? this.mg_todos.filter(p => p.nombre?.toLowerCase().includes(txt) || p.categoria?.nombre?.toLowerCase().includes(txt))
            : [...this.mg_todos];
        filtered.sort((a, b) => this.mg_ordenDir === 'desc' ? b.margenPct - a.margenPct : a.margenPct - b.margenPct);
        this.mg_filtrados = filtered;
        this._mgGenerarChart();
    }

    private _mgGenerarChart(): void {
        const top = [...this.mg_filtrados].sort((a, b) => b.margenPct - a.margenPct).slice(0, 10);
        this.mg_chart = {
            series: [{ name: 'Margen (%)', data: top.map(p => parseFloat(p.margenPct.toFixed(1))) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true } },
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#14B8A6'],
            dataLabels: { enabled: true, textAnchor: 'start', formatter: (val: number) => `${val.toFixed(1)}%`, offsetX: 5, style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' } },
            xaxis: { categories: top.map(p => p.nombre), labels: { show: false } },
            legend: { show: false },
            tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    mgGetMargenClass(margen: number): string {
        if (margen >= 50) return 'text-green-600 font-bold';
        if (margen >= 20) return 'text-blue-600 font-semibold';
        if (margen >= 0) return 'text-yellow-600';
        return 'text-red-600 font-bold';
    }

    private _cargarRotacion(): void {
        if (this.filtroForm.invalid) return;
        this.skeleton = true;
        this.disabledBuscar = true;
        const fi: Date = this.filtroForm.get('fechaInicio')?.value;
        const ff: Date = this.filtroForm.get('fechaFin')?.value;
        this.rt_rangoFecha = `Desde ${this._toolService.formatoFecha(fi)} Hasta ${this._toolService.formatoFecha(ff)}`;
        const req = new ObtenerReporteProductoRequest();
        req.destinationTimeZoneId = this._toolService.getTimeZone();
        req.idUsuario = this.decodeToken.idUsuario;
        req.lstProductos = []; req.fechaVentaInicio = fi; req.fechaVentaFin = ff;
        forkJoin({ productos: this._inventarioService.GetAllProductoByFilterAsync(this._openProductoReq()), ventas: this._detalleVentaService.GetAnalisisProductosByFilterAsync(req) }).subscribe({
            next: ({ productos, ventas }) => {
                const dist = ventas.distribucionVentasProducto;
                const ventasMap = new Map<string, number>();
                dist.nombreProductos.forEach((nombre: string, i: number) => ventasMap.set(nombre, dist.totalVentasProductos[i]));
                this.rt_todos = productos.map(p => {
                    const monto = ventasMap.get(p.nombre) ?? 0;
                    const precioV = p.precioVenta > 0 ? p.precioVenta : 1;
                    const unidades = monto / precioV;
                    const stock = p.stock ?? 0;
                    const rotacion = stock > 0 ? unidades / stock : (unidades > 0 ? 999 : 0);
                    return { nombre: p.nombre, categoria: p.categoria?.nombre ?? '—', stockActual: stock, totalVendido: monto, rotacion, clasificacion: this._rtClasificar(rotacion, unidades) } as ProductoRotacion;
                }).sort((a, b) => b.rotacion - a.rotacion);
                this._rtAplicarFiltro();
                this._rtGenerarChart();
                this.loaded.add('rotacion');
                this.skeleton = false; this.disabledBuscar = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; this.disabledBuscar = false; },
        });
    }

    private _rtClasificar(rotacion: number, unidades: number): 'alta' | 'media' | 'baja' | 'muerto' {
        if (unidades === 0) return 'muerto';
        if (rotacion >= 2) return 'alta';
        if (rotacion >= 0.5) return 'media';
        return 'baja';
    }

    rtSetFiltroClasif(v: string): void { this.rt_filtroClasif = v; this._rtAplicarFiltro(); }

    private _rtAplicarFiltro(): void {
        this.rt_filtrados = this.rt_filtroClasif === 'todos'
            ? this.rt_todos
            : this.rt_todos.filter(p => p.clasificacion === this.rt_filtroClasif);
    }

    private _rtGenerarChart(): void {
        const top = this.rt_todos.slice(0, 10);
        this.rt_chart = {
            series: [{ name: 'Rotación', data: top.map(p => parseFloat(p.rotacion.toFixed(2))) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true } },
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'],
            dataLabels: { enabled: true, textAnchor: 'start', formatter: (val: number) => `${val.toFixed(2)}x`, offsetX: 5, style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' } },
            xaxis: { categories: top.map(p => p.nombre), labels: { show: false } },
            legend: { show: false },
            tooltip: { y: { formatter: (v: number) => `${v.toFixed(2)} veces` } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    rtGetClasifBadge(c: string): string {
        switch (c) {
            case 'alta': return 'bg-green-100 text-green-700'; case 'media': return 'bg-blue-100 text-blue-700';
            case 'baja': return 'bg-yellow-100 text-yellow-700'; default: return 'bg-red-100 text-red-700';
        }
    }
    rtGetClasifLabel(c: string): string {
        switch (c) {
            case 'alta': return 'Alta'; case 'media': return 'Media'; case 'baja': return 'Baja'; default: return 'Muerto';
        }
    }

    private _cargarSinMovimiento(): void {
        if (this.filtroForm.invalid) return;
        this.skeleton = true;
        this.disabledBuscar = true;
        const fi: Date = this.filtroForm.get('fechaInicio')?.value;
        const ff: Date = this.filtroForm.get('fechaFin')?.value;
        this.sm_rangoFecha = `Desde ${this._toolService.formatoFecha(fi)} Hasta ${this._toolService.formatoFecha(ff)}`;
        const req = new ObtenerReporteProductoRequest();
        req.destinationTimeZoneId = this._toolService.getTimeZone();
        req.idUsuario = this.decodeToken.idUsuario;
        req.lstProductos = []; req.fechaVentaInicio = fi; req.fechaVentaFin = ff;
        forkJoin({ productos: this._inventarioService.GetAllProductoByFilterAsync(this._openProductoReq()), ventas: this._detalleVentaService.GetAnalisisProductosByFilterAsync(req) }).subscribe({
            next: ({ productos, ventas }) => {
                const conVentas = new Set(ventas.distribucionVentasProducto.nombreProductos);
                this.sm_productos = productos
                    .filter(p => !conVentas.has(p.nombre) && p.activo)
                    .map(p => ({ ...p, valorInmovilizado: (p.stock ?? 0) * (p.precioVenta ?? 0) } as ProductoSinMovimiento))
                    .sort((a, b) => b.valorInmovilizado - a.valorInmovilizado);
                this._smFiltrar();
                this.loaded.add('sin-movimiento');
                this.skeleton = false; this.disabledBuscar = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; this.disabledBuscar = false; },
        });
    }

    smFiltrar(): void { this._smFiltrar(); }

    private _smFiltrar(): void {
        const txt = this.sm_texto.trim().toLowerCase();
        this.sm_filtrados = txt
            ? this.sm_productos.filter(p => p.nombre?.toLowerCase().includes(txt) || p.categoria?.nombre?.toLowerCase().includes(txt))
            : [...this.sm_productos];
    }

    private _cargarDescuentos(): void {
        this.skeleton = true;
        this._inventarioService.GetAllProductoByFilterAsync(this._openProductoReq()).subscribe({
            next: (productos: ProductoDTO[]) => {
                const precioMap = new Map<number, number>();
                productos.forEach(p => precioMap.set(p.id, p.precioVenta ?? 0));
                const promos = this._promocionService.getAll();
                this.dc_promos = promos.map(promo => {
                    const estado = this._promocionService.getEstado(promo);
                    const productosConPrecio = promo.productos.map(pr => ({
                        nombre: pr.nombre,
                        precioOriginal: precioMap.get(pr.id) ?? 0,
                        precioConDescuento: (precioMap.get(pr.id) ?? 0) * (1 - promo.descuentoPorcentaje / 100),
                    }));
                    const ahorroEstimado = productosConPrecio.reduce((s, p) => s + (p.precioOriginal - p.precioConDescuento), 0);
                    return { ...promo, estado, ahorroEstimado, productosConPrecio } as PromocionConImpacto;
                });
                this._dcAplicarFiltro();
                this._dcGenerarChart();
                this.loaded.add('descuentos');
                this.skeleton = false;
            },
            error: () => { this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle); this.skeleton = false; },
        });
    }

    dcSetFiltro(v: string): void { this.dc_filtroEstado = v; this._dcAplicarFiltro(); }
    dcToggleExpand(id: string): void { this.dc_expandedId = this.dc_expandedId === id ? null : id; }

    private _dcAplicarFiltro(): void {
        this.dc_filtradas = this.dc_filtroEstado === 'todos'
            ? this.dc_promos
            : this.dc_promos.filter(p => p.estado === this.dc_filtroEstado);
    }

    private _dcGenerarChart(): void {
        this.dc_chart = {
            series: [{ name: 'Descuento (%)', data: this.dc_promos.map(p => p.descuentoPorcentaje) }],
            chart: { type: 'bar', height: 300, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true } },
            colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
            dataLabels: { enabled: true, textAnchor: 'start', formatter: (val: number) => `${val}%`, offsetX: 5, style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' } },
            xaxis: { categories: this.dc_promos.map(p => p.motivo), labels: { show: false } },
            legend: { show: false },
            tooltip: { y: { formatter: (v: number) => `${v}% descuento` } },
            noData: { text: 'Sin promociones creadas', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    dcGetEstadoBadge(estado: string): string {
        switch (estado) {
            case 'activa': return 'bg-green-100 text-green-700'; case 'pendiente': return 'bg-blue-100 text-blue-700';
            case 'vencida': return 'bg-gray-100 text-gray-600'; default: return 'bg-red-100 text-red-700';
        }
    }
    dcGetEstadoLabel(estado: string): string {
        switch (estado) {
            case 'activa': return 'Activa'; case 'pendiente': return 'Pendiente';
            case 'vencida': return 'Vencida'; default: return 'Inactiva';
        }
    }

    private _cargarDevoluciones(): void {
        if (this.filtroForm.invalid) return;
        this.skeleton = true;
        this.disabledBuscar = true;
        const fi: Date = this.filtroForm.get('fechaInicio')?.value;
        const ff: Date = this.filtroForm.get('fechaFin')?.value;
        this.dv_rangoFecha = `Desde ${this._toolService.formatoFecha(fi)} Hasta ${this._toolService.formatoFecha(ff)}`;
        const req = new ObtenerDevolucionesRequest();
        req.fechaInicio = fi;
        req.fechaFin = ff;
        this._devolucionService.GetAllByFilterAsync(req).subscribe({
            next: (items: DevolucionItemDTO[]) => {
                this.dv_todos = items;
                this._dvFiltrar();
                this.loaded.add('devoluciones');
                this.skeleton = false;
                this.disabledBuscar = false;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.skeleton = false;
                this.disabledBuscar = false;
            },
        });
    }

    dvFiltrar(): void { this._dvFiltrar(); }

    private _dvFiltrar(): void {
        const txt = this.dv_texto.trim().toLowerCase();
        this.dv_filtrados = txt
            ? this.dv_todos.filter(d =>
                d.nombreProducto?.toLowerCase().includes(txt) ||
                d.codigoLote?.toLowerCase().includes(txt) ||
                d.nombreUsuario?.toLowerCase().includes(txt) ||
                d.motivo?.toLowerCase().includes(txt))
            : [...this.dv_todos];
    }

    dvGetMotivoLabel(m: string): string {
        switch (m) {
            case 'vencimiento': return 'Vencido';
            case 'defecto':     return 'Defecto';
            default:            return 'Otro';
        }
    }

    dvGetMotivoBadge(m: string): string {
        switch (m) {
            case 'vencimiento': return 'bg-red-100 text-red-700';
            case 'defecto':     return 'bg-orange-100 text-orange-700';
            default:            return 'bg-gray-100 text-gray-600';
        }
    }

    // ── Utilidades ─────────────────────────────────────────────────────────────

    private _openProductoReq(): ObtenerProductoRequest {
        const req = new ObtenerProductoRequest();
        req.destinationTimeZoneId = this._toolService.getTimeZone();
        req.idUsuario = this.decodeToken.idUsuario;
        req.codigo = '';
        req.nombre = '';
        req.lstCategorias = [];
        req.lstMarcas = [];
        return req;
    }

    formatCurrency(v: number): string { return this.currencyNumberFormat?.format(v) ?? v.toString(); }
    formatPct(v: number): string { return `${v.toFixed(1)}%`; }
    formatFecha(f: any): string { return f ? this._toolService.formatoFecha(new Date(f)) : '—'; }
    isMobilSize(): boolean { return this._toolService.isMobilSize(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
