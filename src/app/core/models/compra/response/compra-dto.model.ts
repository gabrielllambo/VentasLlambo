export class CompraDTO {
    idCompra: number;
    numeroCompra: string;

    nombreProveedor: string;    
    correoUsuario: string;        // Usuario que registró la compra

    fechaCompra: Date;
    totalCompra: number;

    urlComprobante: string;       // PDF, factura, recibo, etc.
    estado: boolean;              // Activa / anulada
}
