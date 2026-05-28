export class RegistrarDetalleVentaRequest {
    idProducto!: number;
    urlFotoProducto!: string;
    nombreProducto!: string;
    colorProducto!: string;
    nombreCategoria!: string;
    colorCategoria!: string;
    nombreMarca!: string;
    colorMarca!: string;
    nombreMedida!: string;
    cantidad!: number;
    precioCompra!: number;
    precioVenta!: number;
    descuentoPorcentaje?: number;
    observacionDescuento?: string;
}
