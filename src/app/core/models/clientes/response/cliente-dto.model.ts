import { GeneroDTO } from "../../parametro/genero-dto.model";
import { TipoDocumentoDTO } from "../../parametro/tipo-documento-dto.model";

export class ClienteDTO {
        id: number;
        idTipoDocumento: number;
        numeroDocumento: string;
        nombres: string;
        apellidos: string;
        correoElectronico: string;
        celular: string;
        direccion: string;
        fechaRegistro: Date;
        fechaActualizacion?: Date;
        activo: boolean;
        tipoDocumento: TipoDocumentoDTO;
        genero: GeneroDTO;

}
