import { RegistrarDetalleCompraRequest } from './registrar-detalle-compra-request.model';

export class RegistrarCompraRequest {
    destinationTimeZoneIdRegistro: string;
    notaAdicional: string;
    idUsuario: string;
    idProveedor: number;
    fechaRegistroCompra: Date;
    flgEnviarComprobante: boolean;
    lstDetalleCompra: RegistrarDetalleCompraRequest[];
}
