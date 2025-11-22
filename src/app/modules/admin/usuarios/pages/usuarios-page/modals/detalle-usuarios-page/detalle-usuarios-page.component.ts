import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { GeneroDTO } from 'app/core/models/parametro/genero-dto.model';
import { RolDTO } from 'app/core/models/parametro/rol-dto.model';
import { TipoDocumentoDTO } from 'app/core/models/parametro/tipo-documento-dto.model';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { ToolService } from 'app/core/services/tool/tool.service';

@Component({
  selector: 'app-detalle-usuarios-page',
  templateUrl: './detalle-usuarios-page.component.html',
  styleUrl: './detalle-usuarios-page.component.scss'
})
export class DetalleUsuariosPageComponent implements OnInit {

  public userInfoLogueado: DecodedToken;
  public detalleUsuarioForm: UntypedFormGroup;

  public usuario: UsuarioDTO;

  public allRol: RolDTO[];
  public allGenero: GeneroDTO[];
  public allTipoDocumento: TipoDocumentoDTO[];

  constructor(
    public matDialogRef: MatDialogRef<DetalleUsuariosPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,

    private _formBuilder: UntypedFormBuilder,
    private _toolService: ToolService,
  ) {
  }

  ngOnInit(): void {

    this.usuario = this.paramsForms.usuario;
    this.allRol = this.paramsForms.lstRol;
    this.allGenero = this.paramsForms.lstGenero;
    this.allTipoDocumento = this.paramsForms.lstTipoDocumento;

    this.detalleUsuarioForm = this._formBuilder.group({
      tipoDocumento: [this.usuario.tipoDocumento],
      numeroDocumento: [this.usuario.numeroDocumento],
      rol: [this.usuario.rol],
      nombres: [this.usuario.nombres],
      apellidos: [this.usuario.apellidos],
      genero: [this.usuario.genero],
      fechaNacimiento: [this.usuario.fechaNacimiento],
      correoElectronico: [this.usuario.correoElectronico],
      celular: [this.usuario.celular],
      direccion: [this.usuario.direccion],
      fechaRegistro: [this.usuario.fechaRegistro],
      fechaActualizacion: [this.usuario.fechaActualizacion],
    });

    this.detalleUsuarioForm.disable();
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

}
