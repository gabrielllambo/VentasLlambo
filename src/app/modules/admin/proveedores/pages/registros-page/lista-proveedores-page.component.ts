import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ArchivoExcel, DictionaryInfo, ErrorCodigo, Flags, ImagenesUrl, Numeracion } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { FuseValidators } from '@fuse/validators';
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
/* NOTE: I didn't add a custom Paginator provider to avoid missing-provider errors.
   If you have a Spanish paginator for proveedores, add it to the providers array below. */
import { ProveedorService } from 'app/core/services/proveedores/proveedor.service';
import { ProveedorDTO } from 'app/core/models/proveedores/response/proveedor-dto.model';
import { ActualizarActivoProveedorRequest } from 'app/core/models/proveedores/request/actualizar-activo-proveedor-request.model';
import { RegistroProveedorPageComponent } from './modals/registro-proveedor-page/registro-proveedor-page.component';
import { ModificaProveedorPageComponent } from './modals/modifica-proveedor-page/modifica-proveedor-page.component';
import { DetalleProveedorPageComponent } from './modals/detalle-proveedor-page/detalle-proveedor-page.component';
import { ObtenerProveedorRequest } from 'app/core/models/proveedores/request/obtener-proveedor-request.model';
import { MatSelect } from '@angular/material/select';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { ParametroGeneralService } from 'app/core/services/parametro/parametro-general.service';
import { EliminarProveedorRequest } from 'app/core/models/proveedores/request/eliminar-proveedor-request.model';
import * as XLSX from 'xlsx-js-style';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';


@Component({
    selector: 'app-lista-proveedores-page',
    templateUrl: './lista-proveedores-page.component.html',
    styleUrls: ['./lista-proveedores-page.component.scss'],
    /* providers: [
        {
            provide: MatPaginatorIntl,
            useClass: SpanishProveedoresPaginatorService, // uncomment if exists
        }
    ], */
})
export class ListaProveedoresPageComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('selectTipoDocumentoItem') selectTipoDocumentoItem: MatSelect;
    @ViewChild('selectGenerosItem') selectGeneroItem: MatSelect;

    private decodeToken: DecodedToken;
    private configForm: UntypedFormGroup;

    public disabledAcciones: boolean = Flags.False;
    public disabledBuscar: boolean = Flags.False;
    public disabledExportar: boolean = Flags.False;

    public skeleton: boolean = Flags.False;
    public skeletonNumber: number = Numeracion.Ocho;

    public textoResultadoTable: string = "";
    public imgNoDataUltimosRegistros: string = ImagenesUrl.noDataUltimosRegistros;

    @ViewChild('proveedoresTable', { read: MatSort })
    private proveedorTableMatSort: MatSort;

    @ViewChild('matDrawer')
    private matDrawer: MatDrawer;

    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    filtroProveedorForm: UntypedFormGroup;

    @ViewChild(MatPaginator) private _paginator: MatPaginator;

    public pageSlice: MatTableDataSource<ProveedorDTO> = new MatTableDataSource();
    public allProveedoresDataSource: MatTableDataSource<ProveedorDTO> = new MatTableDataSource();
    public allTiposDocumentos: TipoDocumentoDTO[];
    public allGeneros: GeneroDTO[];
    public proveedoresTableColumns: string[] = ['razonSocial', 'nombreComercial', 'correoElectronico','numeroDocumento', 'fechaRegistro', 'activarDesactivar', 'acciones'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    allClientesDataSource = new MatTableDataSource<any>([]); // <-- inicializado vacío
    //clientesTableColumns: string[] = ['nombres', 'apellidos', 'correo', 'numeroDocumento', 'fechaRegistro', 'activarDesactivar', 'acciones'];

    //

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _proveedorService: ProveedorService,
        private _parametroGeneralService: ParametroGeneralService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toolService: ToolService,
    ) { }

    ngAfterViewInit() {
        this.allProveedoresDataSource.sort = this.proveedorTableMatSort;
        this.allProveedoresDataSource.paginator = this._paginator;
    }

    ngOnDestroy() {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngOnInit() {
        this.formFiltros();
        this.showSkeleton();
        this.getFilterComboConsulta();
    }

    // Función para inicializar el FormGroup de filtros
    formFiltros() {
        this.decodeToken = this.obtenerInfouserInfoLogueado();
        this.filtroProveedorForm = this._formBuilder.group({
            razonSocial:[''],
            tiposDocumento: [''],
            numeroDocumento: [''],
            nombreComercial: [''],
            telefono: [''],           
            correoElectronico: [''],  
            fechaRegistroInicio: [this._toolService.getStartDateOfMonth()],
            fechaRegistroFin: [this._toolService.getEndDateOfMonth()],
        });
    }

    getFilterComboConsulta() {
        const request = this.obtenerRequest();
        forkJoin({
            dataProveedores: this._proveedorService.GetAllByFilterAsync(request),
            dataTipoDocumentos: this._parametroGeneralService.GetAllTipoDocumentoAsync(),
            dataGeneros: this._parametroGeneralService.GetAllGeneroAsync(),
        }).subscribe({
            next: (response) => {

                this.allProveedoresDataSource.data = response.dataProveedores;
                this.allTiposDocumentos = response.dataTipoDocumentos;
                this.allGeneros = response.dataGeneros;

                this.filtroProveedorForm.get('tiposDocumento')?.setValue(this.allTiposDocumentos);
                this.filtroProveedorForm.get('generos')?.setValue(this.allGeneros);

                this.pageSlice.data = [];

                if (this.allProveedoresDataSource.data.length > Numeracion.Cero) {
                    this.disabledExportar = Flags.False;
                    this.setPageSlice(this.allProveedoresDataSource.data);
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
                console.log(err);
            },
        });
    }

    GetAllByFilterAsync(disabledBuscar: boolean, hideFilter: boolean, esBusquedaBoton: boolean) {

        const request = this.obtenerRequest();

        this.disabledBuscar = disabledBuscar;

        this._proveedorService.GetAllByFilterAsync(request).subscribe((response: ProveedorDTO[]) => {
            this.allProveedoresDataSource.data = response;
            this.pageSlice.data = [];
            if (this.allProveedoresDataSource.data.length > Numeracion.Cero) {
                this.disabledExportar = Flags.False;
                this.setPageSlice(this.allProveedoresDataSource.data);
                this.disabledBuscar = Flags.False;
                this.hideSkeleton();
                if (hideFilter) {
                    this.closedDrawer();
                }
                return;
            }
            this.textoResultadoTable = DictionaryInfo.NoDataResult;
            this.disabledBuscar = Flags.False;
            this.disabledExportar = Flags.True;
            this.hideSkeleton();
            if (hideFilter) {
                this.closedDrawer();
            }
        }, err => {
            this.hideSkeleton();
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.disabledBuscar = Flags.False;
            console.log(err);
            if (hideFilter) {
                this.closedDrawer();
            }
        });
    }

    UpdateActivoProveedorAsync(proveedor: ProveedorDTO, isChecked: boolean): void {

        const destinationTimeZoneId = this._toolService.getTimeZone()
        const idUsuario = this.decodeToken.idUsuario;
        const idProveedor = proveedor.id;

        if (FuseValidators.isEmptyInputValue(idProveedor)) {
            this._toolService.showWarning(DictionaryWarning.InvalidIdCliente, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
            this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(idUsuario)) {
            this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
            return;
        }

        const request = new ActualizarActivoProveedorRequest();
        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.id = idProveedor;
        request.idUsuario = idUsuario;
        request.activo = isChecked;
        this.disabledAcciones = Flags.True;
        this._proveedorService.UpdateActivoAsync(request).subscribe((response: ResponseDTO) => {

            if (response.success) {
                const data = this.allProveedoresDataSource.data;
                const proveedorToUpdate = data.find(item => item.id === proveedor.id);
                if (proveedorToUpdate) {
                    proveedorToUpdate.activo = isChecked;
                }
                this.allProveedoresDataSource.data = data;
                this.disabledAcciones = Flags.False;
                return;
            }
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
        }, err => {
            this.disabledAcciones = Flags.True;
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            console.log(err);
        });
    }

    onShowFormRegistrarProveedor() {
        const dialogRef = this._matDialog.open(RegistroProveedorPageComponent, {
            data: {
                lstTipoDocumento: this.allTiposDocumentos,
                lstGenero: this.allGeneros,
            }
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllByFilterAsync(Flags.False, Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormModificaProveedor(proveedor: ProveedorDTO) {
        const dialogRef = this._matDialog.open(ModificaProveedorPageComponent, {
            data: {
                proveedor: proveedor,
                lstTipoDocumento: this.allTiposDocumentos,
                lstGenero: this.allGeneros,
            }
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllByFilterAsync(Flags.False, Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormDetalleProveedor(proveedor: ProveedorDTO) {
        this.showFormDetalleProveedorDialog(proveedor);
    }

    showFormDetalleProveedorDialog(proveedor: ProveedorDTO) {
        this._matDialog.open(DetalleProveedorPageComponent, {
            autoFocus: Flags.False,
            data: {
                proveedor: proveedor,
                lstTipoDocumento: this.allTiposDocumentos,
            }
        });
    }

    DeleteAsync(proveedor: ProveedorDTO) {
        this.configForm = this._formBuilder.group({
            title: 'Eliminar proveedor',
            message: '¿Seguro que quieres borrar el proveedor ' + proveedor.razonSocial + '?.',
            icon: this._formBuilder.group({
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            }),
            actions: this._formBuilder.group({
                confirm: this._formBuilder.group({
                    show: true,
                    label: 'Borrar',
                    color: 'warn',
                }),
                cancel: this._formBuilder.group({
                    show: true,
                    label: 'Cancelar',
                }),
            }),
            dismissible: true,
        });

        const dialogRef = this._fuseConfirmationService.open(this.configForm.value);

        dialogRef.afterClosed().subscribe((result) => {
            if (result != "confirmed") { return; }

            const destinationTimeZoneId = this._toolService.getTimeZone()
            const idUsuario = this.decodeToken.idUsuario;
            const idProveedor = proveedor.id;

            if (FuseValidators.isEmptyInputValue(idProveedor)) {
                this._toolService.showWarning(DictionaryWarning.InvalidIdCliente, DictionaryWarning.Tittle);
                return;
            }

            if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
                this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
                return;
            }

            if (FuseValidators.isEmptyInputValue(idUsuario)) {
                this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
                return;
            }

            if (FuseValidators.isEmptyInputValue(idProveedor)) {
                this._toolService.showWarning(DictionaryWarning.InvalidIdCliente, DictionaryWarning.Tittle);
                return;
            }

            const request = new EliminarProveedorRequest();
            request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
            request.id = idProveedor;
            request.idUsuario = idUsuario;
            this.disabledAcciones = Flags.True;

            this._proveedorService.DeleteAsync(request).subscribe((response: ResponseDTO) => {

                if (response.code == ErrorCodigo.Advertencia) {
                    this._toolService.showWarning(response.message, response.titleMessage);
                    this.disabledAcciones = Flags.False;
                    this.hideSkeleton();
                    return;
                }

                if (response.success) {
                    this._toolService.showSuccess(response.message, response.titleMessage);
                    this.removeRowSelected(idProveedor);
                    this.setPageSlice(this.allProveedoresDataSource.data);
                    this.disabledAcciones = Flags.False;
                    this.getSkeletonCount();
                    this.showSkeleton();
                    this.GetAllByFilterAsync(Flags.False, Flags.False, Flags.False);
                    return;
                }

                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledAcciones = Flags.False;
            }, err => {
                this.hideSkeleton();
                this.disabledAcciones = Flags.False;
                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                console.log(err);
            });

        });
    }

    btnBuscar() {
        this.getSkeletonCount();
        this.showSkeleton();
        this.GetAllByFilterAsync(Flags.True, Flags.True, Flags.True);
    }

    // Función para armar el request con seguridad de que los controles existen
    obtenerRequest(): ObtenerProveedorRequest {
        const request = new ObtenerProveedorRequest();

        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;

        request.numeroDocumento = this.filtroProveedorForm.get('numeroDocumento')?.value || null;
        request.razonSocial = this.filtroProveedorForm.get('razonSocial')?.value || null;
        request.telefono = this.filtroProveedorForm.get('telefono')?.value || null;
        request.direccion = this.filtroProveedorForm.get('direccion')?.value || null;
        request.correoElectronico = this.filtroProveedorForm.get('correoElectronico')?.value || null;
        request.celular = this.filtroProveedorForm.get('celular')?.value || null;
        request.fechaRegistroInicio = this.filtroProveedorForm.get('fechaRegistroInicio')?.value || null;
        request.fechaRegistroFin = this.filtroProveedorForm.get('fechaRegistroFin')?.value || null;

        // Extraer selects multi tipo documento / género si los necesitas en el request
        if (this.selectTipoDocumentoItem) {
            const selectTipoDocumento = this.selectTipoDocumentoItem.options
                .filter(x => x.selected && x.value != 0);
            // selectTipoDocumento.forEach(element => { request.lstTipoDocumento?.push(element.value.id); });
        }

        if (this.selectGeneroItem) {
            const selectGenero = this.selectGeneroItem.options
                .filter(x => x.selected && x.value != 0);
            // selectGenero.forEach(element => { request.lstGenero?.push(element.value.id); });
        }

        return request;
    }


    onExportar() {

        if (this.pageSlice.data.length === Numeracion.Cero) { return; }

        const fileName = ArchivoExcel.NombreExcelExportarClientes; // reuse or create ArchivoExcel.NombreExcelExportarProveedores
        const nameSheet = ArchivoExcel.NombreHojaExcelClientes;   // reuse or create appropriate constants

        const dataSource: ProveedorDTO[] = this.allProveedoresDataSource.data;
        const reportData: any[] = [];

        dataSource.forEach(element => {
            const data = {
                "Razón Social": element.razonSocial,
                "Número De Documento": element.numeroDocumento,
                "Nombre Comercial": element.nombreComercial,
                "Correo": element.correoElectronico,
                "Teléfono": element.telefono,
                "Dirección": element.direccion,
                "Fecha Registro": this._toolService.formatoFecha((new Date(element.fechaRegistro))),
                "¿Activo?": element.activo == Flags.False ? "No" : "Si",
            };
            reportData.push(data);
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(reportData, {
            header: ["Razón Social", "Número De Documento", "Correo", "Teléfono", "Dirección", "Fecha Registro", "¿Activo?"]
        });

        const columnWidths = reportData.reduce((widths, row) => {
            Object.keys(row).forEach((key, i) => {
                const valueLength = row[key] ? row[key].toString().length : 20;
                widths[i] = Math.max(widths[i] || 20, valueLength);
            });
            return widths;
        }, []);

        ws['!cols'] = columnWidths.map(w => ({ width: w + Numeracion.Cuatro }));

        const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1"];
        headerKeys.forEach(cell => {
            if (ws[cell]) {
                ws[cell].s = {
                    fill: { fgColor: { rgb: "4f46e5" } },
                    font: { bold: true, color: { rgb: "ffffff" } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        bottom: { style: "thin", color: { rgb: "000000" } },
                    }
                };
            }
        });

        Object.keys(ws).forEach(cell => {
            const col = cell[0];
            const row = parseInt(cell.substring(1), 10);
            if (!isNaN(row) && row > 1) {
                if (ws[cell]) {
                    ws[cell].s = {
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
            }
        });

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, nameSheet);
        XLSX.writeFile(wb, fileName);
    }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    sortingActivoData = (data: any, sortHeaderId: string) => {
        return this._toolService.sortingActivoData(data, sortHeaderId);
    };

    onPageChange(event: any): void {
        const startIndex = event.pageIndex * event.pageSize;
        let endIndex = startIndex + event.pageSize;
        if (endIndex > this.allProveedoresDataSource.data.length) {
            endIndex = this.allProveedoresDataSource.data.length;
        }

        this.pageSlice.data = this.allProveedoresDataSource.data.slice(startIndex, endIndex);
    }

    setPageSlice(data) {
        this.pageSlice.data = data.slice(Numeracion.Cero, Numeracion.Diez);
        if (this._paginator) {
            this._paginator.pageIndex = Numeracion.Cero;
            this._paginator.pageSize = Numeracion.Diez;
        }
    }

    isMobilSize(): boolean {
        return this._toolService.isMobilSize();
    }

    removeRowSelected(id: number) {
        const index = this.allProveedoresDataSource.data.findIndex(p => p.id === id);
        if (index !== -1) {
            this.allProveedoresDataSource.data.splice(index, Numeracion.Uno);
        }
    }

    closedDrawer() {
        this.matDrawer.close();
    }

    getSkeletonCount() {
        this.skeletonNumber = this.allProveedoresDataSource.data.length == Numeracion.Cero ? Numeracion.Ocho : this.allProveedoresDataSource.data.length + Numeracion.Uno
    }

    showSkeleton() {
        this.skeleton = Flags.Show
    }

    hideSkeleton() {
        this.skeleton = Flags.Hide
    }

}
