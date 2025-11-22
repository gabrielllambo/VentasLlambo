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
import { SpanishClientesPaginatorService } from 'app/core/services/paginator/clientes/registros/spanish-lista-clientes-paginator.service';
import { ClienteService } from 'app/core/services/cliente/cliente.service';
import { ClienteDTO } from 'app/core/models/clientes/response/cliente-dto.model';
import { ActualizarActivoClienteRequest } from 'app/core/models/clientes/request/actualizar-activo-cliente-request.model';
import { RegistroClientePageComponent } from './modals/registro-cliente-page/registro-cliente-page.component';
import { ModificaClientePageComponent } from './modals/modifica-cliente-page/modifica-cliente-page.component';
import { DetalleClientePageComponent } from './modals/detalle-cliente-page/detalle-cliente-page.component';
import { ObtenerClienteRequest } from 'app/core/models/clientes/request/obtener-cliente-request.model';
import { MatSelect } from '@angular/material/select';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { ParametroGeneralService } from 'app/core/services/parametro/parametro-general.service';
import { EliminarClienteRequest } from 'app/core/models/clientes/request/eliminar-cliente-request.model';
import * as XLSX from 'xlsx-js-style';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';

@Component({
    selector: 'app-lista-clientes-page',
    templateUrl: './lista-clientes-page.component.html',
    styleUrl: './lista-clientes-page.component.scss',
    providers: [
        {
            provide: MatPaginatorIntl,
            useClass: SpanishClientesPaginatorService,
        }
    ],
})

export class ListaClientesPageComponent implements OnInit, AfterViewInit, OnDestroy {

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

    @ViewChild('clientesTable', { read: MatSort })
    private clienteTableMatSort: MatSort;

    @ViewChild('matDrawer')
    private matDrawer: MatDrawer;

    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    filtroClienteForm: UntypedFormGroup;

    @ViewChild(MatPaginator) private _paginator: MatPaginator;

    public pageSlice: MatTableDataSource<ClienteDTO> = new MatTableDataSource();
    public allClientesDataSource: MatTableDataSource<ClienteDTO> = new MatTableDataSource();
    public allTiposDocumentos: TipoDocumentoDTO[];
    public allGeneros: GeneroDTO[];
    public clientesTableColumns: string[] = ['nombres', 'apellidos', 'correo', 'numeroDocumento', 'fechaRegistro', 'activarDesactivar', 'acciones'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _clienteService: ClienteService,
        private _parametroGeneralService: ParametroGeneralService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toolService: ToolService,) {
    }

    ngAfterViewInit() {
        this.allClientesDataSource.sort = this.clienteTableMatSort;
        this.allClientesDataSource.paginator = this._paginator;
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

    formFiltros() {
        this.decodeToken = this.obtenerInfouserInfoLogueado();
        this.filtroClienteForm = this._formBuilder.group({
            tiposDocumento: [''],
            numeroDocumento: [''],
            generos: [''],
            nombres: [''],
            apellidos: [''],
            celular: [''],
            direccion: [''],
            correoElectronico: [''],
            fechaRegistroInicio: [this._toolService.getStartDateOfMonth()],
            fechaRegistroFin: [this._toolService.getEndDateOfMonth()],
        });
    }

    getFilterComboConsulta() {
        const request = this.obtenerRequest();
        forkJoin({
            dataClientes: this._clienteService.GetAllByFilterAsync(request),
            dataTipoDocumentos: this._parametroGeneralService.GetAllTipoDocumentoAsync(),
            dataGeneros: this._parametroGeneralService.GetAllGeneroAsync(),
        }).subscribe({
            next: (response) => {

                this.allClientesDataSource.data = response.dataClientes;
                this.allTiposDocumentos = response.dataTipoDocumentos;
                this.allGeneros = response.dataGeneros;

                this.filtroClienteForm.get('tiposDocumento')?.setValue(this.allTiposDocumentos);
                this.filtroClienteForm.get('generos')?.setValue(this.allGeneros);

                this.pageSlice.data = [];

                if (this.allClientesDataSource.data.length > Numeracion.Cero) {
                    this.disabledExportar = Flags.False;
                    this.setPageSlice(this.allClientesDataSource.data);
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

        this._clienteService.GetAllByFilterAsync(request).subscribe((response: ClienteDTO[]) => {
            this.allClientesDataSource.data = response;
            this.pageSlice.data = [];
            if (this.allClientesDataSource.data.length > Numeracion.Cero) {
                this.disabledExportar = Flags.False;
                this.setPageSlice(this.allClientesDataSource.data);
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

    UpdateActivoClienteAsync(cliente: ClienteDTO, isChecked: boolean): void {

        const destinationTimeZoneId = this._toolService.getTimeZone()
        const idUsuario = this.decodeToken.idUsuario;
        const idCliente = cliente.id;

        if (FuseValidators.isEmptyInputValue(idCliente)) {
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

        const request = new ActualizarActivoClienteRequest();
        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.id = idCliente;
        request.idUsuario = idUsuario;
        request.activo = isChecked;
        this.disabledAcciones = Flags.True;
        this._clienteService.UpdateActivoAsync(request).subscribe((response: ResponseDTO) => {

            if (response.success) {
                const data = this.allClientesDataSource.data;
                const clienteToUpdate = data.find(item => item.id === cliente.id);
                if (clienteToUpdate) {
                    clienteToUpdate.activo = isChecked;
                }
                this.allClientesDataSource.data = data;
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

    onShowFormRegistrarCliente() {
        const dialogRef = this._matDialog.open(RegistroClientePageComponent, {
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

    onShowFormModificaCliente(cliente: ClienteDTO) {
        const dialogRef = this._matDialog.open(ModificaClientePageComponent, {
            data: {
                cliente: cliente,
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

    onShowFormDetallecliente(cliente: ClienteDTO) {
        this.showFormDetalleClienteDialog(cliente);
    }

    showFormDetalleClienteDialog(cliente: ClienteDTO) {
        this._matDialog.open(DetalleClientePageComponent, {
            autoFocus: Flags.False,
            data: {
                cliente: cliente,
                lstTipoDocumento: this.allTiposDocumentos,
                lstGenero: this.allGeneros,
            }
        });
    }

    DeleteAsync(cliente: ClienteDTO) {
        this.configForm = this._formBuilder.group({
            title: 'Borrar cliente',
            message: '¿Seguro que quieres borrar el cliente ' + cliente.nombres + '?.',
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
            const idCliente = cliente.id;

            if (FuseValidators.isEmptyInputValue(idCliente)) {
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

            if (FuseValidators.isEmptyInputValue(idCliente)) {
                this._toolService.showWarning(DictionaryWarning.InvalidIdCliente, DictionaryWarning.Tittle);
                return;
            }

            const request = new EliminarClienteRequest();
            request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
            request.id = idCliente;
            request.idUsuario = idUsuario;
            this.disabledAcciones = Flags.True;

            this._clienteService.DeleteAsync(request).subscribe((response: ResponseDTO) => {

                if (response.code == ErrorCodigo.Advertencia) {
                    this._toolService.showWarning(response.message, response.titleMessage);
                    this.disabledAcciones = Flags.False;
                    this.hideSkeleton();
                    return;
                }

                if (response.success) {
                    this._toolService.showSuccess(response.message, response.titleMessage);
                    this.removeRowSelected(idCliente);
                    this.setPageSlice(this.allClientesDataSource.data);
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

    obtenerRequest(): ObtenerClienteRequest {

        const request = new ObtenerClienteRequest();

        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.lstTipoDocumento = [];
        request.lstGenero = [];
        request.numeroDocumento = this.filtroClienteForm.get('numeroDocumento').value == "" ? null : this.filtroClienteForm.get('numeroDocumento').value;
        request.nombres = this.filtroClienteForm.get('nombres').value == "" ? null : this.filtroClienteForm.get('nombres').value;
        request.apellidos = this.filtroClienteForm.get('apellidos').value == "" ? null : this.filtroClienteForm.get('apellidos').value;
        request.celular = this.filtroClienteForm.get('celular').value == "" ? null : this.filtroClienteForm.get('celular').value;
        request.direccion = this.filtroClienteForm.get('direccion').value == "" ? null : this.filtroClienteForm.get('direccion').value;
        request.correoElectronico = this.filtroClienteForm.get('correoElectronico').value == "" ? null : this.filtroClienteForm.get('correoElectronico').value;
        request.fechaRegistroInicio = this.filtroClienteForm.get('fechaRegistroInicio').value == "" ? null : this.filtroClienteForm.get('fechaRegistroInicio').value;
        request.fechaRegistroFin = this.filtroClienteForm.get('fechaRegistroFin').value == "" ? null : this.filtroClienteForm.get('fechaRegistroFin').value;

        if (this.selectTipoDocumentoItem) {
            const selectTipoDocumento = this.selectTipoDocumentoItem.options.filter(x => x.selected == true && x.value != 0)
            selectTipoDocumento.forEach(element => {
                request.lstTipoDocumento?.push(element.value.id);
            });
        }

        if (this.selectGeneroItem) {
            const selectGenero = this.selectGeneroItem.options.filter(x => x.selected == true && x.value != 0)
            selectGenero.forEach(element => {
                request.lstGenero?.push(element.value.id);
            });
        }

        return request;
    }

    onExportar() {

        if (this.pageSlice.data.length === Numeracion.Cero) { return; }

        const fileName = ArchivoExcel.NombreExcelExportarClientes;
        const nameSheet = ArchivoExcel.NombreHojaExcelClientes;

        const dataSource: ClienteDTO[] = this.allClientesDataSource.data;
        const reportData: any[] = [];

        dataSource.forEach(element => {
            const data = {
                "Tipo De Documento": element.tipoDocumento.descripcion,
                "Número De Documento": element.numeroDocumento,
                "Nombres": element.nombres,
                "Apellidos": element.apellidos,
                "Correo Electrónico": element.correoElectronico,
                "Celular": element.celular,
                "Dirección": element.direccion,
                "Fecha Registro": this._toolService.formatoFecha(element.fechaRegistro),
                "¿Activo?": element.activo == Flags.False ? "No" : "Si",
            };
            reportData.push(data);
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(reportData, {
            header: ["Tipo De Documento", "Número De Documento", "Nombres", "Apellidos", "Correo Electrónico", "Celular", "Dirección", "Fecha Registro", "¿Activo?"]
        });

        const columnWidths = reportData.reduce((widths, row) => {
            Object.keys(row).forEach((key, i) => {
                const valueLength = row[key] ? row[key].toString().length : 20;
                widths[i] = Math.max(widths[i] || 20, valueLength);
            });
            return widths;
        }, []);

        ws['!cols'] = columnWidths.map(w => ({ width: w + Numeracion.Cuatro }));

        const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1"];
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

        // Aplicar color dinámico de fondo a la columna "Categoría" (B)
        Object.keys(ws).forEach(cell => {
            const col = cell[0]; // Columna (A, B, C, etc.)
            const row = parseInt(cell.substring(1), 10); // Fila (1, 2, 3, etc.)
            if (!isNaN(row) && row > 1) { // Aplicar estilo solo a las filas de datos

                // Centramos "Fecha Ingreso" y "¿Activo?"
                if (col === "A" || col === "B" || col === "C" || col === "D" || col === "E" || col === "F" || col === "G" || col === "H" || col === "J" || col === "K" || col === "I") {
                    if (ws[cell]) {
                        ws[cell].s = {
                            alignment: { horizontal: "center", vertical: "center" }
                        };
                    }
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
        if (endIndex > this.allClientesDataSource.data.length) {
            endIndex = this.allClientesDataSource.data.length;
        }

        this.pageSlice.data = this.allClientesDataSource.data.slice(startIndex, endIndex);
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
        const index = this.allClientesDataSource.data.findIndex(cliente => cliente.id === id);
        if (index !== -1) {
            this.allClientesDataSource.data.splice(index, Numeracion.Uno);
        }
    }

    closedDrawer() {
        this.matDrawer.close();
    }

    getSkeletonCount() {
        this.skeletonNumber = this.allClientesDataSource.data.length == Numeracion.Cero ? Numeracion.Ocho : this.allClientesDataSource.data.length + Numeracion.Uno
    }

    showSkeleton() {
        this.skeleton = Flags.Show
    }

    hideSkeleton() {
        this.skeleton = Flags.Hide
    }

}
