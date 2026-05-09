export class ObtenerHistorialInventarioFisicoRequest {
    destinationTimeZoneId: string;
    idUsuario: string;
    fechaInicio: Date;
    fechaFin: Date;
    lstProductos: number[];
    lstCategorias: number[];
    lstMarcas: number[];
    soloPerdidas: boolean;
}
