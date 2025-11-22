import { DateTime } from "luxon";

export class MarcaDTO {
    id:number;
    nombre:string;
    descripcion:string;
    color: string;
    fechaRegistro:Date;
    fechaActualizacion:Date;
    activo: boolean;
}
