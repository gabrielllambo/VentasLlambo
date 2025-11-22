import { DateTime } from "luxon";

export class MedidaDTO {
    id:number;
    nombre:string;
    descripcion:string;
    abreviatura:string;
    equivalente:string;
    valor:number;
    activo: boolean;
    fechaRegistro:DateTime;
    fechaActualizacion:DateTime;
}
