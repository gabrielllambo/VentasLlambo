import { TipoDocumentoDTO } from "../../parametro/tipo-documento-dto.model";

export interface ProveedorDTO {
  id: number;
  tipoDocumento: TipoDocumentoDTO;
  numeroDocumento: string;
  razonSocial: string;
  correoElectronico: string;
  telefono: string;
  direccion: string;
  activo: boolean;
  fechaRegistro: string;
  nombreComercial: string;
  estado: boolean;
  fechaActualizacion: string;
}
