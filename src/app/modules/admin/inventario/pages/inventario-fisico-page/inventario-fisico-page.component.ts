import { Component, OnInit } from '@angular/core';

export interface TomaFisicaGrupo {
  nombre: string;
  fecha: Date;
  totalProductos: number;
  totalAjustados: number;
  estado: 'Finalizado' | 'En Proceso' | 'Pendiente';
  registros: any[];
  expandido: boolean;
}

import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { RegistrarInventarioFisicoRequest } from 'app/core/models/inventario/inventario-fisico/request/registrar-inventario-fisico-request.model';
import { ObtenerHistorialInventarioFisicoRequest } from 'app/core/models/inventario/inventario-fisico/request/obtener-historial-inventario-fisico-request.model';
import { HistorialInventarioFisicoDTO } from 'app/core/models/inventario/inventario-fisico/response/historial-inventario-fisico-dto.model';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventario-fisico-page',
  templateUrl: './inventario-fisico-page.component.html'
})
export class InventarioFisicoPageComponent implements OnInit {

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  tabActual: number = 0;

  // ── Nueva Toma (pasos) ────────────────────────────────────────────────────────
  paso: 1 | 2 | 3 = 1;
  esContinuacion: boolean = false;
  modoAgregarProductos: boolean = false;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['producto', 'vencimiento', 'stockSistema', 'cantidadFisica', 'diferencia', 'observacion', 'acciones'];

  maestroForm!: UntypedFormGroup;
  filtroForm!: UntypedFormGroup;

  idUsuarioLogueado: string = '';
  allCategorias: CategoriaDTO[] = [];

  skeleton: boolean = false;
  minDate: Date;
  maxDate: Date;

  maestroData: { fecha: any; motivo: string } = { fecha: null, motivo: '' };

  // ── Registros (historial agrupado) ───────────────────────────────────────────
  tomasGrupos: TomaFisicaGrupo[] = [];
  detalleColumns: string[] = ['nombreProducto', 'numeroLote', 'stockSistema', 'cantidadFisica', 'diferencia', 'estado'];

  // ── Continuar toma: productos ya ajustados ────────────────────────────────────
  productosAjustadosContinuacion: any[] = [];
  ajustadosColumns: string[] = ['adjProd', 'adjLote', 'adjStock', 'adjFisica', 'adjDiferencia'];

  historialForm!: UntypedFormGroup;
  skeletonHistorial: boolean = false;
  monedaInfo: MonedaDTO;
  currencyFormat!: Intl.NumberFormat;

  // ── Reportes ─────────────────────────────────────────────────────────────────
  reporteForm!: UntypedFormGroup;
  reporteGrupos: TomaFisicaGrupo[] = [];
  skeletonReporte: boolean = false;
  reporteResumen = { totalTomas: 0, totalProductos: 0, totalAjustados: 0, totalValorPerdido: 0 };
  detalleReporteColumns: string[] = ['nombreProducto', 'numeroLote', 'stockSistema', 'cantidadFisica', 'diferencia', 'precioCompra', 'valorPerdida', 'estado'];

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _securityService: SecurityService,
    private _toolService: ToolService
  ) {
    const token = this._securityService.getDecodetoken();
    this.idUsuarioLogueado = token?.idUsuario || '';
    this.minDate   = this._toolService.getMinDateFIlter();
    this.maxDate   = this._toolService.getMaxDateFIlter();
    this.monedaInfo = this._securityService.getMonedaStorage();
  }

  ngOnInit(): void {
    this.initForms();
    this.loadCombos();
    if (this.monedaInfo) {
      this.currencyFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    }
    this.loadHistorial();
  }

  private initForms(): void {
    this.maestroForm = this._formBuilder.group({
      fechaTomaFisica:  [new Date(), [Validators.required]],
      motivoTomaFisica: ['', [Validators.required]],
    });

    this.filtroForm = this._formBuilder.group({
      fechaVencimientoInicio: [null],
      fechaVencimientoFin:    [null],
      categorias: [[]],
    });

    this.historialForm = this._formBuilder.group({
      fecha:     [null],
      nombre:    [''],
      categoria: [[]],
    });

    this.reporteForm = this._formBuilder.group({
      fechaInicio:   [this._toolService.getStartDateOfMonth()],
      fechaFin:      [this._toolService.getEndDateOfMonth()],
      nombre:        [''],
      soloAjustados: [false],
    });
  }

  private loadCombos(): void {
    this._inventarioService.GetAllCategoriasForComboBoxAsync().subscribe({
      next: (categorias) => { this.allCategorias = categorias; },
      error: () => {}
    });
  }

  onTabChange(index: number): void {
    this.tabActual = index;
    if (index === 1 && this.tomasGrupos.length === 0) {
      this.loadHistorial();
    }
    if (index === 2 && this.reporteGrupos.length === 0) {
      this.loadReporte();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // HISTORIAL
  // ══════════════════════════════════════════════════════════════════════════════

  loadHistorial(): void {
    this.skeletonHistorial = true;
    const request = this.buildHistorialRequest();

    this._inventarioService.GetHistorialInventarioFisicoAsync(request).subscribe({
      next: (res) => {
        this.tomasGrupos = this.agruparPorToma(res?.lstHistorial ?? []);
        this.skeletonHistorial = false;
      },
      error: () => {
        this.skeletonHistorial = false;
      }
    });
  }

  private agruparPorToma(registros: HistorialInventarioFisicoDTO[]): TomaFisicaGrupo[] {
    const mapa = new Map<string, HistorialInventarioFisicoDTO[]>();

    for (const r of registros) {
      const fecha = new Date(r.fechaRegistro).toISOString().split('T')[0];
      const nombre = r.nombreRegistro?.trim() || r.motivo?.trim() || 'Sin nombre';
      const clave = `${fecha}|${nombre}`;
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave)!.push(r);
    }

    const grupos: TomaFisicaGrupo[] = [];
    mapa.forEach((items, clave) => {
      const [fechaStr, nombre] = clave.split('|');
      const totalProductos = items.length;
      const totalAjustados = items.filter(i => i.ajustado).length;
      let estado: 'Finalizado' | 'En Proceso' | 'Pendiente';
      if (totalAjustados === totalProductos) estado = 'Finalizado';
      else if (totalAjustados > 0)           estado = 'En Proceso';
      else                                    estado = 'Pendiente';

      grupos.push({
        nombre,
        fecha: new Date(fechaStr + 'T00:00:00'),
        totalProductos,
        totalAjustados,
        estado,
        registros: items,
        expandido: false,
      });
    });

    return grupos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  toggleGrupo(grupo: TomaFisicaGrupo): void {
    grupo.expandido = !grupo.expandido;
  }

  eliminarGrupo(grupo: TomaFisicaGrupo): void {
    const eliminables = grupo.registros.filter(r => !r.ajustado);
    if (eliminables.length === 0) {
      Swal.fire('No eliminable', 'Todos los registros de esta toma ya fueron ajustados.', 'info');
      return;
    }

    Swal.fire({
      title: '¿Eliminar toma física?',
      html: `Se eliminarán <strong>${eliminables.length}</strong> registro(s) de "<em>${grupo.nombre}</em>". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;

      forkJoin(eliminables.map(r => this._inventarioService.EliminarInventarioFisicoAsync(r.idInventarioFisico)))
        .subscribe({
          next: () => {
            Swal.fire({ title: 'Eliminado', text: 'La toma física fue eliminada.', icon: 'success', timer: 1500, showConfirmButton: false });
            this.loadHistorial();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar. Intenta de nuevo.', 'error'),
        });
    });
  }

  continuarToma(grupo: TomaFisicaGrupo): void {
    this.maestroData = { fecha: grupo.fecha, motivo: grupo.nombre };

    // Recuperar lotes del filtro original guardados en localStorage
    const filtroItems = this._loadFiltroStorage(grupo.nombre);

    // Mapa rápido: codigoLote → registro historial
    const histMap = new Map<string, HistorialInventarioFisicoDTO>();
    for (const r of grupo.registros) histMap.set(r.numeroLote, r);

    let merged: any[];

    if (filtroItems.length > 0) {
      const lotesUsados = new Set<string>();
      merged = filtroItems.map(fi => {
        const hist = histMap.get(fi.codigoLote);
        lotesUsados.add(fi.codigoLote);
        if (hist) {
          return {
            idProducto:          fi.idProducto,
            idLoteProducto:      fi.idLoteProducto,
            nombreProducto:      fi.nombreProducto,
            codigoLote:          fi.codigoLote,
            fechaVencimiento:    fi.fechaVencimiento,
            cantidadSistema:     hist.stockSistema,
            cantidadFisica:      hist.cantidadFisica,
            diferencia:          hist.diferencia,
            observacion:         '',
            idInventarioFisico:  null,
            idBorradorExistente: hist.ajustado ? null : hist.idInventarioFisico,
            yaAjustado:          hist.ajustado,
          };
        }
        // Producto del filtro que nunca fue guardado → aparece como Sin contar
        return {
          idProducto:          fi.idProducto,
          idLoteProducto:      fi.idLoteProducto,
          nombreProducto:      fi.nombreProducto,
          codigoLote:          fi.codigoLote,
          fechaVencimiento:    fi.fechaVencimiento,
          cantidadSistema:     fi.cantidadSistema,
          cantidadFisica:      null,
          diferencia:          -fi.cantidadSistema,
          observacion:         '',
          idInventarioFisico:  null,
          idBorradorExistente: null,
          yaAjustado:          false,
        };
      });
      // Registros del historial que no estaban en el filtro guardado
      for (const [lote, hist] of histMap) {
        if (!lotesUsados.has(lote)) {
          merged.push({
            idProducto:          null,
            idLoteProducto:      null,
            nombreProducto:      hist.nombreProducto,
            codigoLote:          hist.numeroLote,
            fechaVencimiento:    null,
            cantidadSistema:     hist.stockSistema,
            cantidadFisica:      hist.cantidadFisica,
            diferencia:          hist.diferencia,
            observacion:         '',
            idInventarioFisico:  null,
            idBorradorExistente: hist.ajustado ? null : hist.idInventarioFisico,
            yaAjustado:          hist.ajustado,
          });
        }
      }
    } else {
      // Sin datos en localStorage: solo registros del historial (comportamiento anterior)
      merged = grupo.registros.map(r => ({
        idProducto:          null,
        idLoteProducto:      null,
        nombreProducto:      r.nombreProducto,
        codigoLote:          r.numeroLote,
        fechaVencimiento:    null,
        cantidadSistema:     r.stockSistema,
        cantidadFisica:      r.cantidadFisica,
        diferencia:          r.diferencia,
        observacion:         '',
        idInventarioFisico:  null,
        idBorradorExistente: r.ajustado ? null : r.idInventarioFisico,
        yaAjustado:          r.ajustado,
      }));
    }

    this.dataSource.data = merged;
    this.productosAjustadosContinuacion = [];
    this.esContinuacion = true;
    this.paso = 3;
    this.tabActual = 0;
  }

  private _saveFiltroStorage(motivo: string, items: any[]): void {
    try {
      const data = items.map(i => ({
        idProducto:      i.idProducto,
        idLoteProducto:  i.idLoteProducto,
        nombreProducto:  i.nombreProducto,
        codigoLote:      i.codigoLote,
        fechaVencimiento: i.fechaVencimiento,
        cantidadSistema: i.cantidadSistema,
      }));
      localStorage.setItem(`vl_toma_filtro_${motivo}`, JSON.stringify(data));
    } catch {}
  }

  private _loadFiltroStorage(motivo: string): any[] {
    try {
      const raw = localStorage.getItem(`vl_toma_filtro_${motivo}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private _clearFiltroStorage(motivo: string): void {
    try { localStorage.removeItem(`vl_toma_filtro_${motivo}`); } catch {}
  }

  private buildHistorialRequest(): ObtenerHistorialInventarioFisicoRequest {
    const v = this.historialForm.value;
    const request = new ObtenerHistorialInventarioFisicoRequest();
    request.destinationTimeZoneId = this._toolService.getTimeZone();
    request.idUsuario    = this.idUsuarioLogueado;
    if (v.fecha) {
      request.fechaInicio = new Date(v.fecha);
      request.fechaFin    = new Date(v.fecha);
    } else {
      request.fechaInicio = this._toolService.getStartDateOfMonth();
      request.fechaFin    = this._toolService.getEndDateOfMonth();
    }
    request.soloPerdidas  = false;
    request.lstCategorias = (v.categoria as CategoriaDTO[] || []).map(c => c.id);
    request.lstMarcas     = [];
    request.lstProductos  = [];
    return request;
  }

  get tomasGruposFiltrados(): TomaFisicaGrupo[] {
    const texto = (this.historialForm?.get('nombre')?.value || '').toLowerCase().trim();
    if (!texto) return this.tomasGrupos;
    return this.tomasGrupos.filter(g => g.nombre.toLowerCase().includes(texto));
  }

  get totalAjustados():  number { return this.tomasGruposFiltrados.filter(g => g.estado === 'Finalizado').length; }
  get totalPendientes(): number { return this.tomasGruposFiltrados.filter(g => g.estado !== 'Finalizado').length; }

  formatCurrency(value: number): string {
    return this.currencyFormat ? this.currencyFormat.format(value) : `${value}`;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NUEVA TOMA — PASO 1 → 2
  // ══════════════════════════════════════════════════════════════════════════════

  crearRegistro(): void {
    if (this.maestroForm.invalid) {
      this.maestroForm.markAllAsTouched();
      return;
    }
    this.esContinuacion = false;
    this.maestroData = {
      fecha:  this.maestroForm.get('fechaTomaFisica')?.value,
      motivo: this.maestroForm.get('motivoTomaFisica')?.value,
    };
    this.paso = 2;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // NUEVA TOMA — PASO 2 → 3
  // ══════════════════════════════════════════════════════════════════════════════

  buscarLotes(): void {
    const { fechaVencimientoInicio, fechaVencimientoFin, categorias } = this.filtroForm.value;
    this.skeleton = true;

    const request: any = { idUsuario: this.idUsuarioLogueado, nombre: '' };
    if (fechaVencimientoInicio) request.fechaVencimientoInicio = new Date(fechaVencimientoInicio).toISOString();
    if (fechaVencimientoFin)    request.fechaVencimientoFin    = new Date(fechaVencimientoFin).toISOString();
    if (categorias && categorias.length > 0) {
      request.idsCategorias = (categorias as CategoriaDTO[]).map(c => c.id);
    }

    this._inventarioService.GetAllLotesByFilterAsync(request).subscribe({
      next: (lotes: any[]) => {
        let lotesFiltrados = lotes || [];

        // Filtro de categoría en cliente (respaldo mientras el backend no filtre por idsCategorias)
        if (categorias && categorias.length > 0) {
          const idsCategoria = (categorias as CategoriaDTO[]).map(c => c.id);
          const nombresCategoria = (categorias as CategoriaDTO[]).map(c => (c.nombre || '').toLowerCase());
          const tieneIdCat = lotesFiltrados.some(l => (l.idCategoriaProducto ?? l.IdCategoriaProducto ?? 0) > 0);
          const tieneNombreCat = lotesFiltrados.some(l => !!(l.nombreCategoria ?? l.NombreCategoria));
          if (tieneIdCat) {
            lotesFiltrados = lotesFiltrados.filter(l => idsCategoria.includes(l.idCategoriaProducto ?? l.IdCategoriaProducto ?? 0));
          } else if (tieneNombreCat) {
            lotesFiltrados = lotesFiltrados.filter(l => nombresCategoria.includes((l.nombreCategoria ?? l.NombreCategoria ?? '').toLowerCase()));
          }
        }

        lotesFiltrados = lotesFiltrados.filter(
          l => (l.CantidadDisponible ?? l.cantidadDisponible ?? l.stockDisponible ?? 0) > 0
        );

        this.skeleton = false;

        if (lotesFiltrados.length === 0) {
          Swal.fire('Sin resultados', 'No se encontraron lotes con los filtros seleccionados.', 'info');
          return;
        }

        const nuevosItems = lotesFiltrados.map(l => ({
          idProducto:       l.IdProducto     ?? l.idProducto,
          idLoteProducto:   l.Id             ?? l.id,
          nombreProducto:   l.NombreProducto ?? l.nombreProducto ?? l.producto ?? '',
          codigoLote:       l.CodigoLote     ?? l.codigoLote ?? 'N/A',
          fechaVencimiento: l.FechaCaducidad ?? l.fechaCaducidad ?? l.fechaVencimiento ?? null,
          cantidadSistema:  l.CantidadDisponible ?? l.cantidadDisponible ?? l.stockDisponible ?? 0,
          cantidadFisica:   null,
          diferencia:       -(l.CantidadDisponible ?? l.cantidadDisponible ?? l.stockDisponible ?? 0),
          observacion:      '',
        }));

        if (this.modoAgregarProductos) {
          // Agregar sin duplicar (por idLoteProducto)
          const idsExistentes = new Set(this.dataSource.data.map(i => i.idLoteProducto));
          const sinDuplicados = nuevosItems.filter(i => !idsExistentes.has(i.idLoteProducto));
          const agregados = sinDuplicados.length;
          const duplicados = nuevosItems.length - agregados;
          this.dataSource.data = [...this.dataSource.data, ...sinDuplicados];
          this.modoAgregarProductos = false;
          if (duplicados > 0) {
            Swal.fire('Productos agregados', `Se agregaron ${agregados} producto(s). ${duplicados} ya estaban en la lista y fueron omitidos.`, 'info');
          }
        } else {
          this.dataSource.data = nuevosItems;
          // Guardar resultados del filtro para recuperarlos al hacer "Continuar"
          this._saveFiltroStorage(this.maestroData.motivo, nuevosItems);
        }

        this.paso = 3;
      },
      error: () => {
        this.skeleton = false;
        Swal.fire('Error', 'No se pudieron cargar los lotes. Intenta de nuevo.', 'error');
      }
    });
  }

  volver(): void {
    if (this.paso === 3) {
      if (this.esContinuacion) {
        this.paso = 1;
        this.esContinuacion = false;
        this.dataSource.data = [];
        this.productosAjustadosContinuacion = [];
        this.tabActual = 1;
      } else {
        this.paso = 2;
      }
    } else if (this.paso === 2) {
      if (this.modoAgregarProductos) {
        this.modoAgregarProductos = false;
        this.paso = 3;
      } else {
        this.paso = 1;
        this.dataSource.data = [];
      }
    }
  }

  agregarMasProductos(): void {
    this.modoAgregarProductos = true;
    this.paso = 2;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CONTEO
  // ══════════════════════════════════════════════════════════════════════════════

  calcularDiferencia(item: any): void {
    item.diferencia = item.cantidadFisica - item.cantidadSistema;
  }

  guardarBorrador(item: any): void {
    if (item.cantidadFisica === null || item.cantidadFisica === undefined || item.cantidadFisica === '') {
      Swal.fire('Dato faltante', 'Ingresa la cantidad física antes de guardar.', 'warning');
      return;
    }

    const request: RegistrarInventarioFisicoRequest = {
      idProducto:     item.idProducto,
      idLoteProducto: item.idLoteProducto,
      cantidadFisica: Number(item.cantidadFisica),
      nombreRegistro: this.maestroData.motivo,
      idUsuarioGuid:  this.idUsuarioLogueado,
      observacion:    item.observacion || '',
    };

    this._inventarioService.RegistrarInventarioFisicoAsync(request).subscribe({
      next: (res: ResponseDTO) => {
        if (res.success) {
          Swal.fire({ title: 'Guardado', text: 'El conteo fue registrado.', icon: 'success', timer: 1500, showConfirmButton: false });
          item.idInventarioFisico = res.value;
        } else {
          Swal.fire('Error', res.message || 'El servidor rechazó la petición', 'error');
        }
      },
      error: () => Swal.fire('Error del Sistema', 'No se pudo conectar con el servidor.', 'error')
    });
  }

  getEstadoItem(item: any): 'guardado' | 'ingresado' | 'sin_contar' {
    if (item.idInventarioFisico || item.idBorradorExistente) return 'guardado';
    if (item.cantidadFisica !== null && item.cantidadFisica !== undefined && item.cantidadFisica !== '') return 'ingresado';
    return 'sin_contar';
  }

  get totalItems():        number { return this.dataSource.data.filter(i => !i.yaAjustado).length; }
  get itemsGuardados():    number { return this.dataSource.data.filter(i => !i.yaAjustado && (i.idInventarioFisico || i.idBorradorExistente)).length; }
  get itemsIngresados():   number { return this.dataSource.data.filter(i => !i.yaAjustado && this.getEstadoItem(i) === 'ingresado').length; }
  get itemsSinContar():    number { return this.dataSource.data.filter(i => !i.yaAjustado && this.getEstadoItem(i) === 'sin_contar').length; }
  get itemsYaAjustados():  number { return this.dataSource.data.filter(i => i.yaAjustado).length; }

  getSemaforoVencimiento(fechaStr: string | null): { clase: string; dot: string } {
    if (!fechaStr) return { clase: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-400' };
    const fecha    = new Date(fechaStr);
    const hoy      = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)    return { clase: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500' };
    if (diffDays <= 5)   return { clase: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
    if (diffDays <= 15)  return { clase: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' };
    return                { clase: 'bg-green-50 text-green-700 border-green-200',          dot: 'bg-green-500' };
  }

  exportarReporte(): void {
    if (this.dataSource.data.length === 0) {
      Swal.fire('Sin datos', 'No hay información en la tabla para exportar.', 'info');
      return;
    }
    const cabeceras = ['Producto', 'Lote', 'Stock Sistema', 'Cantidad Contada', 'Diferencia', 'Motivo / Observación'];
    const filas = this.dataSource.data.map(item => [
      `"${item.nombreProducto || ''}"`,
      `"${item.codigoLote || ''}"`,
      item.cantidadSistema || 0,
      item.cantidadFisica !== null ? item.cantidadFisica : '',
      item.diferencia || 0,
      `"${item.observacion || ''}"`,
    ]);
    const csv  = [cabeceras.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `Reporte_Inventario_Fisico_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  onFinalizarAjuste(): void {
    const olvidados = this.dataSource.data.filter(i => !i.yaAjustado && this.getEstadoItem(i) === 'ingresado' && !i.idBorradorExistente);
    if (olvidados.length > 0) {
      Swal.fire({ title: '¡Cambios sin guardar!', text: `Guarda primero: ${olvidados.map(i => i.nombreProducto).join(', ')}.`, icon: 'warning' });
      return;
    }

    const guardados = this.dataSource.data.filter(i => !i.yaAjustado && (i.idInventarioFisico || i.idBorradorExistente));
    const sinContar = this.dataSource.data.filter(i => !i.yaAjustado && this.getEstadoItem(i) === 'sin_contar');

    if (guardados.length === 0) {
      Swal.fire({ title: 'Nada que ajustar', text: 'Debes guardar al menos un conteo antes de finalizar.', icon: 'info' });
      return;
    }

    const continuar = (items: any[]) => {
      Swal.fire({
        title: '¿Finalizar Inventario?',
        text: `Se ajustará el stock de ${items.length} producto(s). ¡No se puede deshacer!`,
        icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, ajustar stock', cancelButtonText: 'Cancelar',
      }).then(r => { if (r.isConfirmed) this.ejecutarAjuste(items); });
    };

    if (sinContar.length > 0) {
      Swal.fire({
        title: `${sinContar.length} producto(s) sin contar`,
        html: `<em>${sinContar.map(i => i.nombreProducto).join(', ')}</em> quedarán fuera del ajuste.`,
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Sí, ajustar solo los guardados', cancelButtonText: 'Volver y completar',
      }).then(r => { if (r.isConfirmed) continuar(guardados); });
      return;
    }

    continuar(guardados);
  }

  private ejecutarAjuste(items: any[]): void {
    forkJoin(items.map(i => this._inventarioService.AjustarInventarioFisicoAsync(i.idInventarioFisico || i.idBorradorExistente, this.idUsuarioLogueado)))
      .subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'El stock ha sido actualizado correctamente.', 'success');
          this._clearFiltroStorage(this.maestroData.motivo);
          this.dataSource.data = [];
          this.productosAjustadosContinuacion = [];
          this.paso = 1;
          this.esContinuacion = false;
          this.tabActual = 1;
          this.maestroForm.reset({ fechaTomaFisica: new Date(), motivoTomaFisica: '' });
          this.loadHistorial();
        },
        error: () => Swal.fire('Error', 'Hubo un problema al ajustar el stock. Intenta de nuevo.', 'error')
      });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // REPORTES
  // ══════════════════════════════════════════════════════════════════════════════

  loadReporte(): void {
    this.skeletonReporte = true;
    const v = this.reporteForm.value;
    const request = new ObtenerHistorialInventarioFisicoRequest();
    request.destinationTimeZoneId = this._toolService.getTimeZone();
    request.idUsuario    = this.idUsuarioLogueado;
    request.fechaInicio  = v.fechaInicio ? new Date(v.fechaInicio) : this._toolService.getStartDateOfMonth();
    request.fechaFin     = v.fechaFin    ? new Date(v.fechaFin)    : this._toolService.getEndDateOfMonth();
    request.soloPerdidas = false;
    request.lstCategorias = [];
    request.lstMarcas     = [];
    request.lstProductos  = [];

    this._inventarioService.GetHistorialInventarioFisicoAsync(request).subscribe({
      next: (res) => {
        let historial = res?.lstHistorial ?? [];
        if (v.soloAjustados) historial = historial.filter(h => h.ajustado);
        this.reporteGrupos = this.agruparPorToma(historial);
        this.reporteResumen = {
          totalTomas:       this.reporteGrupos.length,
          totalProductos:   historial.length,
          totalAjustados:   historial.filter(h => h.ajustado).length,
          totalValorPerdido: historial.reduce((acc, h) => acc + (h.valorPerdida || 0), 0),
        };
        this.skeletonReporte = false;
      },
      error: () => { this.skeletonReporte = false; }
    });
  }

  get reporteGruposFiltrados(): TomaFisicaGrupo[] {
    const texto = (this.reporteForm?.get('nombre')?.value || '').toLowerCase().trim();
    if (!texto) return this.reporteGrupos;
    return this.reporteGrupos.filter(g => g.nombre.toLowerCase().includes(texto));
  }

  getValorPerdidaGrupo(grupo: TomaFisicaGrupo): number {
    return (grupo.registros as any[]).reduce((acc, r) => acc + (r.valorPerdida || 0), 0);
  }

  exportarReporteCompleto(): void {
    const grupos = this.reporteGruposFiltrados;
    if (grupos.length === 0) {
      Swal.fire('Sin datos', 'No hay información para exportar.', 'info');
      return;
    }
    const cabeceras = ['Nombre Registro', 'Fecha Toma', 'Producto', 'Lote', 'Stock Sistema', 'Cant. Fisica', 'Diferencia', 'Precio Compra', 'Valor Perdida', 'Estado'];
    const filas: string[] = [];
    for (const grupo of grupos) {
      const d = grupo.fecha;
      const fechaStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
      for (const r of grupo.registros as any[]) {
        filas.push([
          `"${grupo.nombre}"`,
          `"${fechaStr}"`,
          `"${r.nombreProducto || ''}"`,
          `"${r.numeroLote || ''}"`,
          r.stockSistema   ?? 0,
          r.cantidadFisica ?? 0,
          r.diferencia     ?? 0,
          r.precioCompra   ?? 0,
          r.valorPerdida   ?? 0,
          r.ajustado ? 'Ajustado' : 'Pendiente',
        ].join(','));
      }
    }
    const csv  = [cabeceras.join(','), ...filas].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `Reporte_Inventario_Fisico_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
