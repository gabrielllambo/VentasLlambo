import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Colores, ErrorCodigo, Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { ToolService } from 'app/core/services/tool/tool.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { FuseValidators } from '@fuse/validators';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { ActualizarProductoRequest } from 'app/core/models/inventario/producto/request/actualizar-producto-request.model';

@Component({
  selector: 'app-modifica-producto-page',
  templateUrl: './modifica-producto-page.component.html',
  styleUrl: './modifica-producto-page.component.scss'
})
export class ModificaProductoPageComponent implements OnInit {

  public actualizaProductoForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;
  public userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();
  public producto: ProductoDTO;
  public allCategoria: CategoriaDTO[];
  public allMarca: MarcaDTO[];
  public nombreArchivo: string;
  public foto: string;
  public selectedFiles: FileList;
  public colorSelected: string = Colores.DefaultColor;

  constructor(
    public matDialogRef: MatDialogRef<ModificaProductoPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _toolService: ToolService,
    private _securityService: SecurityService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {

    this.producto = this.paramsForms.producto;
    this.allCategoria = this.paramsForms.lstCategoria;
    this.allMarca = this.paramsForms.lstMarca;

    this.foto = this.producto.urlFoto;

    this.actualizaProductoForm = this._formBuilder.group({
      categoria: [this.producto.categoria, [Validators.required]],
      marca: [this.producto.marca, [Validators.required]],
      codigo: [{ value: this.producto.codigo, disabled: true }],
      nombre: [this.producto.nombre, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Mil)]],
      descripcion: [this.producto.descripcion, [Validators.maxLength(Numeracion.DoscientosCincuenta)]],
      precioCompra: [this.producto.precioCompra, [Validators.required]],
      precioVenta: [this.producto.precioVenta, [Validators.required]],
      stock: [this.producto.stock, [Validators.required]],
      color: [this.producto.color, [Validators.required]],

    });

  }

  UpdateAsync() {

    if (this.actualizaProductoForm.invalid) { return; }

    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const idProductoSelected = this.producto.id;
    const txtColor = this.actualizaProductoForm.value.color;
    const cboCategoriaSelected = this.actualizaProductoForm.value.categoria.id;
    const cboMarcaSelected = this.actualizaProductoForm.value.marca.id;
    const txtNombre = this.actualizaProductoForm.value.nombre;
    const txtDescripcion = this.actualizaProductoForm.value.descripcion;
    const txtPrecioCompra = this.actualizaProductoForm.value.precioCompra;
    const txtPrecioVenta = this.actualizaProductoForm.value.precioVenta;
    const txtStock = this.actualizaProductoForm.value.stock;

    if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
      this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(idUsuario)) {
      this._toolService.showWarning(DictionaryWarning.InvalidUIdUsuario, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(cboCategoriaSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidCategoria, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(cboMarcaSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidMarca, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtNombre)) {
      this._toolService.showWarning(DictionaryWarning.InvalidNombre, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtPrecioCompra) || txtPrecioCompra == Numeracion.Cero) {
      this._toolService.showWarning(DictionaryWarning.InvalidPrecioCompra, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtPrecioVenta) || txtPrecioVenta == Numeracion.Cero) {
      this._toolService.showWarning(DictionaryWarning.InvalidPrecioVenta, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtStock) || txtStock == Numeracion.Cero) {
      this._toolService.showWarning(DictionaryWarning.InvalidPrecioStock, DictionaryWarning.Tittle);
      return;
    }
    
    if (FuseValidators.isEmptyInputValue(txtColor)) {
      this._toolService.showWarning(DictionaryWarning.InvalidColor, DictionaryWarning.Tittle);
      return;
    }

    const request = new ActualizarProductoRequest();

    request.destinationTimeZoneIdActualizacion = destinationTimeZoneId;
    request.idUsuario = idUsuario;
    request.id = idProductoSelected
    request.idCategoria = cboCategoriaSelected;
    request.idMarca = cboMarcaSelected;
    request.nombre = txtNombre;
    request.descripcion = txtDescripcion;
    request.color = txtColor;
    request.precioCompra = txtPrecioCompra;
    request.precioVenta = txtPrecioVenta;
    request.stock = txtStock
    request.nombreArchivo = this.nombreArchivo;
    request.foto = this.foto;

    this.actualizaProductoForm.disable();
    this.isCallingService = Flags.True;

    this._inventarioService.UpdateProductoAsync(request).subscribe((response: ResponseDTO) => {

      if (response.success) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }

      if (response.code == ErrorCodigo.Advertencia) {
        this._toolService.showWarning(response.message, response.titleMessage);
        this.actualizaProductoForm.enable();
        this.isCallingService = Flags.False;
        return;
      }

      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.actualizaProductoForm.enable();
      this.isCallingService = Flags.False;

    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.actualizaProductoForm.enable();
      this.isCallingService = Flags.False;
      console.log(err);
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1.id === o2.id;
  }

  cerrarVentanaEmergente() {
    this.matDialogRef.close();
  }

  isMobilSize(): boolean {
    return this._toolService.isMobilSize();
  }

  obtenerInfouserInfoLogueado(): DecodedToken {
    return this._securityService.getDecodetoken();
  }

  onFileSelected(event: any) {

    if (this.excedeTamanioFiles(event.target.files)) {
      event.target.value = ''
      this.selectedFiles = null;
      this._toolService.showWarning(DictionaryWarning.ExcedeTamanioArchivos, DictionaryWarning.Tittle)
      return;
    }

    const files = event.target.files;

    if (files.length > Numeracion.Cero) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFiles = e.target.result;
        const base64String = e.target.result as string;
        this.foto = base64String.split(',')[1];
        this.nombreArchivo = file.name;

        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  excedeTamanioFiles(selectedFiles: FileList): boolean {

    let totalSizeInBytes = Numeracion.Cero;

    for (let i = Numeracion.Cero; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      totalSizeInBytes += file.size;
    }

    const totalSizeInKB = totalSizeInBytes / 1024;

    const maxSizeInKB = 250;

    if (totalSizeInKB > maxSizeInKB) {
      return Flags.True;
    }

    return Flags.False;
  }

  preventNegative(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'e') {
      event.preventDefault();
    }
  }

  eliminarFoto() {
    this.selectedFiles = null;
    this.nombreArchivo = null;
    this.foto = null;

  }

}
