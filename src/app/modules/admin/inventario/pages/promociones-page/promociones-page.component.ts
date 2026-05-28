import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { PromocionDTO, PromocionService } from 'app/core/services/promocion/promocion.service';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-promociones-page',
    templateUrl: './promociones-page.component.html',
    styleUrl: './promociones-page.component.scss',
})
export class PromocionesPageComponent implements OnInit {

    form!: UntypedFormGroup;
    allProductos: ProductoDTO[] = [];
    promociones: PromocionDTO[] = [];
    tabActual = 0;
    loadingProductos = false;
    modoEdicion = false;
    promoEditandoId: string | null = null;
    busquedaProducto = '';

    minDate: Date;
    maxDate: Date;

    constructor(
        private _fb: UntypedFormBuilder,
        private _promocionService: PromocionService,
        private _inventarioService: InventarioService,
        private _toolService: ToolService,
    ) {
        this.minDate = this._toolService.getMinDateFIlter();
        this.maxDate = this._toolService.getMaxDateFIlter();
    }

    ngOnInit(): void {
        this.initForm();
        this.loadProductos();
        this.loadPromociones();
    }

    initForm(): void {
        this.form = this._fb.group({
            motivo:               ['', [Validators.required, Validators.maxLength(200)]],
            descuentoPorcentaje:  [null, [Validators.required, Validators.min(1), Validators.max(100)]],
            fechaInicio:          [new Date(), [Validators.required]],
            fechaFin:             [null, [Validators.required]],
            productos:            [[], [Validators.required, Validators.minLength(1)]],
        });
    }

    loadProductos(): void {
        this.loadingProductos = true;
        this._inventarioService.GetAllProductoForComboBoxAsync().subscribe({
            next: (productos) => {
                this.allProductos = productos;
                this.loadingProductos = false;
            },
            error: () => { this.loadingProductos = false; },
        });
    }

    loadPromociones(): void {
        this.promociones = this._promocionService.getAll();
    }

    guardar(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const v = this.form.value;
        const productosSeleccionados: ProductoDTO[] = v.productos;

        if (!productosSeleccionados || productosSeleccionados.length === 0) {
            this._toolService.showError('Selecciona al menos un producto.', 'Atención');
            return;
        }

        const fechaInicio = new Date(v.fechaInicio);
        const fechaFin = new Date(v.fechaFin);
        if (fechaFin < fechaInicio) {
            this._toolService.showError('La fecha fin debe ser mayor o igual a la fecha inicio.', 'Atención');
            return;
        }

        const payload = {
            motivo: v.motivo.trim(),
            descuentoPorcentaje: +v.descuentoPorcentaje,
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: fechaFin.toISOString(),
            productos: productosSeleccionados.map(p => ({
                id: p.id,
                nombre: p.nombre,
                urlFoto: p.urlFoto,
                codigo: p.codigo,
            })),
        };

        const resetForm = () => {
            this.busquedaProducto = '';
            this.form.reset({ motivo: '', descuentoPorcentaje: null, fechaInicio: new Date(), fechaFin: null, productos: [] });
        };

        if (this.modoEdicion && this.promoEditandoId) {
            this._promocionService.actualizar(this.promoEditandoId, payload);
            this.modoEdicion = false;
            this.promoEditandoId = null;
            resetForm();
            this.loadPromociones();
            this.tabActual = 1;
            Swal.fire({ title: '¡Promoción actualizada!', text: 'Los cambios fueron guardados.', icon: 'success', timer: 1800, showConfirmButton: false });
        } else {
            this._promocionService.crear(payload);
            resetForm();
            this.loadPromociones();
            this.tabActual = 1;
            Swal.fire({ title: '¡Promoción creada!', text: 'La promoción fue guardada y está activa.', icon: 'success', timer: 1800, showConfirmButton: false });
        }
    }

    editar(promo: PromocionDTO, event: Event): void {
        event.stopPropagation();
        this.promoEditandoId = promo.id;
        this.modoEdicion = true;
        const productosSeleccionados = promo.productos
            .map(pp => this.allProductos.find(p => p.id === pp.id))
            .filter((p): p is ProductoDTO => !!p);
        this.form.setValue({
            motivo: promo.motivo,
            descuentoPorcentaje: promo.descuentoPorcentaje,
            fechaInicio: new Date(promo.fechaInicio),
            fechaFin: new Date(promo.fechaFin),
            productos: productosSeleccionados,
        });
        this.tabActual = 0;
    }

    cancelarEdicion(): void {
        this.modoEdicion = false;
        this.promoEditandoId = null;
        this.busquedaProducto = '';
        this.form.reset({ motivo: '', descuentoPorcentaje: null, fechaInicio: new Date(), fechaFin: null, productos: [] });
    }

    get productosFiltrados(): ProductoDTO[] {
        const q = this.busquedaProducto.trim().toLowerCase();
        if (!q) return this.allProductos;
        return this.allProductos.filter(p =>
            (p.nombre ?? '').toLowerCase().includes(q) ||
            (p.codigo ?? '').toLowerCase().includes(q)
        );
    }

    isProductoSeleccionado(p: ProductoDTO): boolean {
        const sel: ProductoDTO[] = this.form.get('productos')?.value ?? [];
        return sel.some(s => s.id === p.id);
    }

    toggleProducto(p: ProductoDTO): void {
        const sel: ProductoDTO[] = [...(this.form.get('productos')?.value ?? [])];
        const idx = sel.findIndex(s => s.id === p.id);
        if (idx !== -1) sel.splice(idx, 1);
        else sel.push(p);
        this.form.get('productos')?.setValue(sel);
        this.form.get('productos')?.markAsTouched();
    }

    toggleActivo(promo: PromocionDTO, event: Event): void {
        event.stopPropagation();
        this._promocionService.toggleActivo(promo.id);
        this.loadPromociones();
    }

    eliminar(promo: PromocionDTO, event: Event): void {
        event.stopPropagation();
        Swal.fire({
            title: '¿Eliminar promoción?',
            html: `Se eliminará <strong>"${promo.motivo}"</strong>. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then(r => {
            if (!r.isConfirmed) return;
            this._promocionService.eliminar(promo.id);
            this.loadPromociones();
            Swal.fire({ title: 'Eliminada', text: 'La promoción fue eliminada.', icon: 'success', timer: 1500, showConfirmButton: false });
        });
    }

    getEstado(promo: PromocionDTO): 'activa' | 'inactiva' | 'vencida' | 'pendiente' {
        return this._promocionService.getEstado(promo);
    }

    get promocionesActivas(): PromocionDTO[] {
        return this.promociones.filter(p => this.getEstado(p) === 'activa');
    }

    get promocionesVigentes(): PromocionDTO[] {
        return this.promociones.filter(p => this.getEstado(p) !== 'vencida');
    }

    get promocionesHistorial(): PromocionDTO[] {
        return this.promociones;
    }

    formatFecha(fechaStr: string): string {
        return this._toolService.formatoFecha(new Date(fechaStr));
    }

    onTabChange(index: number): void {
        this.tabActual = index;
        this.loadPromociones();
    }

    trackById(_: number, item: any): any { return item.id; }
}
