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

export interface ProductoSinMovimiento extends ProductoDTO {
    valorInmovilizado: number;
}

@Component({
    selector: 'app-reporte-sin-movimiento-page',
    templateUrl: './reporte-sin-movimiento-page.component.html',
    styleUrl: './reporte-sin-movimiento-page.component.scss',
})
export class ReporteSinMovimientoPageComponent implements OnInit, OnDestroy {

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
    public textoBusqueda: string = '';

    public productosSinMovimiento: ProductoSinMovimiento[] = [];
    public productosFiltrados: ProductoSinMovimiento[] = [];

    public columnas: string[] = ['nombre', 'categoria', 'marca', 'stock', 'precioVenta', 'valorInmovilizado'];

    constructor(
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _formBuilder: UntypedFormBuilder,
        private _inventarioService: InventarioService,
        private _detalleVentaService: DetalleVentaService,
    ) { }

    get totalSinMovimiento(): number { return this.productosSinMovimiento.length; }
    get stockInmovilizado(): number { return this.productosSinMovimiento.reduce((s, p) => s + (p.stock ?? 0), 0); }
    get valorInmovilizado(): number { return this.productosSinMovimiento.reduce((s, p) => s + p.valorInmovilizado, 0); }

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
                const nombresConVentas = new Set(ventas.distribucionVentasProducto.nombreProductos);
                this.productosSinMovimiento = productos
                    .filter(p => !nombresConVentas.has(p.nombre) && p.activo)
                    .map(p => ({
                        ...p,
                        valorInmovilizado: (p.stock ?? 0) * (p.precioVenta ?? 0),
                    } as ProductoSinMovimiento))
                    .sort((a, b) => b.valorInmovilizado - a.valorInmovilizado);

                this.filtrar();
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

    filtrar(): void {
        const txt = this.textoBusqueda.trim().toLowerCase();
        this.productosFiltrados = txt
            ? this.productosSinMovimiento.filter(p =>
                p.nombre?.toLowerCase().includes(txt) ||
                p.categoria?.nombre?.toLowerCase().includes(txt))
            : [...this.productosSinMovimiento];
    }

    formatCurrency(v: number): string { return this.currencyNumberFormat?.format(v) ?? v.toString(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
