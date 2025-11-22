import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ArchivoExcel, DictionaryInfo, ErrorCodigo, Flags, ImagenesUrl, Numeracion } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { FuseValidators } from '@fuse/validators';
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { SpanishMarcaPaginatorService } from 'app/core/services/paginator/inventario/marca/spanish-lista-marca-paginator.service';
import { RegistrarMarcaRequest } from 'app/core/models/inventario/marca/request/registrar-marca-request.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ObtenerMarcaRequest } from 'app/core/models/inventario/marca/request/obtener-marca-request.model';
import { EliminarMarcaRequest } from 'app/core/models/inventario/marca/request/eliminar-marca-request.model';
import { ModificaMarcaPageComponent } from './modals/modifica-marca-page/modifica-marca-page.component';
import { DetalleMarcaPageComponent } from './modals/detalle-marca-page/detalle-marca-page.component';
import { ActualizarActivoMarcaRequest } from 'app/core/models/inventario/marca/request/actualizar-activo-marca-request.model';
import { RegistroMarcaPageComponent } from './modals/registro-marca-page/registro-marca-page.component';
import * as XLSX from 'xlsx-js-style';

@Component({
    selector: 'app-marca-page',
    templateUrl: './marca-page.component.html',
    styleUrl: './marca-page.component.scss',
    providers: [
        {
            provide: MatPaginatorIntl,
            useClass: SpanishMarcaPaginatorService,
        }
    ],
})

export class MarcaPageComponent implements OnInit, AfterViewInit, OnDestroy {

    private decodeToken: DecodedToken;
    private configForm: UntypedFormGroup;

    public disabledAcciones: boolean = Flags.False;
    public disabledBuscar: boolean = Flags.False;
    public disabledExportar: boolean = Flags.False;

    public skeleton: boolean = Flags.False;
    public skeletonNumber: number = Numeracion.Ocho;

    public textoResultadoTable: string = "";

    public imgNoDataUltimosRegistros: string = ImagenesUrl.noDataUltimosRegistros;

    @ViewChild('marcaTable', { read: MatSort })
    private marcaTableMatSort: MatSort;

    @ViewChild('matDrawer')
    private matDrawer: MatDrawer;

    filtroMarcaForm: UntypedFormGroup;

    @ViewChild(MatPaginator) private _paginator: MatPaginator;

    public pageSlice: MatTableDataSource<MarcaDTO> = new MatTableDataSource();
    public allMarcaDataSource: MatTableDataSource<MarcaDTO> = new MatTableDataSource();
    public marcaTableColumns: string[] = ['nombre', 'descripcion', 'fechaRegistro', 'activarDesactivar', 'acciones'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _inventarioService: InventarioService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toolService: ToolService,) {
    }

    ngAfterViewInit() {
        this.allMarcaDataSource.sort = this.marcaTableMatSort;
        this.allMarcaDataSource.paginator = this._paginator;
    }

    ngOnDestroy() {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngOnInit() {
        this.formFiltros();
        this.showSkeleton();
        this.GetAllMarcaByFilterAsync(Flags.False, Flags.False, Flags.True);
    }

    formFiltros() {
        this.decodeToken = this.obtenerInfouserInfoLogueado();
        this.filtroMarcaForm = this._formBuilder.group({
            nombre: [''],
            descripcion: ['', [Validators.maxLength(Numeracion.DoscientosCincuenta)]],
            color: ['', []]
        });
    }

    GetAllMarcaByFilterAsync(disabledBuscar: boolean, hideFilter: boolean, esBusquedaBoton: boolean) {
        const request = this.obtenerRequest();

        this.disabledBuscar = disabledBuscar;

        this._inventarioService.GetAllMarcaByFilterAsync(request).subscribe((response: MarcaDTO[]) => {
            this.allMarcaDataSource.data = response;
            this.pageSlice.data = [];
            if (this.allMarcaDataSource.data.length > Numeracion.Cero) {
                this.disabledExportar = Flags.False;
                this.setPageSlice(this.allMarcaDataSource.data);
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
            this.disabledExportar = Flags.True;
            console.log(err);
            if (hideFilter) {
                this.closedDrawer();
            }
        });
    }

    UpdateActivoMarcaAsync(marca: MarcaDTO, isChecked: boolean): void {

        const destinationTimeZoneId = this._toolService.getTimeZone()
        const idUsuario = this.decodeToken.idUsuario;
        const idCategoria = marca.id;

        if (FuseValidators.isEmptyInputValue(idCategoria)) {
            this._toolService.showWarning(DictionaryWarning.InvalidCategoria, DictionaryWarning.Tittle);
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

        const request = new ActualizarActivoMarcaRequest();
        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.id = idCategoria;
        request.idUsuario = idUsuario;
        request.activo = isChecked;
        this.disabledAcciones = Flags.True;
        this._inventarioService.UpdateActivoMarcaAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success) {
                const data = this.allMarcaDataSource.data;
                const marcaToUpdate = data.find(item => item.id === marca.id);
                if (marcaToUpdate) {
                    marcaToUpdate.activo = isChecked;
                }
                this.allMarcaDataSource.data = data;
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

    onShowFormRegistrarMarca() {
        const dialogRef = this._matDialog.open(RegistroMarcaPageComponent, {
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllMarcaByFilterAsync(Flags.False, Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormModificaMarca(marca: MarcaDTO) {
        const dialogRef = this._matDialog.open(ModificaMarcaPageComponent, {
            data: {
                marca: marca,
            }
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllMarcaByFilterAsync(Flags.False, Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormDetalleMarca(marca: MarcaDTO) {
        this.showFormDetalleMarcaDialog(marca);
    }

    showFormDetalleMarcaDialog(marca: MarcaDTO) {
        this._matDialog.open(DetalleMarcaPageComponent, {
            autoFocus: Flags.False,
            data: {
                marca: marca,
            }
        });
    }

    DeleteAsync(marca: MarcaDTO) {
        this.configForm = this._formBuilder.group({
            title: 'Borrar marca',
            message: '¿Seguro que quieres borrar la marca ' + marca.nombre + '?.',
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
            const idMarca = marca.id;

            if (FuseValidators.isEmptyInputValue(idMarca)) {
                this._toolService.showWarning(DictionaryWarning.InvalidMarca, DictionaryWarning.Tittle);
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

            const request = new EliminarMarcaRequest();
            request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
            request.id = idMarca;
            request.idUsuario = idUsuario;
            this.disabledAcciones = Flags.True;

            this._inventarioService.DeleteMarcaAsync(request).subscribe((response: ResponseDTO) => {

                if (response.code == ErrorCodigo.Advertencia) {
                    this._toolService.showWarning(response.message, response.titleMessage);
                    this.disabledAcciones = Flags.False;
                    this.hideSkeleton();
                    return;
                }

                if (response.success) {
                    this._toolService.showSuccess(response.message, response.titleMessage);
                    this.removeRowSelected(idMarca);
                    this.setPageSlice(this.allMarcaDataSource.data);
                    this.disabledAcciones = Flags.False;
                    this.getSkeletonCount();
                    this.showSkeleton();
                    this.GetAllMarcaByFilterAsync(Flags.False, Flags.False, Flags.False);
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
        this.GetAllMarcaByFilterAsync(Flags.True, Flags.True, Flags.True);
    }

    onExportar() {
        if (this.pageSlice.data.length === Numeracion.Cero) { return; }

        const fileName = ArchivoExcel.NombreExcelExportarMarcas;
        const nameSheet = ArchivoExcel.NombreHojaExcelMarcas;

        const dataSource: MarcaDTO[] = this.allMarcaDataSource.data;
        const reportData: any[] = [];
        const marcaColors: { [key: number]: string } = {};

        dataSource.forEach(element => {

            const data = {
                "Nombre Marca": element.nombre,
                "Descripcion": element.descripcion,
                "Fecha Registro": this._toolService.formatoFecha(element.fechaRegistro),
                "¿Activo?": element.activo == Flags.False ? "No" : "Si",
            };
            reportData.push(data);

            // Almacenar el color de la marca
            if (element.color) {
                marcaColors[element.nombre] = element.color;
            }
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(reportData, {
            header: ["Nombre Marca", "Descripcion", "Fecha Registro", "¿Activo?"]
        });

        const columnWidths = reportData.reduce((widths, row) => {
            Object.keys(row).forEach((key, i) => {
                const valueLength = row[key] ? row[key].toString().length : 20;
                widths[i] = Math.max(widths[i] || 20, valueLength);
            });
            return widths;
        }, []);

        ws['!cols'] = columnWidths.map(w => ({ width: w + Numeracion.Cuatro }));

        // Aplicar estilo a las cabeceras
        const headerKeys = ["A1", "B1", "C1", "D1"]; // Ajusta según tus columnas
        headerKeys.forEach(cell => {
            if (ws[cell]) {
                ws[cell].s = {
                    fill: { fgColor: { rgb: "4f46e5" } },  
                    font: { bold: true, color: { rgb: "ffffff" } }, // Texto blanco y negrita
                    alignment: { horizontal: "center", vertical: "center" }, // Centrar texto en la cabecera

                };
            }
        });

        // Aplicar color dinámico de fondo a la columna "Categoría" (B)
        Object.keys(ws).forEach(cell => {
            const col = cell[0]; // Columna (A, B, C, etc.)
            const row = parseInt(cell.substring(1), 10); // Fila (1, 2, 3, etc.)
            if (!isNaN(row) && row > 1) { // Aplicar estilo solo a las filas de datos
                if (col === "A") { // Columna "Categoría"
                    const categoryName = ws[cell]?.v; // Obtener el nombre de la categoría
                    const categoryColor = marcaColors[categoryName]; // Buscar el color correspondiente
                    if (categoryColor) {
                        ws[cell].s = {
                            fill: { fgColor: { rgb: categoryColor.replace("#", "") } }, // Usar el color de la categoría
                            font: { color: { rgb: "ffffff" } } // Texto blanco
                        };
                    }
                }
 
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
 
    obtenerRequest(): ObtenerMarcaRequest {

        const request = new ObtenerMarcaRequest();

        request.nombre = this.filtroMarcaForm.get('nombre').value == "" ? "" : this.filtroMarcaForm.get('nombre').value;
        request.idUsuario = this.decodeToken.idUsuario;

        return request;
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
        if (endIndex > this.allMarcaDataSource.data.length) {
            endIndex = this.allMarcaDataSource.data.length;
        }

        this.pageSlice.data = this.allMarcaDataSource.data.slice(startIndex, endIndex);
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

    removeRowSelected(id: number) {
        const index = this.allMarcaDataSource.data.findIndex(ingresoEstado => ingresoEstado.id === id);
        if (index !== -1) {
            this.allMarcaDataSource.data.splice(index, Numeracion.Uno);
        }
    }

    closedDrawer() {
        this.matDrawer.close();
    }

    getSkeletonCount() {
        this.skeletonNumber = this.allMarcaDataSource.data.length == Numeracion.Cero ? Numeracion.Ocho : this.allMarcaDataSource.data.length + Numeracion.Uno
    }

    showSkeleton() {
        this.skeleton = Flags.Show
    }

    hideSkeleton() {
        this.skeleton = Flags.Hide
    }

}
