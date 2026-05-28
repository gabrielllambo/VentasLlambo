import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { Flags } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { DetalleVentaService } from 'app/core/services/detalleventa/detalleventa.service';
import { PromocionService, PromocionDTO } from 'app/core/services/promocion/promocion.service';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { ObtenerReporteProductoRequest } from 'app/core/models/venta/request/obtener-reporte-producto-request.model';
import { ApexOptions } from 'ng-apexcharts';

export interface PromocionConImpacto extends PromocionDTO {
    estado: string;
    ventasDurantePeriodo: number;
    descuentoPromedio: number;
    ahorroEstimado: number;
    productosConPrecio: { nombre: string; precioOriginal: number; precioConDescuento: number; }[];
}

@Component({
    selector: 'app-reporte-descuentos-page',
    templateUrl: './reporte-descuentos-page.component.html',
    styleUrl: './reporte-descuentos-page.component.scss',
})
export class ReporteDescuentosPageComponent implements OnInit, OnDestroy {

    public _unsubscribeAll: Subject<any> = new Subject<any>();

    public monedaInfo: MonedaDTO = this._securityService.getMonedaStorage();
    public currencyNumberFormat!: Intl.NumberFormat;

    public skeleton: boolean = Flags.False;

    public promociones: PromocionConImpacto[] = [];
    public promocionesFiltradas: PromocionConImpacto[] = [];
    public filtroEstado: string = 'todos';
    public expandedId: string | null = null;

    public chartDescuentos: ApexOptions = {};

    public columnas: string[] = ['motivo', 'periodo', 'descuento', 'productos', 'ahorroEstimado', 'estado'];

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _inventarioService: InventarioService,
        private _promocionService: PromocionService,
    ) { }

    get totalPromociones(): number { return this.promociones.length; }
    get activasHoy(): number { return this.promociones.filter(p => p.estado === 'activa').length; }
    get descuentoPromedio(): number {
        return this.promociones.length > 0
            ? this.promociones.reduce((s, p) => s + p.descuentoPorcentaje, 0) / this.promociones.length
            : 0;
    }
    get totalProductosEnPromo(): number {
        const ids = new Set<number>();
        this.promociones.filter(p => p.estado === 'activa').forEach(p => p.productos.forEach(pr => ids.add(pr.id)));
        return ids.size;
    }

    ngOnInit(): void {
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.skeleton = Flags.True;
        this._inventarioService.GetAllProductoForComboBoxAsync().subscribe({
            next: (productos: ProductoDTO[]) => {
                const precioMap = new Map<number, number>();
                productos.forEach(p => precioMap.set(p.id, p.precioVenta ?? 0));

                const promos = this._promocionService.getAll();
                this.promociones = promos.map(promo => {
                    const estado = this._promocionService.getEstado(promo);
                    const productosConPrecio = promo.productos.map(pr => ({
                        nombre: pr.nombre,
                        precioOriginal: precioMap.get(pr.id) ?? 0,
                        precioConDescuento: (precioMap.get(pr.id) ?? 0) * (1 - promo.descuentoPorcentaje / 100),
                    }));
                    const ahorroEstimado = productosConPrecio.reduce((s, p) =>
                        s + (p.precioOriginal - p.precioConDescuento), 0);

                    return {
                        ...promo,
                        estado,
                        ventasDurantePeriodo: 0,
                        descuentoPromedio: promo.descuentoPorcentaje,
                        ahorroEstimado,
                        productosConPrecio,
                    } as PromocionConImpacto;
                });

                this.aplicarFiltro();
                this.generarChart();
                this.skeleton = Flags.False;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.skeleton = Flags.False;
            },
        });
    }

    aplicarFiltro(): void {
        this.promocionesFiltradas = this.filtroEstado === 'todos'
            ? this.promociones
            : this.promociones.filter(p => p.estado === this.filtroEstado);
    }

    setFiltro(v: string): void { this.filtroEstado = v; this.aplicarFiltro(); }

    toggleExpand(id: string): void {
        this.expandedId = this.expandedId === id ? null : id;
    }

    generarChart(): void {
        const labels = this.promociones.map(p => p.motivo);
        const series = this.promociones.map(p => p.descuentoPorcentaje);

        this.chartDescuentos = {
            series: [{ name: 'Descuento (%)', data: series }],
            chart: { type: 'bar', height: 300, toolbar: { show: false } },
            plotOptions: { bar: { barHeight: '100%', distributed: true, horizontal: true } },
            colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
            dataLabels: {
                enabled: true,
                textAnchor: 'start',
                formatter: (val: number) => `${val}%`,
                offsetX: 5,
                style: { colors: ['#374151'], fontSize: '11px', fontWeight: 'bold' },
            },
            xaxis: { categories: labels, labels: { show: false } },
            tooltip: { y: { formatter: (v: number) => `${v}% descuento` } },
            noData: { text: 'Sin promociones creadas', align: 'center', verticalAlign: 'middle', style: { color: '#000', fontSize: '14px' } },
        };
    }

    getEstadoBadge(estado: string): string {
        switch (estado) {
            case 'activa': return 'bg-green-100 text-green-700';
            case 'pendiente': return 'bg-blue-100 text-blue-700';
            case 'vencida': return 'bg-gray-100 text-gray-600';
            default: return 'bg-red-100 text-red-700';
        }
    }

    getEstadoLabel(estado: string): string {
        switch (estado) {
            case 'activa': return 'Activa';
            case 'pendiente': return 'Pendiente';
            case 'vencida': return 'Vencida';
            default: return 'Inactiva';
        }
    }

    formatCurrency(v: number): string { return this.currencyNumberFormat?.format(v) ?? v.toString(); }
    formatFecha(f: string): string { return this._toolService.formatoFecha(new Date(f)); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
