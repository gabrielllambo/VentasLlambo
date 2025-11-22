import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ArchivoExcel, DictionaryInfo, ErrorCodigo, Flags, ImagenesUrl, Numeracion, OrigenPlataforma } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ObtenerCategoriaRequest } from 'app/core/models/inventario/categoria/request/obtener-categoria-request.model';
import { FuseValidators } from '@fuse/validators';
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { SpanishCategoriaPaginatorService } from 'app/core/services/paginator/inventario/categoria/spanish-lista-categoria-paginator.service';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import * as XLSX from 'xlsx-js-style';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ObtenerProductoRequest } from 'app/core/models/inventario/producto/request/obtener-producto-request.model';
import { ObtenerMarcaRequest } from 'app/core/models/inventario/marca/request/obtener-marca-request.model';
import { EliminarProductoRequest } from 'app/core/models/inventario/producto/request/eliminar-producto-request.model';
import { RegistroProductoPageComponent } from './modals/registro-producto-page/registro-producto-page.component';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ActualizarActivoProductoRequest } from 'app/core/models/inventario/producto/request/actualizar-activo-producto-request.model';
import { ModificaProductoPageComponent } from './modals/modifica-producto-page/modifica-producto-page.component';
import { DetalleProductoPageComponent } from './modals/detalle-producto-page/detalle-producto-page.component';
import { MatSelect } from '@angular/material/select';

@Component({
    selector: 'app-producto-page',
    templateUrl: './producto-page.component.html',
    styleUrl: './producto-page.component.scss',
    providers: [
        {
            provide: MatPaginatorIntl,
            useClass: SpanishCategoriaPaginatorService,
        }
    ],
})

export class ProductoPageComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('selectCategoriaItem') selectCategoriaItem: MatSelect;
    @ViewChild('selectMarcaItem') selectMarcaItem: MatSelect;

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

    @ViewChild('productoTable', { read: MatSort })
    private productoTableMatSort: MatSort;

    @ViewChild('matDrawer')
    private matDrawer: MatDrawer;

    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    filtroProductoForm: UntypedFormGroup;

    @ViewChild(MatPaginator) private _paginator: MatPaginator;

    public pageSlice: MatTableDataSource<ProductoDTO> = new MatTableDataSource();
    public allProductoDataSource: MatTableDataSource<ProductoDTO> = new MatTableDataSource();
    public allCategoriaSource: CategoriaDTO[];
    public allMarcaSource: MarcaDTO[];
    public productoTableColumns: string[] = ['foto', 'codigo', 'nombre', 'categoria', 'marca', 'stock', 'precioCompra', 'precioVenta', 'fechaRegistro', 'activarDesactivar', 'acciones'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _inventarioService: InventarioService,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toolService: ToolService) {
    }

    ngAfterViewInit() {
        this.allProductoDataSource.sort = this.productoTableMatSort;
        this.allProductoDataSource.paginator = this._paginator;
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
        this.filtroProductoForm = this._formBuilder.group({
            codigo: [''],
            nombre: [''],
            categoria: [''],
            marca: [''],
            fechaRegistroInicio: [this._toolService.getStartDateOfMonth()],
            fechaRegistroFin: [this._toolService.getEndDateOfMonth()],
            precioCompraInicio: [''],
            precioCompraFin: [''],
            precioVentaInicio: [''],
            precioVentaFin: [''],
        });

    }

    getFilterComboConsulta() {
 
        const productoRequest = this.obtenerRequest();

        forkJoin({
            dataCategorias: this._inventarioService.GetAllCategoriasForComboBoxAsync(),
            dataProductos: this._inventarioService.GetAllProductoByFilterAsync(productoRequest),
            dataMarcas: this._inventarioService.GetAllMarcasForComboBoxAsync(),
        }).subscribe({
            next: (response) => {
                this.allCategoriaSource = response.dataCategorias;
                this.allMarcaSource = response.dataMarcas;
                this.allProductoDataSource.data = response.dataProductos;
                this.pageSlice.data = [];

                this.filtroProductoForm.get('categoria')?.setValue(this.allCategoriaSource);
                this.filtroProductoForm.get('marca')?.setValue(this.allMarcaSource);

                if (this.allProductoDataSource.data.length > Numeracion.Cero) {
                    this.disabledExportar = Flags.False;
                    this.setPageSlice(this.allProductoDataSource.data);
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

    GetAllProductosByFilterAsync(disabledBuscar: boolean, hideFilter: boolean) {

        const request = this.obtenerRequest();
        this.disabledBuscar = disabledBuscar;

        this._inventarioService.GetAllProductoByFilterAsync(request).subscribe((response: ProductoDTO[]) => {
            this.allProductoDataSource.data = response;
            this.pageSlice.data = [];
            if (this.allProductoDataSource.data.length > Numeracion.Cero) {
                this.disabledExportar = Flags.False;
                this.setPageSlice(this.allProductoDataSource.data);
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


    UpdateActivoProductoAsync(producto: ProductoDTO, isChecked: boolean): void {

        const destinationTimeZoneId = this._toolService.getTimeZone()
        const origenActualizacion = this.isMobilSize() == Flags.True ? OrigenPlataforma.PWA : OrigenPlataforma.Web;
        const idUsuario = this.decodeToken.idUsuario;
        const idProducto = producto.id;

        if (FuseValidators.isEmptyInputValue(idProducto)) {
            this._toolService.showWarning(DictionaryWarning.InvalidProducto, DictionaryWarning.Tittle);
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

        const request = new ActualizarActivoProductoRequest();
        request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
        request.id = idProducto;
        request.idUsuario = idUsuario;
        request.activo = isChecked;
        this.disabledAcciones = Flags.True;
        this._inventarioService.UpdateActivoProductoAsync(request).subscribe((response: ResponseDTO) => {
            if (response.success) {
                const data = this.allProductoDataSource.data;
                const categoriaToUpdate = data.find(item => item.id === producto.id);
                if (categoriaToUpdate) {
                    categoriaToUpdate.activo = isChecked;
                }
                this.allProductoDataSource.data = data;
                this.disabledAcciones = Flags.False;
                return;
            }
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
        }, err => {
            this.hideSkeleton();
            this.disabledAcciones = Flags.False;
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            console.log(err);
        });
    }

    onShowFormRegistrarProducto() {
        const dialogRef = this._matDialog.open(RegistroProductoPageComponent, {
            data: {
                lstCategoria: this.allCategoriaSource,
                lstMarca: this.allMarcaSource
            }
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllProductosByFilterAsync(Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormModificaProducto(producto: ProductoDTO) {
        const dialogRef = this._matDialog.open(ModificaProductoPageComponent, {
            data: {
                producto: producto,
                lstCategoria: this.allCategoriaSource,
                lstMarca: this.allMarcaSource
            }
        });
        dialogRef.afterClosed()
            .subscribe((response) => {
                if (response) {
                    if (response.success == Flags.SuccessTransaction) {
                        this.getSkeletonCount();
                        this.showSkeleton();
                        this.GetAllProductosByFilterAsync(Flags.False, Flags.False);
                    }
                }
            });
    }

    onShowFormDetalleProducto(producto: ProductoDTO) {
        this.showFormDetalleProductoDialog(producto);
    }

    showFormDetalleProductoDialog(producto: ProductoDTO) {
        this._matDialog.open(DetalleProductoPageComponent, {
            autoFocus: Flags.False,
            data: {
                producto: producto,
                lstCategoria: this.allCategoriaSource,
                lstMarca: this.allMarcaSource
            }
        });
    }

    DeleteAsync(producto: ProductoDTO) {
        this.configForm = this._formBuilder.group({
            title: 'Borrar Producto',
            message: '¿Seguro que quieres borrar el producto ' + producto.nombre + '?.',
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
            const idProducto = producto.id;

            if (FuseValidators.isEmptyInputValue(idProducto)) {
                this._toolService.showWarning(DictionaryWarning.InvalidProducto, DictionaryWarning.Tittle);
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

            const request = new EliminarProductoRequest();
            request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
            request.id = idProducto;
            request.idUsuario = idUsuario;
            this.disabledAcciones = Flags.True;

            this._inventarioService.DeleteProductoAsync(request).subscribe((response: ResponseDTO) => {

                if (response.code == ErrorCodigo.Advertencia) {
                    this._toolService.showWarning(response.message, response.titleMessage);
                    this.disabledAcciones = Flags.False;
                    this.hideSkeleton();
                    return;
                }

                if (response.success) {
                    this._toolService.showSuccess(response.message, response.titleMessage);
                    this.removeRowSelected(idProducto);
                    this.setPageSlice(this.allProductoDataSource.data);
                    this.disabledAcciones = Flags.False;
                    this.getSkeletonCount();
                    this.showSkeleton();
                    this.GetAllProductosByFilterAsync(Flags.False, Flags.False);
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
        this.GetAllProductosByFilterAsync(Flags.True, Flags.True);
    }

    onExportar() {
        if (this.pageSlice.data.length === Numeracion.Cero) { return; }

        const currencyFormatter = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);

        const fileName = ArchivoExcel.NombreExcelExportarProductos;
        const nameSheet = ArchivoExcel.NombreHojaExcelProductos;

        const dataSource: ProductoDTO[] = this.allProductoDataSource.data;
        const reportData: any[] = [];
        const categoriaColors: { [key: number]: string } = {};
        const marcaColors: { [key: number]: string } = {};

        dataSource.forEach(element => {

            const data = {
                "Código": element.codigo,
                "Nombre": element.nombre,
                "Categoría": element.categoria.nombre,
                "Marca": element.marca.nombre,
                "Stock": element.stock,
                "Precio Compra": currencyFormatter.format(element.precioCompra),
                "Precio Venta": currencyFormatter.format(element.precioVenta),
                "Fecha Registro": this._toolService.formatoFecha(element.fechaRegistro),
                "¿Activo?": element.activo == Flags.False ? "No" : "Si",
            };
            reportData.push(data);

            // Almacenar el color de la marca
            if (element.marca.color) {
                marcaColors[element.marca.nombre] = element.marca.color;
            }

            // Almacenar el color de la categoria
            if (element.categoria.color) {
                categoriaColors[element.categoria.nombre] = element.categoria.color;
            }

        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(reportData, {
            header: ["Código", "Nombre", "Categoría", "Marca", "Stock", "Precio Compra", "Precio Venta", "Fecha Registro", "¿Activo?"]
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
        const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1"]; // Ajusta según tus columnas
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

                if (col === "C") { // Columna "Categoría"
                    const categoryName = ws[cell]?.v; // Obtener el nombre de la categoría
                    const categoryColor = categoriaColors[categoryName]; // Buscar el color correspondiente
                    if (categoryColor) {
                        ws[cell].s = {
                            fill: { fgColor: { rgb: categoryColor.replace("#", "") } }, // Usar el color de la categoría
                            font: { color: { rgb: "ffffff" } } // Texto blanco
                        };
                    }
                }

                if (col === "D") { // Columna "Marca"
                    const marcaName = ws[cell]?.v; // Obtener el nombre de la categoría
                    const marcaColor = marcaColors[marcaName]; // Buscar el color correspondiente
                    if (marcaColor) {
                        ws[cell].s = {
                            fill: { fgColor: { rgb: marcaColor.replace("#", "") } }, // Usar el color de la categoría
                            font: { color: { rgb: "ffffff" } } // Texto blanco
                        };
                    }
                }

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

    obtenerRequest(): ObtenerProductoRequest {

        const request = new ObtenerProductoRequest();

        request.destinationTimeZoneId = this._toolService.getTimeZone();
        request.idUsuario = this.decodeToken.idUsuario;
        request.codigo = this.filtroProductoForm.get('codigo').value == "" ? null : this.filtroProductoForm.get('codigo').value;
        request.nombre = this.filtroProductoForm.get('nombre').value == "" ? null : this.filtroProductoForm.get('nombre').value;
        request.lstCategorias = [];
        request.lstMarcas = [];
        request.fechaRegistroInicio = this.filtroProductoForm.get('fechaRegistroInicio').value == "" ? null : this.filtroProductoForm.get('fechaRegistroInicio').value;
        request.fechaRegistroFin = this.filtroProductoForm.get('fechaRegistroFin').value == "" ? null : this.filtroProductoForm.get('fechaRegistroFin').value;
        request.precioCompraInicio = this.filtroProductoForm.get('precioCompraInicio').value == "" ? null : this.filtroProductoForm.get('precioCompraInicio').value;
        request.precioCompraFin = this.filtroProductoForm.get('precioCompraFin').value == "" ? null : this.filtroProductoForm.get('precioCompraFin').value;
        request.precioVentaInicio = this.filtroProductoForm.get('precioVentaInicio').value == "" ? null : this.filtroProductoForm.get('precioVentaInicio').value;
        request.precioVentaFin = this.filtroProductoForm.get('precioVentaFin').value == "" ? null : this.filtroProductoForm.get('precioVentaFin').value;

        if (this.selectCategoriaItem) {
            const selectTipoDocumento = this.selectCategoriaItem.options.filter(x => x.selected == true && x.value != 0)
            selectTipoDocumento.forEach(element => {
                request.lstCategorias?.push(element.value.id);
            });
        }

        if (this.selectMarcaItem) {
            const selectMarcaItem = this.selectMarcaItem.options.filter(x => x.selected == true && x.value != 0)
            selectMarcaItem.forEach(element => {
                request.lstMarcas?.push(element.value.id);
            });
        }

        return request;
    }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }

    obtenerInfoMoneda(): MonedaDTO {
        return this._securityService.getMonedaStorage();
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
        if (endIndex > this.allProductoDataSource.data.length) {
            endIndex = this.allProductoDataSource.data.length;
        }

        this.pageSlice.data = this.allProductoDataSource.data.slice(startIndex, endIndex);
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
        const index = this.allProductoDataSource.data.findIndex(ingresoEstado => ingresoEstado.id === id);
        if (index !== -1) {
            this.allProductoDataSource.data.splice(index, Numeracion.Uno);
        }
    }

    closedDrawer() {
        this.matDrawer.close();
    }

    getSkeletonCount() {
        this.skeletonNumber = this.allProductoDataSource.data.length == Numeracion.Cero ? Numeracion.Ocho : this.allProductoDataSource.data.length + Numeracion.Uno
    }

    showSkeleton() {
        this.skeleton = Flags.Show
    }

    hideSkeleton() {
        this.skeleton = Flags.Hide
    }

}
