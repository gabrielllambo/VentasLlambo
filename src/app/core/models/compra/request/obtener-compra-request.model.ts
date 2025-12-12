export class ObtenerCompraRequest {
    destinationTimeZoneId: string;
    idUsuario: string;
    lstUsuario: string[];
    lstProveedores: string[];
    idCompra: number;
    numeroCompra?: string;
    fechaCompraInicio: Date;
    fechaCompraFin: Date
    montoCompraInicio: number;
    montoCompraFin: number;
}
