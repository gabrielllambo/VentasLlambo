import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { Flags } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { DetalleVentaService } from 'app/core/services/detalleventa/detalleventa.service';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { ObtenerReporteProductoRequest } from 'app/core/models/venta/request/obtener-reporte-producto-request.model';
import { ApexOptions } from 'ng-apexcharts';

export interface ProductoRotacion {
    nombre: string;
    categoria: string;
    stockActual: number;
    totalVendido: number;
    rotacion: number;
    clasificacion: 'alta' | 'media' | 'baja' | 'muerto';
}

@Component({
    selector: 'app-reporte-rotacion-page',
    templateUrl: './reporte-rotacion-page.component.html',
    styleUrl: './reporte-rotacion-page.component.scss',
})
export class ReporteRotacionPageComponent implements OnInit, OnDestroy {

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

    public todosProductos: ProductoRotacion[] = [];
    public productosFiltrados: ProductoRotacion[] = [];
    public filtroClasif: string = 'todos';

    public chartRotacion: ApexOptions = {};

    public columnas: string[] = ['nombre', 'categoria', 'stockActual', 'totalVendido', 'rotacion', 'clasificacion'];

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _formBuilder: UntypedFormBuilder,
        private _inventarioService: InventarioService,
        private _detalleVentaService: DetalleVentaService,
    ) { }

    get totalAlta(): number { return this.todosProductos.filter(p => p.clasificacion === 'alta').length; }
    get totalMedia(): number { return this.todosProductos.filter(p => p.clasificacion === 'media').length; }
    get totalBaja(): number { return this.todosProductos.filter(p => p.clasificacion === 'baja').length; }
    get totalMuerto(): number { return this.todosProductos.filter(p => p.clasificacion === 'muerto').length; }

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

        const ventaReq = new ObtenerReporteProductoRequest();
        ventaReq.destinationTimeZoneId = this._toolService.getTimeZone();
        ventaReq.idUsuario = this.decodeToken.idUsuario;
        ventaReq.lstProductos = [];
        ventaReq.fechaVentaInicio = fi;
        ventaReq.fechaVentaFin = ff;

        forkJoin({
            productos: this._inventarioService.GetAllProductoForComboBoxAsync(),
            ventas: this._detalleVentaService.GetAnalisisProductosByFilterAsync(ventaReq),
        }).subscribe({
            next: ({ productos, ventas }) => {
                const dist = ventas.distribucionVentasProducto;
                const ventasMap = new Map<string, number>();
                dist.nombreProductos.forEach((nombre, i) => ventasMap.set(nombre, dist.totalVentasProductos[i]));

                this.todosProductos = productos.map(p => {
                    const monto = ventasMap.get(p.nombre) ?? 0;
                    const precioV = p.precioVenta > 0 ? p.precioVenta : 1;
                    const unidadesEst = monto / precioV;
                    const stock = p.stock ?? 0;
                    const rotacion = stock > 0 ? unidadesEst / stock : (unidadesEst > 0 ? 999 : 0);
                    const clasificacion = this.clasificar(rotacion, unidadesEst);
                    return {
                        nombre: p.nombre,
                        categoria: p.categoria?.nombre ?? '—',
                        stockActual: stock,
                        totalVendido: monto,
                        rotacion,
                        clasificacion,
                    } as ProductoRotacion;
                }).sort((a, b) => b.rotacion - a.rotacion);

                this.aplicarFiltroClasif();
                this.generarChart();
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

    clasificar(rotacion: number, unidadesEst: number): 'alta' | 'media' | 'baja' | 'muerto' {
        if (unidadesEst === 0) return 'muerto';
        if (rotacion >= 2) return 'alta';
        if (rotacion >= 0.5) return 'media';
        return 'baja';
    }

    aplicarFiltroClasif(): void {
        this.productosFiltrados = this.filtroClasif === 'todos'
            ? this.todosProductos
            : this.todosProductos.filter(p => p.clasificacion === this.filtroClasif);
    }

    setFiltroClasif(v: string): void {
        this.filtroClasif = v;
        this.aplicarFiltroClasif();
    }

    generarChart(): void {
        const cf = this.currencyNumberFormat;
        const top = this.todosProductos.slice(0, 10);
        this.chartRotacion = {
            series: [{ name: 'Rotación', data: top.map(p => parseFloat(p.rotacion.toFixed(2))) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true } },
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'],
            dataLabels: {
                enabled: true,
                textAnchor: 'start',
                formatter: (val: number) => `${val.toFixed(2)}x`,
                offsetX: 5,
                style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' },
            },
            xaxis: { categories: top.map(p => p.nombre), labels: { show: false } },
            tooltip: { y: { formatter: (v: number) => `${v.toFixed(2)} veces` } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    getClasifBadge(c: string): string {
        switch (c) {
            case 'alta': return 'bg-green-100 text-green-700';
            case 'media': return 'bg-blue-100 text-blue-700';
            case 'baja': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-red-100 text-red-700';
        }
    }

    getClasifLabel(c: string): string {
        switch (c) {
            case 'alta': return 'Alta';
            case 'media': return 'Media';
            case 'baja': return 'Baja';
            default: return 'Muerto';
        }
    }

    formatCurrency(v: number): string { return this.currencyNumberFormat?.format(v) ?? v.toString(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
