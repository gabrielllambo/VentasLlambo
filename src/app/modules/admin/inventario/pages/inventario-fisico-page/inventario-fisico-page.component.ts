import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { RegistrarInventarioFisicoRequest } from 'app/core/models/inventario/inventario-fisico/request/registrar-inventario-fisico-request.model';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventario-fisico-page',
  templateUrl: './inventario-fisico-page.component.html'
})
export class InventarioFisicoPageComponent implements OnInit {

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['producto', 'stockSistema', 'cantidadFisica', 'diferencia', 'observacion', 'acciones'];

  filtroInventarioForm!: UntypedFormGroup;
  idUsuarioLogueado: string = '';

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _securityService: SecurityService
  ) {
    const token = this._securityService.getDecodetoken();
    this.idUsuarioLogueado = token?.idUsuario || '';
  }

  ngOnInit(): void {
    this.filtroInventarioForm = this._formBuilder.group({
      terminoBusqueda: ['', [Validators.required]]
    });
  }

  btnBuscar(): void {
    const busqueda = this.filtroInventarioForm.get('terminoBusqueda')?.value;

    this._inventarioService.GetAllLotesByFilterAsync({ numeroLote: busqueda } as any).subscribe(lotes => {
      if (lotes && lotes.length > 0) {
        const nuevosItems = lotes.map(l => ({
          idProducto: l.idProducto,
          idLoteProducto: l.id,
          nombreProducto: (l as any).nombreProducto || (l as any).producto,
          codigoLote: (l as any).codigoLote || (l as any).lote || 'N/A',
          cantidadSistema: (l as any).cantidadDisponible || (l as any).stock || 0,
          cantidadFisica: null,
          diferencia: -((l as any).cantidadDisponible || (l as any).stock || 0),
          observacion: ''
        }));

        this.dataSource.data = [...this.dataSource.data, ...nuevosItems];
      } else {
        Swal.fire('No encontrado', 'No hay lotes que coincidan con la búsqueda', 'warning');
      }
    });
  }

  calcularDiferencia(item: any): void {
    item.diferencia = item.cantidadFisica - item.cantidadSistema;
  }

  guardarBorrador(item: any): void {
    const request: RegistrarInventarioFisicoRequest = {
      idProducto: item.idProducto,
      idLoteProducto: item.idLoteProducto,
      cantidadFisica: Number(item.cantidadFisica),
      idUsuarioGuid: this.idUsuarioLogueado,
      observacion: item.observacion || 'Conteo rápido desde página'
    };

    this._inventarioService.RegistrarInventarioFisicoAsync(request).subscribe({
      next: (res: ResponseDTO) => {
        if (res.success) {
          Swal.fire('Guardado', 'El conteo ha sido registrado en la base de datos.', 'success');
          item.idInventarioFisico = res.value;
        } else {
          Swal.fire('Error', res.message || 'El servidor rechazó la petición', 'error');
        }
      },
      error: (err) => {
        console.error('Error al guardar borrador:', err);
        Swal.fire('Error del Sistema', 'No se pudo conectar con el servidor.', 'error');
      }
    });
  }

  // Estado visual de cada fila: guardado | ingresado | sin_contar
  getEstadoItem(item: any): 'guardado' | 'ingresado' | 'sin_contar' {
    if (item.idInventarioFisico) return 'guardado';
    if (item.cantidadFisica !== null && item.cantidadFisica !== undefined && item.cantidadFisica !== '') return 'ingresado';
    return 'sin_contar';
  }

  get totalItems(): number { return this.dataSource.data.length; }
  get itemsGuardados(): number { return this.dataSource.data.filter(i => i.idInventarioFisico).length; }
  get itemsIngresados(): number { return this.dataSource.data.filter(i => this.getEstadoItem(i) === 'ingresado').length; }
  get itemsSinContar(): number { return this.dataSource.data.filter(i => this.getEstadoItem(i) === 'sin_contar').length; }

  exportarReporte(): void {
    if (this.dataSource.data.length === 0) {
      Swal.fire('Sin datos', 'No hay información en la tabla para exportar.', 'info');
      return;
    }

    // 1. Definimos las cabeceras del reporte
    const cabeceras = ['Producto', 'Lote', 'Stock Sistema', 'Cantidad Contada', 'Diferencia', 'Motivo / Observación'];
    
    // 2. Mapeamos las filas de datos asegurándonos de usar comillas por si hay comas internas
    const filas = this.dataSource.data.map(item => [
      `"${item.nombreProducto || ''}"`,
      `"${item.codigoLote || ''}"`,
      item.cantidadSistema || 0,
      item.cantidadFisica !== null ? item.cantidadFisica : '',
      item.diferencia || 0,
      `"${item.observacion || ''}"`
    ]);

    // 3. Unimos todo en un gran texto separado por comas y saltos de línea (\n)
    const csvContent = [cabeceras.join(','), ...filas.map(f => f.join(','))].join('\n');
    
    // 4. Creamos el archivo Blob en UTF-8 (\uFEFF sirve para que Excel reconozca tildes y eñes)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 5. Forzamos la descarga nativa en el navegador
    const link = document.createElement('a');
    link.href = url;
    const fechaString = new Date().toISOString().split('T')[0];
    link.download = `Reporte_Inventario_Fisico_${fechaString}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  onFinalizarAjuste(): void {
    // Filas con cantidad ingresada pero sin guardar borrador
    const itemsOlvidados = this.dataSource.data.filter(item => this.getEstadoItem(item) === 'ingresado');
    if (itemsOlvidados.length > 0) {
      const nombres = itemsOlvidados.map(i => i.nombreProducto || 'Producto sin nombre').join(', ');
      Swal.fire({
        title: '¡Cambios sin guardar!',
        text: `Olvidaste hacer clic en el ícono de guardar para: ${nombres}. Guárdalos antes de finalizar.`,
        icon: 'warning'
      });
      return;
    }

    // Filas sin contar (cantidadFisica null)
    const itemsSinContar = this.dataSource.data.filter(item => this.getEstadoItem(item) === 'sin_contar');
    const itemsGuardados = this.dataSource.data.filter(item => item.idInventarioFisico);

    if (itemsGuardados.length === 0) {
      Swal.fire({
        title: 'No hay nada que ajustar',
        text: 'Primero debes ingresar la cantidad y hacer clic en el ícono de guardar en cada producto.',
        icon: 'info'
      });
      return;
    }

    if (itemsSinContar.length > 0) {
      const nombres = itemsSinContar.map(i => i.nombreProducto || 'Producto sin nombre').join(', ');
      Swal.fire({
        title: `${itemsSinContar.length} producto(s) sin contar`,
        html: `Los siguientes productos <strong>no fueron contados</strong> y quedarán fuera del ajuste:<br><br><em>${nombres}</em><br><br>¿Deseas continuar igualmente con los ${itemsGuardados.length} producto(s) guardados?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, ajustar solo los guardados',
        cancelButtonText: 'Volver y completar'
      }).then(result => {
        if (result.isConfirmed) {
          this.ejecutarAjuste(itemsGuardados);
        }
      });
      return;
    }

    Swal.fire({
      title: '¿Finalizar Inventario?',
      text: `Vas a ajustar el stock de ${itemsGuardados.length} producto(s). ¡No se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ajustar stock'
    }).then(result => {
      if (result.isConfirmed) {
        this.ejecutarAjuste(itemsGuardados);
      }
    });
  }

  private ejecutarAjuste(itemsGuardados: any[]): void {
    const peticiones = itemsGuardados.map(item =>
      this._inventarioService.AjustarInventarioFisicoAsync(item.idInventarioFisico, this.idUsuarioLogueado)
    );

    forkJoin(peticiones).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'El stock ha sido actualizado.', 'success');
        this.dataSource.data = [];
      },
      error: (err) => {
        console.error('Error al ajustar stock:', err);
        Swal.fire('Error', 'Hubo un problema al ajustar el stock. Intenta de nuevo.', 'error');
      }
    });
  }
}
