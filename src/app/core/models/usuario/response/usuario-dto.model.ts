import { GeneroDTO } from "../../parametro/genero-dto.model";
import { RolDTO } from "../../parametro/rol-dto.model";
import { TipoDocumentoDTO } from "../../parametro/tipo-documento-dto.model";
import { UsuarioIdDTO } from "./usuario-id-dto.model";

export class UsuarioDTO {
    nombres: string;
    apellidos: string;
    idGenero: number;
    idEstadoCuenta: number;
    idTipoDocumento: number;
    correoElectronico: string;
    celular: string;
    direccion: string;
    fechaNacimiento: Date;
    flgCambiarClave: Date;
    usuarioID: UsuarioIdDTO;
    fechaRegistro: Date;
    fechaActualizacion: Date;
    tipoDocumento: TipoDocumentoDTO;
    genero: GeneroDTO;
    rol: RolDTO;
    numeroDocumento: string;
    activo: boolean;
    urlFoto: string;
}



