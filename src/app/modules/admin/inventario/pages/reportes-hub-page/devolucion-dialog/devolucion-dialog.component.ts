import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { DevolucionService } from 'app/core/services/devolucion/devolucion.service';
import { RegistrarDevolucionRequest } from 'app/core/models/inventario/devolucion/request/registrar-devolucion-request.model';

export interface DevolucionDialogData {
    idLote: number;
    nombreProducto: string;
    stockDisponible: number;
    fechaVencimiento: Date | null;
}

@Component({
    selector: 'app-devolucion-dialog',
    templateUrl: './devolucion-dialog.component.html',
})
export class DevolucionDialogComponent implements OnInit {

    form!: UntypedFormGroup;
    loading = false;

    readonly MOTIVOS = [
        { value: 'vencimiento', label: 'Producto vencido' },
        { value: 'defecto',     label: 'Defecto / daño'  },
        { value: 'otro',        label: 'Otro motivo'     },
    ];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DevolucionDialogData,
        private _dialogRef: MatDialogRef<DevolucionDialogComponent>,
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _toolService: ToolService,
        private _devolucionService: DevolucionService,
    ) { }

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            cantidadDevuelta: [
                this.data.stockDisponible,
                [Validators.required, Validators.min(1), Validators.max(this.data.stockDisponible)],
            ],
            motivo: ['vencimiento', Validators.required],
            observacion: [''],
        });
    }

    confirmar(): void {
        if (this.form.invalid) return;
        this.loading = true;

        const req = new RegistrarDevolucionRequest();
        req.idLote = this.data.idLote;
        req.cantidadDevuelta = this.form.get('cantidadDevuelta')!.value;
        req.motivo = this.form.get('motivo')!.value;
        req.observacion = this.form.get('observacion')!.value ?? '';
        req.idUsuarioGuid = this._securityService.getDecodetoken().idUsuario;

        this._devolucionService.RegistrarAsync(req).subscribe({
            next: (res) => {
                this.loading = false;
                if (res?.success) {
                    this._toolService.showSuccess('Devolución registrada correctamente.', 'Éxito');
                    this._dialogRef.close(true);
                } else {
                    this._toolService.showError(res?.message ?? DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                }
            },
            error: () => {
                this.loading = false;
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            },
        });
    }

    cancelar(): void {
        this._dialogRef.close(false);
    }
}
