import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { Flags, ImagenesUrl, Numeracion } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ObtenerProductoPorCodigoRequest } from 'app/core/models/inventario/producto/request/obtener-producto-por-codigo-request.model';
import { ProductoSeleccionadosCompra } from 'app/core/models/inventario/producto/models/producto-seleccionados-compra.model';
import { ProveedorDTO } from 'app/core/models/proveedores/response/proveedor-dto.model';
import { ProveedorService } from 'app/core/services/proveedores/proveedor.service';
import { ObtenerProveedorPorNumDocumentoCorreoRequest } from 'app/core/models/proveedores/request/obtener-proveedor-por-num-documento-correo-request.model';
import { RegistrarCompraRequest } from 'app/core/models/compra/request/registrar-compra-request.model';
import { FuseValidators } from '@fuse/validators';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { RegistrarDetalleCompraRequest } from 'app/core/models/compra/request/registrar-detalle-compra-request.model';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { CompraService } from 'app/core/services/compra/compra.service';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { CategoriaConConteoDTO } from 'app/core/models/inventario/producto/response/categoria-con-conteo-dto.model';
import sweetAlert from 'app/core/util/sweetAlert';
import { categories } from 'app/mock-api/apps/academy/data';

@Component({
    selector: 'app-registro-compras-page',
    templateUrl: './registro-compras-page.component.html',
    styleUrls: ['./registro-compras-page.component.scss'],
})
export class RegistroComprasPageComponent implements OnInit, OnDestroy {
    private configForm: UntypedFormGroup;
    public proveedorData: ProveedorDTO;
    public isCallingInsertService = Flags.False;
    public isCallingSelecProveedorService = Flags.False;
    public allProductoDataSource: MatTableDataSource<ProductoDTO> = new MatTableDataSource();
    public allCategoriesDataSource: CategoriaConConteoDTO[];
    public allProductByCategoryDataSource: ProductoDTO[] = [];
    public lstProductosSeleccionados: MatTableDataSource<ProductoSeleccionadosCompra> = new MatTableDataSource();
    public isBuscandoProductosDisabled = false;
    public hayProveedor = Flags.False;
    public filtroRegistroComprasForm: UntypedFormGroup;
    public productoTableColumns: string[] = ['foto', 'nombre', 'stock', 'precioCompra', 'cantidad', 'total', 'acciones'];
    public parametroBusquedaProducto = '';
    public parametroBusquedaProveedor = '';
    public notaAdicional = '';
    public fechaCompra: Date;
    private decodeToken: DecodedToken;
    public monedaInfo: MonedaDTO;
    private userInfoLogueado: DecodedToken;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    public imgNoData = ImagenesUrl.noDataGraficos;

    get totalCompra(): number {
        return this.lstProductosSeleccionados.data.reduce((total, producto) => {
            return total + (producto.precioCompra * producto.cantidad);
        }, 0);
    }

    constructor(
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _securityService: SecurityService,
        private _inventarioService: InventarioService,
        private _proveedorService: ProveedorService,
        private _compraService: CompraService,
        private _toolService: ToolService
    ) {
        this.decodeToken = this._securityService.getDecodetoken();
        this.userInfoLogueado = this.decodeToken;
        this.monedaInfo = this._securityService.getMonedaStorage();
    }

    ngOnInit(): void {
        this.lstProductosSeleccionados.data = [];
        this.allProductoDataSource.data = [];
        this.formFiltros();
        this.GetCategoriesWithProductsCountAsync();
    }

    GetCategoriesWithProductsCountAsync() {
        this._inventarioService.GetCategoriesWithProductsCountAsync().subscribe((response: CategoriaConConteoDTO[]) => {
            this.allCategoriesDataSource = response;
        }, err => {
            this._toolService.showError('Error', 'Error');
            console.log(err);
        });
    }

    formFiltros() {
        this.filtroRegistroComprasForm = this._formBuilder.group({
            fechaRegistroCompra: [this._toolService.getDateTimeNow(), [Validators.required]],
        });
    }

    aumentarCantidad(producto: ProductoSeleccionadosCompra): void {
        if (producto.cantidad < producto.stock) {
            producto.cantidad++;
            this.lstProductosSeleccionados._updateChangeSubscription();
        } else {
            this._toolService.showWarning('Límite de stock alcanzado', 'Advertencia');
        }
    }

    onSelectCategoryProduct(category: MatButtonToggleChange): void {
        this._inventarioService.GetAllProductsByCategoryAsync(category.value.idCategoria).subscribe((response: ProductoDTO[]) => {
            this.allProductByCategoryDataSource = response;
        }, err => {
            this._toolService.showError('Error', 'Error');
            console.log(err);
        });
    }

    InsertAsync() {
        const destinationTimeZoneId = this._toolService.getTimeZone();
        const idUsuario = this.userInfoLogueado.idUsuario;
        const idProveedor = this.proveedorData?.id;
        const txtFechaRegistroCompra = this.filtroRegistroComprasForm.get('fechaRegistroCompra').value;

        const lstDetalleCompra: RegistrarDetalleCompraRequest[] = this.lstProductosSeleccionados.data.map(producto => ({
            idProducto: producto.id,
            urlFotoProducto: producto.urlFoto,
            nombreProducto: producto.nombre,
            colorProducto: producto.color,

            // Agregados según tu interfaz
            colorCategoria: producto.categoria?.color ?? '',
            colorMarca: producto.marca?.color ?? '',

            nombreCategoria: producto.categoria?.nombre ?? '',
            nombreMarca: producto.marca?.nombre ?? '',
            nombreMedida: producto.categoria?.medida?.nombre ?? '',

            cantidad: producto.cantidad,

            // Ajustado también
            precioCompra: producto.precioCompra    // antes tenías precioCosto

        }));

        if (this.lstProductosSeleccionados.data.length == Numeracion.Cero) {
            this._toolService.showWarning('No hay productos seleccionados', 'Advertencia');
            return;
        }

        if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
            this._toolService.showWarning('Localización inválida', 'Advertencia');
            return;
        }

        if (FuseValidators.isEmptyInputValue(idUsuario)) {
            this._toolService.showWarning('Usuario inválido', 'Advertencia');
            return;
        }

        if (FuseValidators.isEmptyInputValue(txtFechaRegistroCompra)) {
            this._toolService.showWarning('Fecha de compra inválida', 'Advertencia');
            return;
        }

        this.configForm = this._formBuilder.group({
            title: 'Confirmación de la Compra',
            message: '¿Desea registrar esta compra?',
            icon: this._formBuilder.group({ show: true, name: 'heroicons_outline:exclamation-triangle', color: 'primary' }),
            actions: this._formBuilder.group({
                confirm: this._formBuilder.group({ show: true, label: 'Si', color: 'primary' }),
                cancel: this._formBuilder.group({ show: true, label: 'No' })
            }),
            dismissible: true,
        });

        const dialogRef = this._fuseConfirmationService.open(this.configForm.value);

        dialogRef.afterClosed().subscribe((result) => {
            if (result != "confirmed") { return; }

            const request = new RegistrarCompraRequest();
            request.destinationTimeZoneIdRegistro = destinationTimeZoneId;
            request.idUsuario = idUsuario;
            request.idProveedor = idProveedor;
            request.lstDetalleCompra = lstDetalleCompra;
            request.notaAdicional = this.notaAdicional;
            request.fechaRegistroCompra = txtFechaRegistroCompra;

            console.log('Request a enviar:', request);

            this.isCallingInsertService = Flags.Show;

            this._compraService.InsertAsync(request).subscribe((response: ResponseDTO) => {
                if (response.success) {
                    // limpiar formulario
                    this.proveedorData = null;
                    this.hayProveedor = Flags.False;
                    this.lstProductosSeleccionados.data = [];
                    this.allProductoDataSource.data = [];
                    this.allProductByCategoryDataSource = [];
                    this.isCallingInsertService = Flags.Hide;
                    this.notaAdicional = "";
                    sweetAlert.success(response.titleMessage, response.message);
                    return;
                }
                this._toolService.showError('Error', 'Error');
                this.isCallingInsertService = Flags.Hide;
            }, err => {
                this._toolService.showError('Error', 'Error');
                console.log(err);
                this.isCallingInsertService = Flags.Hide;
            });
        });
    }

    buscarProveedor() {
        if (!this.parametroBusquedaProveedor || this.parametroBusquedaProveedor.trim() == '') { return; }
        const request = new ObtenerProveedorPorNumDocumentoCorreoRequest();
        request.idUsuario = this.decodeToken.idUsuario;
        request.parametro = this.parametroBusquedaProveedor;
        this.isCallingSelecProveedorService = Flags.True;
        this._proveedorService.GetByNumDocumentoCorreoAsync(request).subscribe((provResponse: ProveedorDTO) => {
            this.isCallingSelecProveedorService = Flags.False;
            if (provResponse) {
                this.proveedorData = provResponse;
                this.hayProveedor = Flags.True;
                this.parametroBusquedaProveedor = '';
                return;
            }
            this.proveedorData = null;
            this.hayProveedor = Flags.False;
            this._toolService.showWarning('Proveedor no existe', 'Advertencia');
        }, err => {
            this._toolService.showError('Error', 'Error');
            this.isCallingSelecProveedorService = Flags.False;
            console.log(err);
        });
    }

    quitarProveedor(): void {
        this.proveedorData = null;
        this.hayProveedor = Flags.False;
    }

    disminuirCantidad(producto: ProductoSeleccionadosCompra): void {
        if (producto.cantidad > 1) {
            producto.cantidad--;
            this.lstProductosSeleccionados._updateChangeSubscription();
        }
    }

    quitarProducto(producto: ProductoSeleccionadosCompra): void {
        this.lstProductosSeleccionados.data = this.lstProductosSeleccionados.data.filter(p => p.id !== producto.id);
    }

    calcularTotalProducto(producto: ProductoSeleccionadosCompra): number {
        return producto.cantidad * producto.precioCompra;
    }

    filtrarProductos(event: Event) {
        const input = (event.target as HTMLInputElement).value;
        if (input.length >= Numeracion.Cuatro) {
            const request = new ObtenerProductoPorCodigoRequest();
            request.idUsuario = this.decodeToken.idUsuario;
            request.parametro = input;
            this._inventarioService.GetProductoByCodeAsync(request).subscribe((produsctosResponse: ProductoDTO[]) => {
                if (produsctosResponse.length > Numeracion.Cero) {
                    this.allProductoDataSource.data = produsctosResponse;
                }
            }, err => {
                this._toolService.showError('Error', 'Error');
                console.log(err);
            });
            return;
        }
        this.allProductoDataSource.data = [];
    }

    keyupEnterProductos(event: Event) {
        const input = (event.target as HTMLInputElement).value;
        const request = new ObtenerProductoPorCodigoRequest();
        request.idUsuario = this.decodeToken.idUsuario;
        request.parametro = input;
        this._inventarioService.GetProductoByCodeAsync(request).subscribe((produsctosResponse: ProductoDTO[]) => {
            if (produsctosResponse.length > Numeracion.Cero) {
                this.allProductoDataSource.data = produsctosResponse;
            }
        }, err => {
            this._toolService.showError('Error', 'Error');
            console.log(err);
        });
    }

    seleccionarProducto(producto: ProductoDTO) {

        // Buscar si ya está agregado
        const index = this.lstProductosSeleccionados.data
            .findIndex(p => p.codigo === producto.codigo);

        // Clonamos para evitar referencias inesperadas
        const productoSeleccionado: ProductoSeleccionadosCompra = {
            ...producto,
            cantidad: 1,
            precioCompra: producto.precioCompra ?? 0,   // seguridad
        };

        if (index === -1) {
            // Nuevo producto seleccionado
            this.lstProductosSeleccionados.data = [
                ...this.lstProductosSeleccionados.data,
                productoSeleccionado
            ];
        } else {
            // Incrementar cantidad si ya existe
            this.lstProductosSeleccionados.data[index].cantidad++;
        }

        // Actualizar tabla Angular Material
        this.lstProductosSeleccionados._updateChangeSubscription();

        // Limpiar buscador
        this.parametroBusquedaProducto = "";
        this.allProductoDataSource.data = [];

        // Recalcular total general
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
