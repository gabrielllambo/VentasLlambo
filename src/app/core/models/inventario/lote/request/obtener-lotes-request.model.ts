export class ObtenerLoteRequest {
    idUsuario: string = '';
    nombre: string = '';
    codigoLote?: string;
    fechaVencimientoInicio?: string;
    fechaVencimientoFin?: string;
    stockMinimo?: number;
    stockMaximo?: number;
    idsCategorias?: number[];
}
