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
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MatSelect } from '@angular/material/select';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { ParametroGeneralService } from 'app/core/services/parametro/parametro-general.service';
import * as XLSX from 'xlsx-js-style';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { ModificaUsuariosPageComponent } from './modals/modifica-usuarios-page/modifica-usuarios-page.component';
import { DetalleUsuariosPageComponent } from './modals/detalle-usuarios-page/detalle-usuarios-page.component';
import { SpanishUsuariosPaginatorService } from 'app/core/services/paginator/usuarios/spanish-lista-usuarios-paginator.service';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';
import { ObtenerUsuarioRequest } from 'app/core/models/usuario/request/obtener-usuario-request.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';
import { RegistroUsuariosPageComponent } from './modals/registro-usuarios-page/registro-usuarios-page.component';
import { RolDTO } from 'app/core/models/parametro/rol-dto.model';
import { FuseValidators } from '@fuse/validators';
import { EliminarUsuarioRequest } from 'app/core/models/usuario/request/eliminar-usuario-request.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ActualizarActivoUsuarioRequest } from 'app/core/models/usuario/request/actualizar-activo-usuario-request.model';

@Component({
    selector: 'app-lista-usuarios-page',
    templateUrl: './lista-usuarios-page.component.html',
    styleUrl: './lista-usuarios-page.component.scss',
    providers: [
        {
            provide: MatPaginatorIntl,
            useClass: SpanishUsuariosPaginatorService,
        }
    ],
})

export class ListaUsuariosPageComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('selectGeneroItem') selectGeneroItem: MatSelect;
    @ViewChild('selectOcupacionItem') selectOcupacionItem: MatSelect;

    private decodeToken: DecodedToken;
    private configForm: UntypedFormGroup;

    public disabledAcciones: boolean = Flags.False;
    public disabledBuscar: boolean = Flags.False;
    public disabledExportar: boolean = Flags.False;

    public skeleton: boolean = Flags.False;
    public skeletonNumber: number = Numeracion.Ocho;

    public textoResultadoTable: string = "";
    public imgNoDataUltimosRegistros: string = ImagenesUrl.noDataUltimosRegistros;

    @ViewChild('usuariosTable', { read: MatSort })
    private usuariosTableMatSort: MatSort;

    @ViewChild('matDrawer')
    private matDrawer: MatDrawer;

    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    filtroUsuarioForm: UntypedFormGroup;

    @ViewChild(MatPaginator) private _paginator: MatPaginator;

    public pageSlice: MatTableDataSource<UsuarioDTO> = new MatTableDataSource();
    public allUsuariosDataSource: MatTableDataSource<UsuarioDTO> = new MatTableDataSource();
    public allGeneros: GeneroDTO[];
    public allRol: RolDTO[];
    public allTipoDocumento: TipoDocumentoDTO[];

    public usuariosTableColumns: string[] = ['nombres', 'apellidos', 'rol', 'correo', 'celular', 'fechaRegistro', 'activarDesactivar', 'acciones'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _usuarioService: UsuarioService,
        private _parametroGeneralService: ParametroGeneralService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toolService: ToolService,) {
    }

    ngAfterViewInit() {
        this.allUsuariosDataSource.sort = this.usuariosTableMatSort;
        this.allUsuariosDataSource.paginator = this._paginator;
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
        this.filtroUsuarioForm = this._formBuilder.group({
            tiposDocumento: [''],
            numeroDocumento: [''],
            generos: [''],
            ocupaciones: [''],
            estadosCuenta: [''],
            nombres: [''],
            apellidos: [''],
            correoElectronico: [''],
            fechaRegistroInicio: [this._toolService.getStartDateOfMonth()],
            fechaRegistroFin: [this._toolService.getEndDateOfMonth()],
        });
    }

    getFilterComboConsulta() {
        const request = this.obtenerRequest();
        forkJoin({
            dataUsuarios: this._usuarioService.GetAllByFilterAsync(request),
            dataGeneros: this._parametroGeneralService.GetAllGeneroAsync(),
            dataTipoDocumento: this._parametroGeneralService.GetAllTipoDocumentoAsync(),
            dataRol: this._parametroGeneralService.GetAllRolAsync(),
        }).subscribe({
            next: (response) => {
                this.allUsuariosDataSource.data = response.dataUsuarios;
                this.allTipoDocumento = response.dataTipoDocumento;
                this.allGeneros = response.dataGeneros;
                this.allRol = response.dataRol;

                this.filtroUsuarioForm.get('tipoDocumento')?.setValue(this.allTipoDocumento);
                this.filtroUsuarioForm.get('generos')?.setValue(this.allGeneros);
                this.filtroUsuarioForm.get('rol')?.setValue(this.allRol);

                this.pageSlice.data = [];
                if (this.allUsuariosDataSource.data.length > Numeracion.Cero) {
                    this.disabledExportar = Flags.False;
                    this.setPageSlice(this.allUsuariosDataSource.data);
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

        this._usuarioService.GetAllByFilterAsync(request).subscribe((response: UsuarioDTO[]) => {
            this.allUsuariosDataSource.data = response;
            this.pageSlice.data = [];
            if (this.allUsuariosDataSource.data.length > Numeracion.Cero) {
                this.disabledExportar = Flags.False;
                this.setPageSlice(this.allUsuariosDataSource.data);
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

    UpdateActivoUsuarioAsync(usuario: UsuarioDTO, isChecked: boolean): void {

        const destinationTimeZoneId = this._toolService.getTimeZone()
        const idUsuario = this.decodeToken.idUsuario;
        const idUsuarioSelected = usuario.usuarioID.idUsuarioGuid;

        if (FuseValidators.isEmptyInputValue(idUsuario)) {
            this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(idUsuarioSelected)) {
            this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuarioSelected, DictionaryWarning.Tittle);
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

        const request = new ActualizarActivoUsuarioRequest();
        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.idUsuarioSeleccionado = idUsuarioSelected;
        request.idUsuario = idUsuario;
        request.activo = isChecked;
        this.disabledAcciones = Flags.True;
        this._usuarioService.UpdateActivoAsync(request).subscribe((response: ResponseDTO) => {

            if (response.success) {
                const data = this.allUsuariosDataSource.data;
                const usuarioToUpdate = data.find(item => item.usuarioID.idUsuarioGuid === usuario.usuarioID.idUsuarioGuid);
                if (usuarioToUpdate) {
                    usuarioToUpdate.activo = isChecked;
                }
                this.allUsuariosDataSource.data = data;
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

    onShowFormRegistrarUsuario() {
        const dialogRef = this._matDialog.open(RegistroUsuariosPageComponent, {
            data: {
                lstRol: this.allRol,
                lstGenero: this.allGeneros,
                lstTipoDocumento: this.allTipoDocumento
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

    onShowFormModificaUsuario(usuario: UsuarioDTO) {
        const dialogRef = this._matDialog.open(ModificaUsuariosPageComponent, {
            data: {
                usuario: usuario,
                lstTipoDocumento: this.allTipoDocumento,
                lstRol: this.allRol,
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

    onShowFormDetalleUsuario(usuario: UsuarioDTO) {
        this.showFormDetalleUsuarioDialog(usuario);
    }

    showFormDetalleUsuarioDialog(usuario: UsuarioDTO) {
        this._matDialog.open(DetalleUsuariosPageComponent, {
            autoFocus: Flags.False,
            data: {
                usuario: usuario,
                lstTipoDocumento: this.allTipoDocumento,
                lstRol: this.allRol,
                lstGenero: this.allGeneros,
            }
        });
    }

    DeleteAsync(usuario: UsuarioDTO) {
        this.configForm = this._formBuilder.group({
            title: 'Borrar Usuario',
            message: '¿Seguro que quieres borrar el usuario ' + usuario.nombres + '?.',
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
            const idUsuarioSelected = usuario.usuarioID.idUsuarioGuid;

            if (FuseValidators.isEmptyInputValue(idUsuario)) {
                this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
                return;
            }

            if (FuseValidators.isEmptyInputValue(idUsuarioSelected)) {
                this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
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

            const request = new EliminarUsuarioRequest();
            request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
            request.idUsuarioSeleccionado = idUsuarioSelected;
            request.idUsuario = idUsuario;
            this.disabledAcciones = Flags.True;

            this._usuarioService.DeleteAsync(request).subscribe((response: ResponseDTO) => {

                if (response.success) {
                    this._toolService.showSuccess(response.message, response.titleMessage);
                    this.removeRowSelected(idUsuarioSelected);
                    this.setPageSlice(this.allUsuariosDataSource.data);
                    this.disabledAcciones = Flags.False;
                    this.getSkeletonCount();
                    this.showSkeleton();
                    this.GetAllByFilterAsync(Flags.False, Flags.False, Flags.False);
                    return;
                }

                if (response.code == ErrorCodigo.Advertencia) {
                    this._toolService.showWarning(response.message, response.titleMessage);
                    this.disabledAcciones = Flags.False;
                    this.hideSkeleton();
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

    obtenerRequest(): ObtenerUsuarioRequest {

        const request = new ObtenerUsuarioRequest();

        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.lstGenero = [];
        request.lstOcupacion = [];
        request.lstEstadoCuenta = [];
        request.nombres = this.filtroUsuarioForm.get('nombres').value == "" ? null : this.filtroUsuarioForm.get('nombres').value;
        request.apellidos = this.filtroUsuarioForm.get('apellidos').value == "" ? null : this.filtroUsuarioForm.get('apellidos').value;
        request.correoElectronico = this.filtroUsuarioForm.get('correoElectronico').value == "" ? null : this.filtroUsuarioForm.get('correoElectronico').value;
        request.fechaRegistroInicio = this.filtroUsuarioForm.get('fechaRegistroInicio').value == "" ? null : this.filtroUsuarioForm.get('fechaRegistroInicio').value;
        request.fechaRegistroFin = this.filtroUsuarioForm.get('fechaRegistroFin').value == "" ? null : this.filtroUsuarioForm.get('fechaRegistroFin').value;

        if (this.selectGeneroItem) {
            const selectGenero = this.selectGeneroItem.options.filter(x => x.selected == true && x.value != 0)
            selectGenero.forEach(element => {
                request.lstGenero?.push(element.value.id);
            });
        }

        if (this.selectOcupacionItem) {
            const selectOcupacion = this.selectOcupacionItem.options.filter(x => x.selected == true && x.value != 0)
            selectOcupacion.forEach(element => {
                request.lstOcupacion?.push(element.value.id);
            });
        }

        return request;
    }

    onExportar() {

        if (this.pageSlice.data.length === Numeracion.Cero) { return; }

        const fileName = ArchivoExcel.NombreExcelExportarUsuarios;
        const nameSheet = ArchivoExcel.NombreHojaExcelUsuarios;

        const dataSource: UsuarioDTO[] = this.allUsuariosDataSource.data;
        const reportData: any[] = [];

        dataSource.forEach(element => {
            const data = {
                "Tipo De Documento": element.tipoDocumento.descripcion,
                "Número De Documento": element.numeroDocumento,
                "Rol": element.rol.nombre,
                "Género": element.genero.descripcion,
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
            header: ["Tipo De Documento", "Número De Documento", "Rol", "Género", "Nombres", "Apellidos", "Correo Electrónico", "Celular", "Dirección", "Fecha Registro", "¿Activo?"]
        });

        const columnWidths = reportData.reduce((widths, row) => {
            Object.keys(row).forEach((key, i) => {
                const valueLength = row[key] ? row[key].toString().length : 20;
                widths[i] = Math.max(widths[i] || 20, valueLength);
            });
            return widths;
        }, []);

        ws['!cols'] = columnWidths.map(w => ({ width: w + Numeracion.Cuatro }));

        const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "J1", "K1",];
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
        if (endIndex > this.allUsuariosDataSource.data.length) {
            endIndex = this.allUsuariosDataSource.data.length;
        }

        this.pageSlice.data = this.allUsuariosDataSource.data.slice(startIndex, endIndex);
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

    removeRowSelected(idUsuarioSeleccionado: string) {
        const index = this.allUsuariosDataSource.data.findIndex(usuario => usuario.usuarioID.idUsuarioGuid === idUsuarioSeleccionado);
        if (index !== -1) {
            this.allUsuariosDataSource.data.splice(index, Numeracion.Uno);
        }
    }

    closedDrawer() {
        this.matDrawer.close();
    }

    getSkeletonCount() {
        this.skeletonNumber = this.allUsuariosDataSource.data.length == Numeracion.Cero ? Numeracion.Ocho : this.allUsuariosDataSource.data.length + Numeracion.Uno
    }

    showSkeleton() {
        this.skeleton = Flags.Show
    }

    hideSkeleton() {
        this.skeleton = Flags.Hide
    }

}
