import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { Flags } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { ApexOptions } from 'ng-apexcharts';

export interface ProductoConMargen extends ProductoDTO {
    margenPct: number;
    gananciaUnitaria: number;
}

@Component({
    selector: 'app-reporte-margen-page',
    templateUrl: './reporte-margen-page.component.html',
    styleUrl: './reporte-margen-page.component.scss',
})
export class ReporteMargenPageComponent implements OnInit, OnDestroy {

    public _unsubscribeAll: Subject<any> = new Subject<any>();

    public monedaInfo: MonedaDTO = this._securityService.getMonedaStorage();
    public currencyNumberFormat!: Intl.NumberFormat;

    public skeleton: boolean = Flags.False;
    public textoBusqueda: string = '';
    public ordenDir: 'asc' | 'desc' = 'desc';

    public todosProductos: ProductoConMargen[] = [];
    public productosFiltrados: ProductoConMargen[] = [];

    public chartTop10: ApexOptions = {};

    public columnas: string[] = ['nombre', 'categoria', 'precioCompra', 'precioVenta', 'gananciaUnitaria', 'margenPct'];

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _inventarioService: InventarioService,
    ) { }

    get promedioMargen(): number {
        const validos = this.productosFiltrados.filter(p => isFinite(p.margenPct));
        return validos.length > 0 ? validos.reduce((s, p) => s + p.margenPct, 0) / validos.length : 0;
    }

    get mejorMargen(): ProductoConMargen | null {
        return this.productosFiltrados.length > 0
            ? this.productosFiltrados.reduce((a, b) => a.margenPct > b.margenPct ? a : b)
            : null;
    }

    get peorMargen(): ProductoConMargen | null {
        const validos = this.productosFiltrados.filter(p => p.precioCompra != null && p.precioCompra > 0);
        return validos.length > 0
            ? validos.reduce((a, b) => a.margenPct < b.margenPct ? a : b)
            : null;
    }

    ngOnInit(): void {
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.skeleton = Flags.True;
        this._inventarioService.GetAllProductoForComboBoxAsync().subscribe({
            next: (productos: ProductoDTO[]) => {
                this.todosProductos = productos
                    .filter(p => p.precioCompra != null && p.precioVenta != null)
                    .map(p => {
                        const ganancia = p.precioVenta - (p.precioCompra ?? 0);
                        const margen = (p.precioCompra ?? 0) > 0
                            ? (ganancia / (p.precioCompra ?? 1)) * 100
                            : 0;
                        return { ...p, margenPct: margen, gananciaUnitaria: ganancia } as ProductoConMargen;
                    });
                this.aplicarFiltro();
                this.skeleton = Flags.False;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.skeleton = Flags.False;
            },
        });
    }

    aplicarFiltro(): void {
        const txt = this.textoBusqueda.trim().toLowerCase();
        let filtered = txt
            ? this.todosProductos.filter(p =>
                p.nombre?.toLowerCase().includes(txt) ||
                p.categoria?.nombre?.toLowerCase().includes(txt))
            : [...this.todosProductos];

        filtered.sort((a, b) =>
            this.ordenDir === 'desc' ? b.margenPct - a.margenPct : a.margenPct - b.margenPct);

        this.productosFiltrados = filtered;
        this.generarChart();
    }

    toggleOrden(): void {
        this.ordenDir = this.ordenDir === 'desc' ? 'asc' : 'desc';
        this.aplicarFiltro();
    }

    generarChart(): void {
        const cf = this.currencyNumberFormat;
        const top = [...this.productosFiltrados].sort((a, b) => b.margenPct - a.margenPct).slice(0, 10);

        this.chartTop10 = {
            series: [{ name: 'Margen (%)', data: top.map(p => parseFloat(p.margenPct.toFixed(1))) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true } },
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#14B8A6'],
            dataLabels: {
                enabled: true,
                textAnchor: 'start',
                formatter: (val: number) => `${val.toFixed(1)}%`,
                offsetX: 5,
                style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' },
            },
            xaxis: { categories: top.map(p => p.nombre), labels: { show: false } },
            tooltip: { y: { formatter: (v: number) => `${v.toFixed(1)}%` } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    formatCurrency(v: number): string { return this.currencyNumberFormat?.format(v) ?? v.toString(); }
    formatPct(v: number): string { return `${v.toFixed(1)}%`; }

    getMargenClass(margen: number): string {
        if (margen >= 50) return 'text-green-600 font-bold';
        if (margen >= 20) return 'text-blue-600 font-semibold';
        if (margen >= 0) return 'text-yellow-600';
        return 'text-red-600 font-bold';
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
