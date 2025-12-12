export class ObtenerProveedorRequest {
  destinationTimeZoneId: string;
  idUsuario: string;

  numeroDocumento: string;
  razonSocial: string;
  correoElectronico: string;
  telefono: string;
  direccion: string;
  celular?: string;

  fechaRegistroInicio: Date;
  fechaRegistroFin: Date;
}
