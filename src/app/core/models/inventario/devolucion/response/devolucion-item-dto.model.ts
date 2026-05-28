export interface DevolucionItemDTO {
    id: number;
    fechaDevolucion: Date;
    nombreProducto: string;
    idLote: number;
    codigoLote: string;
    cantidadDevuelta: number;
    motivo: string;
    observacion: string;
    nombreUsuario: string;
    precioCompra: number;
    valorDevuelto: number;
}
