import { DateTime } from "luxon";

export class ObtenerClienteRequest {
  destinationTimeZoneId: string;
  idUsuario: string;
  lstTipoDocumento: number[];
  lstGenero: number[];
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  celular: string;
  direccion: string;
  correoElectronico: string;
  fechaRegistroInicio: Date;
  fechaRegistroFin: Date;
}
