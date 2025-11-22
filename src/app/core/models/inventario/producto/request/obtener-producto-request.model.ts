export class ObtenerProductoRequest {
    destinationTimeZoneId: string;
    idUsuario: string;
    codigo: string;
    nombre: string;
    fechaRegistroInicio?: Date;
    fechaRegistroFin?: Date;
    precioCompraInicio?: Number;
    precioCompraFin?: Number;
    precioVentaInicio?: Number;
    precioVentaFin?: Number;
    lstCategorias: Number[];
    lstMarcas: Number[];
}   

