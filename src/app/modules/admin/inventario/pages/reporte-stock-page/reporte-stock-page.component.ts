import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { MatSelect } from '@angular/material/select';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ApexOptions } from 'ng-apexcharts';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';

@Component({
    selector: 'app-reporte-stock-page',
    templateUrl: './reporte-stock-page.component.html',
    styleUrl: './reporte-stock-page.component.scss',
})
export class ReporteStockPageComponent implements OnInit, OnDestroy {

    @ViewChild('selectCategoriaItem') selectCategorias!: MatSelect;
    @ViewChild('selectMarcaItem') selectMarcas!: MatSelect;

    public _unsubscribeAll: Subject<any> = new Subject<any>();

    public monedaInfo: MonedaDTO = this._securityService.getMonedaStorage();
    public currencyNumberFormat!: Intl.NumberFormat;

    public skeleton: boolean = Flags.False;
    public busquedaRealizada: boolean = false;
    public textoBusqueda: string = '';

    public allCategoriasSource: CategoriaDTO[] = [];
    public allMarcasSource: MarcaDTO[] = [];
    public allProductosSource: ProductoDTO[] = [];

    public productosFiltrados: ProductoDTO[] = [];
    public soloSinStock: boolean = false;

    public chartValorCategoria: ApexOptions = {};
    public chartTopValor: ApexOptions = {};

    public columnas: string[] = ['codigo', 'nombre', 'categoria', 'marca', 'stock', 'precioCompra', 'valorTotal'];

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _inventarioService: InventarioService,
    ) { }

    get totalProductos(): number { return this.productosFiltrados.length; }
    get totalUnidades(): number { return this.productosFiltrados.reduce((s, p) => s + (p.stock ?? 0), 0); }
    get valorizacionTotal(): number { return this.productosFiltrados.reduce((s, p) => s + ((p.stock ?? 0) * (p.precioCompra ?? 0)), 0); }
    get sinStock(): number { return this.productosFiltrados.filter(p => (p.stock ?? 0) === 0).length; }

    ngOnInit(): void {
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.skeleton = Flags.True;
        forkJoin({
            categorias: this._inventarioService.GetAllCategoriasForComboBoxAsync(),
            marcas: this._inventarioService.GetAllMarcasForComboBoxAsync(),
            productos: this._inventarioService.GetAllProductoForComboBoxAsync(),
        }).subscribe({
            next: (res) => {
                this.allCategoriasSource = res.categorias;
                this.allMarcasSource = res.marcas;
                this.allProductosSource = res.productos;
                this.aplicarFiltros();
                this.skeleton = Flags.False;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.skeleton = Flags.False;
            },
        });
    }

    aplicarFiltros(): void {
        const catSeleccionadas: number[] = this.selectCategorias
            ? this.selectCategorias.options.filter(o => o.selected && o.value !== Numeracion.Cero).map(o => o.value.id)
            : [];
        const marcasSeleccionadas: number[] = this.selectMarcas
            ? this.selectMarcas.options.filter(o => o.selected && o.value !== Numeracion.Cero).map(o => o.value.id)
            : [];
        const texto = this.textoBusqueda?.trim().toLowerCase() ?? '';

        this.productosFiltrados = this.allProductosSource.filter(p => {
            const matchCat = catSeleccionadas.length === 0 || catSeleccionadas.includes(p.categoria?.id);
            const matchMarca = marcasSeleccionadas.length === 0 || marcasSeleccionadas.includes(p.marca?.id);
            const matchTexto = !texto || p.nombre?.toLowerCase().includes(texto) || p.codigo?.toLowerCase().includes(texto);
            const matchSinStock = !this.soloSinStock || (p.stock ?? 0) === 0;
            return matchCat && matchMarca && matchTexto && matchSinStock;
        });

        this.busquedaRealizada = true;
        this.generarGraficos();
    }

    buscar(): void { this.aplicarFiltros(); }

    generarGraficos(): void {
        this.generarChartValorCategoria();
        this.generarChartTopValor();
    }

    generarChartValorCategoria(): void {
        const catMap = new Map<string, number>();
        for (const p of this.productosFiltrados) {
            const cat = p.categoria?.nombre ?? 'Sin categoría';
            catMap.set(cat, (catMap.get(cat) ?? 0) + ((p.stock ?? 0) * (p.precioCompra ?? 0)));
        }
        const labels = Array.from(catMap.keys());
        const series = Array.from(catMap.values());
        const total = series.reduce((a, b) => a + b, 0);
        const cf = this.currencyNumberFormat;

        this.chartValorCategoria = {
            chart: { type: 'donut', fontFamily: 'inherit', foreColor: 'inherit', height: '95%' },
            labels,
            series,
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
            tooltip: { enabled: true, y: { formatter: (val: number) => cf.format(val) } },
            dataLabels: { enabled: true },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            name: { show: false },
                            value: {
                                show: true, fontSize: '22px', color: '#494949', offsetY: 0,
                                formatter: () => cf.format(total),
                            },
                            total: {
                                show: true, showAlways: true, label: '', fontSize: '22px', color: '#494949',
                                formatter: () => cf.format(total),
                            },
                        },
                    },
                },
            },
            responsive: [{ breakpoint: 600, options: { chart: { width: '100%', height: 350 }, legend: { position: 'bottom' } } }],
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000000', fontSize: '14px' } },
        };
    }

    generarChartTopValor(): void {
        const cf = this.currencyNumberFormat;
        const top10 = [...this.productosFiltrados]
            .map(p => ({ nombre: p.nombre, valor: (p.stock ?? 0) * (p.precioCompra ?? 0) }))
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 10);

        this.chartTopValor = {
            series: [{ name: 'Valorización', data: top10.map(t => t.valor) }],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true, dataLabels: { position: 'top' } } },
            colors: ['#3B82F6'],
            dataLabels: {
                enabled: true,
                textAnchor: 'start',
                formatter: (val: number) => cf.format(val),
                offsetX: 5,
                style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' },
            },
            xaxis: { categories: top10.map(t => t.nombre), labels: { show: false } },
            tooltip: { enabled: true, y: { formatter: (val: number) => cf.format(val) } },
            noData: { text: 'Sin datos', align: 'center', verticalAlign: 'middle', style: { color: '#000000', fontSize: '14px' } },
        };
    }

    formatCurrency(val: number): string {
        return this.currencyNumberFormat?.format(val) ?? val.toString();
    }

    isMobilSize(): boolean { return this._toolService.isMobilSize(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
