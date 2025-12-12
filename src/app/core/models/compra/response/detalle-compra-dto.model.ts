export class DetalleCompraDTO {
    urlFotoProducto: string;
    nombreProducto: string;

    // Categoría
    nombreCategoria: string;
    colorCategoria: string;

    // Marca
    nombreMarca: string;
    colorMarca: string;

    // Valores específicos de la compra
    precioCompra: number;      // En compra se usa precioCompra
    cantidad: number;
    precioTotal: number;       // cantidad * precioCompra
}

