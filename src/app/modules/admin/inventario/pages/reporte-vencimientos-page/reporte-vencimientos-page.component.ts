import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { Flags } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { LoteDTO } from 'app/core/models/inventario/lote/response/lote-dto-request.model';
import { ObtenerLoteRequest } from 'app/core/models/inventario/lote/request/obtener-lotes-request.model';
import { MatDialog } from '@angular/material/dialog';
import { DevolucionDialogComponent } from '../reportes-hub-page/devolucion-dialog/devolucion-dialog.component';

export type EstadoVencimiento = 'vencido' | 'critico' | 'alerta' | 'vigente' | 'sin_fecha';

export interface LoteConEstado extends Omit<LoteDTO, 'estado'> {
    diasParaVencer: number | null;
    estado: EstadoVencimiento;
}

@Component({
    selector: 'app-reporte-vencimientos-page',
    templateUrl: './reporte-vencimientos-page.component.html',
    styleUrl: './reporte-vencimientos-page.component.scss',
})
export class ReporteVencimientosPageComponent implements OnInit, OnDestroy {

    public _unsubscribeAll: Subject<any> = new Subject<any>();

    public skeleton: boolean = Flags.False;

    public todosLosLotes: LoteConEstado[] = [];
    public lotesFiltrados: LoteConEstado[] = [];

    public filtroEstado: string = 'todos';

    public columnas: string[] = ['producto', 'proveedor', 'lote', 'fechaVencimiento', 'diasParaVencer', 'stock', 'estado', 'acciones'];

    constructor(
        private _toolService: ToolService,
        private _inventarioService: InventarioService,
        private _securityService: SecurityService,
        private _dialog: MatDialog,
    ) { }

    get totalVencidos(): number { return this.todosLosLotes.filter(l => l.estado === 'vencido').length; }
    get totalCriticos(): number { return this.todosLosLotes.filter(l => l.estado === 'critico').length; }
    get totalAlerta(): number { return this.todosLosLotes.filter(l => l.estado === 'alerta').length; }
    get totalVigentes(): number { return this.todosLosLotes.filter(l => l.estado === 'vigente').length; }

    ngOnInit(): void {
        this.cargarLotes();
    }

    cargarLotes(): void {
        this.skeleton = Flags.True;
        const req = new ObtenerLoteRequest();
        req.idUsuario = this._securityService.getDecodetoken().idUsuario;
        req.nombre = '';
        this._inventarioService.GetAllLotesByFilterAsync(req).subscribe({
            next: (lotes: LoteDTO[]) => {
                this.todosLosLotes = lotes.map(l => this.clasificarLote(l));
                this.aplicarFiltro();
                this.skeleton = Flags.False;
            },
            error: () => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.skeleton = Flags.False;
            },
        });
    }

    clasificarLote(lote: LoteDTO): LoteConEstado {
        if (!lote.fechaCaducidad) {
            return { ...lote, diasParaVencer: null, estado: 'sin_fecha' };
        }
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fv = new Date(lote.fechaCaducidad);
        fv.setHours(0, 0, 0, 0);
        const dias = Math.floor((fv.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        let estado: EstadoVencimiento;
        if (dias < 0)    estado = 'vencido';
        else if (dias <= 5)  estado = 'critico';
        else if (dias <= 15) estado = 'alerta';
        else estado = 'vigente';

        return { ...lote, diasParaVencer: dias, estado };
    }

    aplicarFiltro(): void {
        if (this.filtroEstado === 'todos') {
            this.lotesFiltrados = this.todosLosLotes;
        } else {
            this.lotesFiltrados = this.todosLosLotes.filter(l => l.estado === this.filtroEstado);
        }
    }

    setFiltro(estado: string): void {
        this.filtroEstado = estado;
        this.aplicarFiltro();
    }

    getRowClass(estado: string): string {
        switch (estado) {
            case 'vencido': return 'bg-red-50 dark:bg-red-900/20';
            case 'critico': return 'bg-orange-50 dark:bg-orange-900/20';
            case 'alerta': return 'bg-yellow-50 dark:bg-yellow-900/20';
            case 'vigente': return 'bg-green-50 dark:bg-green-900/20';
            default: return '';
        }
    }

    getBadgeClass(estado: string): string {
        switch (estado) {
            case 'vencido': return 'bg-red-100 text-red-700';
            case 'critico': return 'bg-orange-100 text-orange-700';
            case 'alerta': return 'bg-yellow-100 text-yellow-700';
            case 'vigente': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    getBadgeLabel(estado: string): string {
        switch (estado) {
            case 'vencido': return 'Vencido';
            case 'critico': return 'Crítico';
            case 'alerta': return 'Alerta';
            case 'vigente': return 'Vigente';
            default: return 'Sin fecha';
        }
    }

    formatFecha(fecha: Date | null): string {
        if (!fecha) return '—';
        return this._toolService.formatoFecha(fecha);
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
            if (registrado) this.cargarLotes();
        });
    }

    isMobilSize(): boolean { return this._toolService.isMobilSize(); }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
