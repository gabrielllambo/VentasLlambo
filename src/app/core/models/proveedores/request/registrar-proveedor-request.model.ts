export class RegistrarProveedorRequest {
  // Datos de registro
  destinationTimeZoneIdRegistro: string;
  idUsuario: string;

  // Datos del proveedor
  tipoDocumentoId: number;        // id_tipo_documento
  numeroDocumento: string;        // numero_documento
  razonSocial: string;            // razon_social
  nombreComercial?: string;       // nombre_comercial (opcional)
  correo: string;      // correo_electronico
  telefono?: string;              // telefono (opcional)
  direccion?: string;             // direccion (opcional)
  activo: boolean;                // activo

  // Campos que normalmente se manejan automáticamente
  estado?: string;                // estado
  fechaRegistro?: Date;           // fecha_registro
  fechaActualizacion?: Date;      // fecha_actualizacion
  fechaAnulacion?: Date;          // fecha_anulacion
  motivoAnulacion?: string;       // motivo_anulacion
}

