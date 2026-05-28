export class LoteDTO {
    id: number;
    codigoLote: string;
    nombreProducto: string;
    nombreProveedor: string;
    fechaCaducidad: Date | null;
    cantidadDisponible: number;
    cantidadInicial: number;
    estado: number;
    ubicacion: string;
    fechaRegistro: Date;
    precioCompra: number;
    idProducto: number;
    idCategoriaProducto: number;
    nombreCategoria: string;
    activo: boolean;
}
