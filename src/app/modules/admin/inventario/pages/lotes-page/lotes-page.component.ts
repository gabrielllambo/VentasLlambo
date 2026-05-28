import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin, Subject } from 'rxjs';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ArchivoExcel, DictionaryInfo, ErrorCodigo, Flags, ImagenesUrl, Numeracion } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import * as XLSX from 'xlsx-js-style';
import { SpanishHistorialComprasPaginatorService } from 'app/core/services/paginator/compras/historial/spanish-historial-compras-paginator.service';
import { CompraDTO } from 'app/core/models/compra/response/compra-dto.model';
import { ObtenerCompraRequest } from 'app/core/models/compra/request/obtener-compra-request.model';
import { MatSelect } from '@angular/material/select';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AnularCompraRequest } from 'app/core/models/compra/request/anular-compra-request.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ObtenerDetalleCompraRequest } from 'app/core/models/compra/request/obtener-detalle-compra-request.model';
import { DetalleCompraDTO } from 'app/core/models/compra/response/detalle-compra-dto.model';
import { MatDialog } from '@angular/material/dialog';
import { DetalleCompraPageComponent } from './modals/detalle-producto-page/detalle-compra-page.component';
import { InventarioService } from 'app/core/services/inventario/inventario.service';

import { CompraService } from 'app/core/services/compra/compra.service';
import { DetalleCompraService } from 'app/core/services/detallecompra/detallecompra.service';
import { FuseValidators } from '@fuse/validators';
import { LoteDTO } from 'app/core/models/inventario/lote/response/lote-dto-request.model';

@Component({
    selector: 'app-lotes-page',
    templateUrl: './lotes-page.component.html',
    styleUrl: './lotes-page.component.scss',
    providers: [
        {
            provide: MatPaginatorIntl,
            useClass: SpanishHistorialComprasPaginatorService,
        }
    ],
})
export class LotesPageComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('selectUsuarioItem') selectUsuarioItem: MatSelect;
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild('LoteTable', { read: MatSort }) private LoteTableTableMatSort: MatSort;
    @ViewChild('matDrawer') private matDrawer: MatDrawer;

    private decodeToken: DecodedToken = this.obtenerInfouserInfoLogueado();
    public monedaInfo: MonedaDTO = this.obtenerInfoMoneda();
    private configForm: UntypedFormGroup;

    public disabledAcciones: boolean = Flags.False;
    public disabledBuscar: boolean = Flags.False;
    public disabledExportar: boolean = Flags.False;
    public skeleton: boolean = Flags.False;
    public skeletonNumber: number = Numeracion.Ocho;
    public textoResultadoTable: string = "";
    public imgNoDataUltimosRegistros: string = ImagenesUrl.noDataUltimosRegistros;

    filtroLoteForm: UntypedFormGroup;
    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    public pageSlice: MatTableDataSource<LoteDTO> = new MatTableDataSource();
    public allUsuarioSource: UsuarioDTO[] = [];
    public allHistorialLoteDataSource: MatTableDataSource<LoteDTO> = new MatTableDataSource();
    public lotesTableColumns: string[] = [
        'codigoLote',
        'producto',
        'proveedor',
        'fechaVencimiento',
        'cantidadInicial',
        'stockDisponible',
        'ubicacion',
        'precioCompra',
        'fechaRegistro',
        'estado'
    ];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _inventarioService: InventarioService,
        private _detalleCompraService: DetalleCompraService,
        private _toolService: ToolService
    ) { }

    ngOnInit() {
        this.formFiltros();
        this.showSkeleton();
        this.getFilterComboConsulta();
    }

    ngAfterViewInit() {
        this.allHistorialLoteDataSource.sort = this.LoteTableTableMatSort;
        this.allHistorialLoteDataSource.paginator = this._paginator;
    }

    ngOnDestroy() {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closedDrawer() { this.matDrawer.close(); }
    getSkeletonCount() { this.skeletonNumber = this.allHistorialLoteDataSource.data.length === 0 ? Numeracion.Ocho : this.allHistorialLoteDataSource.data.length + Numeracion.Uno; }
    showSkeleton() { this.skeleton = Flags.Show; }
    hideSkeleton() { this.skeleton = Flags.Hide; }

    formFiltros() {
        this.decodeToken = this.obtenerInfouserInfoLogueado();
        this.filtroLoteForm = this._formBuilder.group({
            usuarios: [''],
            nombreProducto: [''],
            numeroLote: [''],

            fechaLoteInicio: [null],
            fechaLoteFin: [null],

            montoLoteInicio: [''],
            montoLoteFin: ['']
        });
    }

    obtenerRequest() {
        const formValue = this.filtroLoteForm.value;

        const request: any = {
            idUsuario: (this.decodeToken?.idUsuario || '').toString(),
            nombre: formValue.nombreProducto || ''
        };

        if (formValue.numeroLote) {
            request.codigoLote = formValue.numeroLote;
        }

        if (formValue.fechaLoteInicio) {
            request.fechaVencimientoInicio = new Date(formValue.fechaLoteInicio).toISOString();
        }

        if (formValue.fechaLoteFin) {
            request.fechaVencimientoFin = new Date(formValue.fechaLoteFin).toISOString();
        }

        if (formValue.montoLoteInicio) {
            request.stockMinimo = parseFloat(formValue.montoLoteInicio);
        }

        if (formValue.montoLoteFin) {
            request.stockMaximo = parseFloat(formValue.montoLoteFin);
        }

        return request;
    }

    getFilterComboConsulta() {
        const request = this.obtenerRequest();
        forkJoin({
            //dataUsuarios: this._inventarioService.GetAllUsuariosAsync(), // Si aplica
            dataLotes: this._inventarioService.GetAllLotesByFilterAsync(request), // <-- Llamada al servicio correcto
        }).subscribe({
            next: (response: any) => {
                this.allHistorialLoteDataSource.data = response.dataLotes;
                this.pageSlice.data = [];

                if (this.allHistorialLoteDataSource.data.length > 0) {
                    this.disabledExportar = Flags.False;
                    this.setPageSlice(this.allHistorialLoteDataSource.data);
                    this.disabledBuscar = Flags.False;
                    this.hideSkeleton();
                    return;
                }

                this.textoResultadoTable = DictionaryInfo.NoDataResult;
                this.disabledBuscar = Flags.False;
                this.disabledExportar = Flags.True;
                this.hideSkeleton();
            },
            error: (err) => {
                this.hideSkeleton();
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledBuscar = Flags.False;
                this.disabledExportar = Flags.True;
                console.log(err);
            },
        });
    }

    btnBuscar() {
        this.getSkeletonCount();
        this.showSkeleton();
        this.GetAllLotesByFilterAsync(true, true);
    }

    GetAllLotesByFilterAsync(disabledBuscar: boolean, hideFilter: boolean) {
        const request = this.obtenerRequest();
        this.disabledBuscar = disabledBuscar;

        this._inventarioService.GetAllLotesByFilterAsync(request).subscribe({
            next: (response: any[]) => { // Reemplaza 'any[]' por LoteItemDTO[]
                this.allHistorialLoteDataSource.data = response;
                this.pageSlice.data = [];

                if (this.allHistorialLoteDataSource.data.length > 0) {
                    this.disabledExportar = false;
                    this.setPageSlice(this.allHistorialLoteDataSource.data);
                    this.disabledBuscar = false;
                    this.hideSkeleton();
                    if (hideFilter) this.closedDrawer();
                    return;
                }

                this.textoResultadoTable = "No se encontraron datos";
                this.disabledBuscar = false;
                this.disabledExportar = true;
                this.hideSkeleton();
                if (hideFilter) this.closedDrawer();
            },
            error: (err) => {
                this.hideSkeleton();
                this.disabledBuscar = false;
                this.disabledExportar = true;
                if (hideFilter) this.closedDrawer();
                console.log(err);
            },
        });
    }

    GetAllHistorialComprasByFilterAsync(disabledBuscar: boolean, hideFilter: boolean) {
        const request = this.obtenerRequest();
        this.disabledBuscar = disabledBuscar;

        this._inventarioService.GetAllLotesByFilterAsync(request).subscribe({
            next: (response: LoteDTO[]) => {
                // Usar directamente el array devuelto por la API
                this.allHistorialLoteDataSource.data = response;
                this.pageSlice.data = [];

                if (this.allHistorialLoteDataSource.data.length > 0) {
                    this.disabledExportar = Flags.False;
                    this.setPageSlice(this.allHistorialLoteDataSource.data);
                    this.disabledBuscar = Flags.False;
                    this.hideSkeleton();
                    if (hideFilter) this.closedDrawer();
                    return;
                }

                this.textoResultadoTable = DictionaryInfo.NoDataResult;
                this.disabledBuscar = Flags.False;
                this.disabledExportar = Flags.True;
                this.hideSkeleton();
                if (hideFilter) this.closedDrawer();
            },
            error: (err) => {
                this.hideSkeleton();
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledBuscar = Flags.False;
                this.disabledExportar = Flags.True;
                if (hideFilter) this.closedDrawer();
                console.log(err);
            },
        });
    }

    showFormDetalleCompraDialog(compra: CompraDTO) {

        const request = new ObtenerDetalleCompraRequest();
        const destinationTimeZoneId = this._toolService.getTimeZone();
        const idUsuario = this.decodeToken.idUsuario;
        const idCompra = compra.idCompra;

        /* if (FuseValidators.isEmptyInputValue(idCompra)) {
            this._toolService.showWarning(DictionaryWarning.InvalidCompra, DictionaryWarning.Tittle);
            return;
        } */

        if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
            this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(idUsuario)) {
            this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
            return;
        }

        this.disabledAcciones = Flags.True;

        request.destinationTimeZoneId = destinationTimeZoneId;
        request.idUsuario = idUsuario;
        request.idCompra = idCompra;

        this._detalleCompraService.GetDetalleAsync(request).subscribe(
            (response: DetalleCompraDTO[]) => {

                this.disabledAcciones = Flags.False;

                // Abrir modal con el detalle
                this._matDialog.open(DetalleCompraPageComponent, {
                    autoFocus: Flags.False,
                    data: {
                        lstDetalleCompra: response,
                        monedaInfo: this.monedaInfo,
                        numeroCompra: compra.numeroCompra
                    }
                });
            },
            err => {
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledAcciones = Flags.False;
            }
        );
    }


    // AnulaAsync(compra: CompraDTO) {
    //     this.configForm = this._formBuilder.group({
    //         title: 'Anular Compra',
    //         message: '¿Seguro que quieres anular la compra ' + compra.numeroCompra + '?.',
    //         icon: this._formBuilder.group({
    //             show: true,
    //             name: 'heroicons_outline:exclamation-triangle',
    //             color: 'warn',
    //         }),
    //         actions: this._formBuilder.group({
    //             confirm: this._formBuilder.group({
    //                 show: true,
    //                 label: 'Borrar',
    //                 color: 'warn',
    //             }),
    //             cancel: this._formBuilder.group({
    //                 show: true,
    //                 label: 'Cancelar',
    //             }),
    //         }),
    //         dismissible: true,
    //     });

    //     const dialogRef = this._fuseConfirmationService.open(this.configForm.value);

    //     dialogRef.afterClosed().subscribe((result) => {
    //         if (result != "confirmed") { return; }

    //         const request = new AnularCompraRequest();
    //         request.destinationTimeZoneIdActualizacion = this._toolService.getTimeZone();
    //         request.id = compra.idCompra;
    //         request.idUsuario = this.decodeToken.idUsuario;

    //         this.disabledAcciones = Flags.True;

    //         this._compraService.AnulaAsync(request).subscribe((response: ResponseDTO) => {

    //             if (response.code == ErrorCodigo.Advertencia) {
    //                 this._toolService.showWarning(response.message, response.titleMessage);
    //                 this.disabledAcciones = Flags.False;
    //                 return;
    //             }

    //             if (response.success) {
    //                 this._toolService.showSuccess(response.message, response.titleMessage);
    //                 this.setPageSlice(this.allHistorialCompraDataSource.data);
    //                 this.disabledAcciones = Flags.False;
    //                 this.getSkeletonCount();
    //                 this.showSkeleton();
    //                 this.GetAllHistorialComprasByFilterAsync(Flags.True, Flags.True);
    //                 return;
    //             }
    //             this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
    //             this.disabledAcciones = Flags.False;
    //         }, err => {
    //             this.disabledAcciones = Flags.False;
    //             this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
    //         });

    //     });
    // }

    // onExportar() {
    //     if (this.pageSlice.data.length === Numeracion.Cero) return;

    //     const currencyFormatter = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    //     const fileName = ArchivoExcel.NombreExcelExportarCompras;
    //     const nameSheet = ArchivoExcel.NombreHojaExcelCompras;

    //     const dataSource: CompraDTO[] = this.allHistorialCompraDataSource.data;
    //     const reportData: any[] = [];

    //     dataSource.forEach(element => {
    //         reportData.push({
    //             "Número Compra": element.numeroCompra,
    //             "Proveedor": element.nombreProveedor,
    //             "Correo Usuario": element.correoUsuario,
    //             "Fecha Compra": this._toolService.formatoFecha(element.fechaCompra),
    //             "Total Compra": currencyFormatter.format(element.totalCompra),
    //             "¿Anulado?": element.estado == Flags.False ? "No" : "Si",
    //         });
    //     });

    //     const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(reportData, {
    //         header: ["Número Compra", "Proveedor", "Correo Usuario", "Fecha Compra", "Total Compra", "¿Anulado?"]
    //     });

    //     const columnWidths = reportData.reduce((widths, row) => {
    //         Object.keys(row).forEach((key, i) => {
    //             const valueLength = row[key] ? row[key].toString().length : 20;
    //             widths[i] = Math.max(widths[i] || 20, valueLength);
    //         });
    //         return widths;
    //     }, []);
    //     ws['!cols'] = columnWidths.map(w => ({ width: w + Numeracion.Cuatro }));

    //     const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1"];
    //     headerKeys.forEach(cell => {
    //         if (ws[cell]) {
    //             ws[cell].s = {
    //                 fill: { fgColor: { rgb: "4f46e5" } },
    //                 font: { bold: true, color: { rgb: "ffffff" } },
    //                 alignment: { horizontal: "center", vertical: "center" },
    //                 border: { bottom: { style: "thin", color: { rgb: "000000" } } }
    //             };
    //         }
    //     });

    //     Object.keys(ws).forEach(cell => {
    //         const row = parseInt(cell.substring(1), 10);
    //         if (!isNaN(row) && row > 1) {
    //             ws[cell].s = { alignment: { horizontal: "center", vertical: "center" } };
    //         }
    //     });

    //     const wb: XLSX.WorkBook = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(wb, ws, nameSheet);
    //     XLSX.writeFile(wb, fileName);
    // }

    onExportar() {
        // Por ahora lo dejamos con un console.log para que no dé error
        console.log('Exportando lista de lotes...');

        // Aquí luego llamaremos a tu servicio de reportes (QuestPDF o Excel)
        // this._inventarioService.ExportarLotesExcel(this.obtenerRequest()).subscribe(...);
    }
    obtenerInfouserInfoLogueado(): DecodedToken { return this._securityService.getDecodetoken(); }
    obtenerInfoMoneda(): MonedaDTO { return this._securityService.getMonedaStorage(); }

    trackByFn(index: number, item: any): any { return item.id || index; }

    onPageChange(event: any): void {
        const startIndex = event.pageIndex * event.pageSize;
        let endIndex = startIndex + event.pageSize;
        if (endIndex > this.allHistorialLoteDataSource.data.length) endIndex = this.allHistorialLoteDataSource.data.length;
        this.pageSlice.data = this.allHistorialLoteDataSource.data.slice(startIndex, endIndex);
    }

    setPageSlice(data) {
        this.pageSlice.data = data.slice(Numeracion.Cero, Numeracion.Cinco);
        if (this._paginator) {
            this._paginator.pageIndex = Numeracion.Cero;
            this._paginator.pageSize = Numeracion.Cinco;
        }
    }
    isMobilSize(): boolean {
        return this._toolService.isMobilSize();
    }

    getSemaforoVencimiento(fechaStr: string | null): { clase: string, dot: string } {
        if (!fechaStr) return { clase: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-400' };
        
        const fecha = new Date(fechaStr);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Ignorar horas para comparar solo las fechas
        
        const diffTime = fecha.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { clase: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }; // Vencido
        } else if (diffDays <= 5) {
            return { clase: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' }; // Crítico (≤5d)
        } else if (diffDays <= 15) {
            return { clase: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' }; // Alerta (6–15d)
        } else {
            return { clase: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' }; // Vigente (>15d)
        }
    }
}
