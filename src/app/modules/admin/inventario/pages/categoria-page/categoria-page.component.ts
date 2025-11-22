import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { RegistroCategoriaPageComponent } from './modals/registro-categoria-page/registro-categoria-page.component';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ArchivoExcel, DictionaryInfo, ErrorCodigo, Flags, ImagenesUrl, Numeracion, OrigenPlataforma } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { ModificaCategoriaPageComponent } from './modals/modifica-categoria-page/modifica-categoria-page.component';
import { DetalleCategoriaPageComponent } from './modals/detalle-categoria-page/detalle-categoria-page.component';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ObtenerCategoriaRequest } from 'app/core/models/inventario/categoria/request/obtener-categoria-request.model';
import { FuseValidators } from '@fuse/validators';
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { SpanishCategoriaPaginatorService } from 'app/core/services/paginator/inventario/categoria/spanish-lista-categoria-paginator.service';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { ActualizarActivoCategoriaRequest } from 'app/core/models/inventario/categoria/request/actualizar-activo-categoria-request.model';
import { EliminarCategoriaRequest } from 'app/core/models/inventario/categoria/request/eliminar-categoria-request.model';
import { MedidaDTO } from '../../../../../core/models/inventario/medida/response/medida-dto.model';
import * as XLSX from 'xlsx-js-style';

@Component({
    selector: 'app-categoria-page',
    templateUrl: './categoria-page.component.html',
    styleUrl: './categoria-page.component.scss',
    providers: [
        {
            provide: MatPaginatorIntl,
            useClass: SpanishCategoriaPaginatorService,
        }
    ],
})

export class CategoriaPageComponent implements OnInit, AfterViewInit, OnDestroy {

    private decodeToken: DecodedToken;
    private configForm: UntypedFormGroup;

    public disabledAcciones: boolean = Flags.False;
    public disabledBuscar: boolean = Flags.False;
    public disabledExportar: boolean = Flags.False;

    public skeleton: boolean = Flags.False;
    public skeletonNumber: number = Numeracion.Ocho;

    public textoResultadoTable: string = "";

    public imgNoDataUltimosRegistros: string = ImagenesUrl.noDataUltimosRegistros;

    @ViewChild('categoriaTable', { read: MatSort })
    private categoriaTableMatSort: MatSort;

    @ViewChild('matDrawer')
    private matDrawer: MatDrawer;

    filtroCategoriaForm: UntypedFormGroup;

    @ViewChild(MatPaginator) private _paginator: MatPaginator;

    public pageSlice: MatTableDataSource<CategoriaDTO> = new MatTableDataSource();
    public allCategoriaDataSource: MatTableDataSource<CategoriaDTO> = new MatTableDataSource();
    public allMedidaDataSource: MedidaDTO[];
    public categoriaTableColumns: string[] = ['nombre', 'medida', 'descripcion', 'fechaRegistro', 'activarDesactivar', 'acciones'];
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
        this.allCategoriaDataSource.sort = this.categoriaTableMatSort;
        this.allCategoriaDataSource.paginator = this._paginator;
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
        this.filtroCategoriaForm = this._formBuilder.group({
            nombre: [''],
        });
    }

    getFilterComboConsulta() {
        const request = this.obtenerRequest();
        forkJoin({
            dataCategorias: this._inventarioService.GetAllCategoriaByFilterAsync(request),
            dataMedidas: this._inventarioService.GetAllMedidaAsync(this.decodeToken.idUsuario),
        }).subscribe({
            next: (response) => {
                this.allCategoriaDataSource.data = response.dataCategorias;
                this.allMedidaDataSource = response.dataMedidas;
                this.pageSlice.data = [];
                if (this.allCategoriaDataSource.data.length > Numeracion.Cero) {
                    this.disabledExportar = Flags.False;
                    this.setPageSlice(this.allCategoriaDataSource.data);
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

    GetAllCategoriaByFilterAsync(disabledBuscar: boolean, hideFilter: boolean, esBusquedaBoton: boolean) {
        const request = this.obtenerRequest();

        this.disabledBuscar = disabledBuscar;

        this._inventarioService.GetAllCategoriaByFilterAsync(request).subscribe((response: CategoriaDTO[]) => {
            this.allCategoriaDataSource.data = response;
            this.pageSlice.data = [];
            if (this.allCategoriaDataSource.data.length > Numeracion.Cero) {
                this.disabledExportar = Flags.False;
                this.setPageSlice(this.allCategoriaDataSource.data);
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


    UpdateActivoCategoriaAsync(categoria: CategoriaDTO, isChecked: boolean): void {

        const destinationTimeZoneId = this._toolService.getTimeZone()
        const origenActualizacion = this.isMobilSize() == Flags.True ? OrigenPlataforma.PWA : OrigenPlataforma.Web;
        const idUsuario = this.decodeToken.idUsuario;
        const idCategoria = categoria.id;

        if (FuseValidators.isEmptyInputValue(idCategoria)) {
            this._toolService.showWarning(DictionaryWarning.InvalidCategoria, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
            this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(origenActualizacion)) {
            this._toolService.showWarning(DictionaryWarning.InvalidOrigenActualizacion, DictionaryWarning.Tittle);
            return;
        }

        if (FuseValidators.isEmptyInputValue(idUsuario)) {
            this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
            return;
        }

        const request = new ActualizarActivoCategoriaRequest();
        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.id = idCategoria;
        request.idUsuario = idUsuario;
        request.activo = isChecked;
        this.disabledAcciones = Flags.True;
        this._inventarioService.UpdateActivoCategoriaAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success) {
                const data = this.allCategoriaDataSource.data;
                const categoriaToUpdate = data.find(item => item.id === categoria.id);
                if (categoriaToUpdate) {
                    categoriaToUpdate.activo = isChecked;
                }
                this.allCategoriaDataSource.data = data;
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

    onShowFormRegistrarCategoria() {
        const dialogRef = this._matDialog.open(RegistroCategoriaPageComponent, {
            data: {
                lstMedida: this.allMedidaDataSource
            }
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllCategoriaByFilterAsync(Flags.False, Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormModificaCategoria(categoria: CategoriaDTO) {
        const dialogRef = this._matDialog.open(ModificaCategoriaPageComponent, {
            data: {
                categoria: categoria,
                lstMedida: this.allMedidaDataSource
            }
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllCategoriaByFilterAsync(Flags.False, Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormDetalleCategoria(categoria: CategoriaDTO) {
        this.showFormDetalleCategoriaDialog(categoria);
    }

    showFormDetalleCategoriaDialog(categoria: CategoriaDTO) {
        this._matDialog.open(DetalleCategoriaPageComponent, {
            autoFocus: Flags.False,
            data: {
                categoria: categoria,
                lstMedida: this.allMedidaDataSource,
            }
        });
    }

    DeleteAsync(categoria: CategoriaDTO) {
        this.configForm = this._formBuilder.group({
            title: 'Borrar categoría',
            message: '¿Seguro que quieres borrar la categoría ' + categoria.nombre + '?.',
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
            const idCategoria = categoria.id;

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

            const request = new EliminarCategoriaRequest();
            request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
            request.id = idCategoria;
            request.idUsuario = idUsuario;
            this.disabledAcciones = Flags.True;

            this._inventarioService.DeleteCategoriaAsync(request).subscribe((response: ResponseDTO) => {
 
                if (response.code == ErrorCodigo.Advertencia) {
                    this._toolService.showWarning(response.message, response.titleMessage);
                    this.disabledAcciones = Flags.False;
                    this.hideSkeleton();
                    return;
                }

                if (response.success) {
                    this._toolService.showSuccess(response.message, response.titleMessage);
                    this.removeRowSelected(idCategoria);
                    this.setPageSlice(this.allCategoriaDataSource.data);
                    this.disabledAcciones = Flags.False;
                    this.getSkeletonCount();
                    this.showSkeleton();
                    this.GetAllCategoriaByFilterAsync(Flags.False, Flags.False, Flags.False);
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
        this.GetAllCategoriaByFilterAsync(Flags.True, Flags.True, Flags.True);
    }

    onExportar() {
        if (this.pageSlice.data.length === Numeracion.Cero) { return; }

        const fileName = ArchivoExcel.NombreExcelExportarCategorias;
        const nameSheet = ArchivoExcel.NombreHojaExcelCategorias;

        const dataSource: CategoriaDTO[] = this.allCategoriaDataSource.data;
        const reportData: any[] = [];
        const marcaColors: { [key: number]: string } = {};

        dataSource.forEach(element => {

            const data = {
                "Nombre Categoría": element.nombre,
                "Medida": element.medida.nombre,
                "Descripcion": element.descripcion,
                "Fecha Registro": this._toolService.formatoFecha(element.fechaRegistro),
                "¿Activo?": element.activo == Flags.False ? "No" : "Si",
            };
            reportData.push(data);

            // Almacenar el color de la categoría
            if (element.color) {
                marcaColors[element.nombre] = element.color;
            }
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(reportData, {
            header: ["Nombre Categoría", "Medida", "Descripcion", "Fecha Registro", "¿Activo?"]
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
        const headerKeys = ["A1", "B1", "C1", "D1", "E1"]; // Ajusta según tus columnas
        headerKeys.forEach(cell => {
            if (ws[cell]) {
                ws[cell].s = {
                    fill: { fgColor: { rgb: "4f46e5" } }, // Fondo azul
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

    obtenerRequest(): ObtenerCategoriaRequest {

        const request = new ObtenerCategoriaRequest();

        request.nombre = this.filtroCategoriaForm.get('nombre').value == "" ? "" : this.filtroCategoriaForm.get('nombre').value;
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
        if (endIndex > this.allCategoriaDataSource.data.length) {
            endIndex = this.allCategoriaDataSource.data.length;
        }

        this.pageSlice.data = this.allCategoriaDataSource.data.slice(startIndex, endIndex);
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
        const index = this.allCategoriaDataSource.data.findIndex(ingresoEstado => ingresoEstado.id === id);
        if (index !== -1) {
            this.allCategoriaDataSource.data.splice(index, Numeracion.Uno);
        }
    }

    closedDrawer() {
        this.matDrawer.close();
    }

    getSkeletonCount() {
        this.skeletonNumber = this.allCategoriaDataSource.data.length == Numeracion.Cero ? Numeracion.Ocho : this.allCategoriaDataSource.data.length + Numeracion.Uno
    }

    showSkeleton() {
        this.skeleton = Flags.Show
    }

    hideSkeleton() {
        this.skeleton = Flags.Hide
    }

}
