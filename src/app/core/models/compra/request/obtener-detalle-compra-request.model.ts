export class ObtenerDetalleCompraRequest {
    destinationTimeZoneId?: string;
    idUsuario?: string;
    idCompra?: number;

    idProducto: number;
    nombreProducto: string;
    precioCompra: number;
    cantidad: number;
    total: number;
}


