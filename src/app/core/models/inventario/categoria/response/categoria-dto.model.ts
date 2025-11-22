import { DateTime } from "luxon";
import { MedidaDTO } from "../../medida/response/medida-dto.model";

export class CategoriaDTO {
    id:number;
    nombre:string;
    descripcion:string;
    color: string;
    fechaRegistro:Date;
    fechaActualizacion:DateTime;
    activo: boolean;
    medida: MedidaDTO;
}
