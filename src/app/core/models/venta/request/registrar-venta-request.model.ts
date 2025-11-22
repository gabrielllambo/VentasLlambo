import { RegistrarDetalleVentaRequest } from "./registrar-detalle-venta-request.model";

export class RegistrarVentaRequest {
    destinationTimeZoneIdRegistro: string;
    notaAdicional: string;
    idUsuario: string;
    idCliente: number;
    fechaRegistroVenta: Date;
    flgEnviarComprobante: boolean;
    lstDetalleVenta: RegistrarDetalleVentaRequest[];
}
