import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Colores, ErrorCodigo, Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import { FuseValidators } from '@fuse/validators';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { RegistrarProductoRequest } from 'app/core/models/inventario/producto/request/registrar-producto-request.model';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';

@Component({
  selector: 'app-registro-producto-page',
  templateUrl: './registro-producto-page.component.html',
  styleUrl: './registro-producto-page.component.scss'
})
export class RegistroProductoPageComponent implements OnInit {

  public registroProductoForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;
  private userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();
  public allCategoria: CategoriaDTO[];
  public allMarca: MarcaDTO[];
  public nombreArchivo: string;
  public foto: string;
  public selectedFiles: FileList;
  public colorSelected: string = Colores.DefaultColor;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    public matDialogRef: MatDialogRef<RegistroProductoPageComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _toolService: ToolService,
    private _securityService: SecurityService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {

    this.allCategoria = this.paramsForms.lstCategoria;
    this.allMarca = this.paramsForms.lstMarca;

    this.registroProductoForm = this._formBuilder.group({
      categoria: ['', [Validators.required]],
      marca: ['', [Validators.required]],
      codigo: ['', [Validators.required, Validators.minLength(Numeracion.Tres), Validators.maxLength(Numeracion.Cien),]],
      nombre: ['', [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Mil)]],
      descripcion: ['', [Validators.maxLength(Numeracion.DoscientosCincuenta)]],
      precioCompra: ['', [Validators.required]],
      precioVenta: ['', [Validators.required]],
      stock: ['', [Validators.required]],
      color: ['', []]
    });
  }

  InsertAsync() {

    if (this.registroProductoForm.invalid) { return; }

    const destinationTimeZoneId = this._toolService.getTimeZone();
    const idUsuario = this.userInfoLogueado.idUsuario;
    const cboCategoriaSelected = this.registroProductoForm.get('categoria').value.id;
    const cboMarcaSelected = this.registroProductoForm.get('marca').value.id;
    const txtCodigo = this.registroProductoForm.get('codigo').value;
    const txtColor = this.registroProductoForm.get('color').value;
    const txtNombre = this.registroProductoForm.get('nombre').value;
    const txtDescripcion = this.registroProductoForm.get('descripcion').value;
    const txtPrecioCompra = this.registroProductoForm.get('precioCompra').value;
    const txtPrecioVenta = this.registroProductoForm.get('precioVenta').value;
    const txtStock = this.registroProductoForm.get('stock').value;

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

    if (FuseValidators.isEmptyInputValue(txtColor)) {
      this._toolService.showWarning(DictionaryWarning.InvalidColor, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(cboMarcaSelected)) {
      this._toolService.showWarning(DictionaryWarning.InvalidMarca, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(txtCodigo)) {
      this._toolService.showWarning(DictionaryWarning.InvalidCodigo, DictionaryWarning.Tittle);
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

    const request = new RegistrarProductoRequest();

    request.destinationTimeZoneIdRegistro = destinationTimeZoneId;
    request.idUsuario = idUsuario;
    request.idCategoria = cboCategoriaSelected;
    request.idMarca = cboMarcaSelected;
    request.codigo = txtCodigo;
    request.nombre = txtNombre;
    request.descripcion = txtDescripcion;
    request.color = txtColor;
    request.precioCompra = txtPrecioCompra;
    request.precioVenta = txtPrecioVenta;
    request.stock = txtStock
    request.nombreArchivo = this.nombreArchivo;
    request.fotoBase64 = this.foto;

    this.registroProductoForm.disable();
    this.isCallingService = Flags.True;

    this._inventarioService.InsertProductoAsync(request).subscribe((response: ResponseDTO) => {

      if (response.success == Flags.SuccessTransaction) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.matDialogRef.close(response);
        this.isCallingService = Flags.False;
        return;
      }

      if (response.code == ErrorCodigo.Advertencia) {
        this._toolService.showWarning(response.message, response.titleMessage);
        this.registroProductoForm.enable();
        this.isCallingService = Flags.False;
        return;
      }

      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroProductoForm.enable();
      this.isCallingService = Flags.False;

    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.registroProductoForm.enable();
      this.isCallingService = Flags.False;
      console.log(err);
    });

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
