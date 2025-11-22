import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FuseValidators } from '@fuse/validators';
import { SecurityService } from 'app/core/auth/auth.service';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ClienteDTO } from 'app/core/models/clientes/response/cliente-dto.model';
import { CategoriaDTO } from 'app/core/models/inventario/categoria/response/categoria-dto.model';
import { MarcaDTO } from 'app/core/models/inventario/marca/response/marca-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { CommonValidators } from 'app/core/util/functions';

@Component({
  selector: 'app-detalle-producto-page',
  templateUrl: './detalle-producto-page.component.html',
  styleUrl: './detalle-producto-page.component.scss'
})
export class DetalleProductoPageComponent implements OnInit {

  public detalleProductoForm: UntypedFormGroup;
  public isCallingService: boolean = Flags.False;
  public userInfoLogueado: DecodedToken = this.obtenerInfouserInfoLogueado();
  public producto: ProductoDTO;
  public allCategoria: CategoriaDTO[];
  public allMarca: MarcaDTO[];
  public nombreArchivo: string;
  public foto: string;
  public selectedFiles: FileList;

  constructor(
    public matDialogRef: MatDialogRef<DetalleProductoPageComponent>,
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

    this.detalleProductoForm = this._formBuilder.group({
      categoria: [this.producto.categoria, [Validators.required]],
      marca: [this.producto.marca, [Validators.required]],
      codigo: [this.producto.codigo, [Validators.required, Validators.minLength(Numeracion.Tres), Validators.maxLength(Numeracion.Cien),]],
      nombre: [this.producto.nombre, [Validators.required, Validators.minLength(Numeracion.Dos), Validators.maxLength(Numeracion.Mil)]],
      descripcion: [this.producto.descripcion, [Validators.maxLength(Numeracion.DoscientosCincuenta)]],
      precioCompra: [this.producto.precioCompra, [Validators.required]],
      precioVenta: [this.producto.precioVenta, [Validators.required]],
      stock: [this.producto.stock, [Validators.required]],
      fechaRegistro: [this.producto.fechaRegistro],
      fechaActualizacion: [this.producto.fechaActualizacion],
      color: [this.producto.color],
    });

    this.detalleProductoForm.disable();
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

  eliminarFoto() {
    this.selectedFiles = null;
    this.nombreArchivo = null;
    this.foto = null;

  }


}
