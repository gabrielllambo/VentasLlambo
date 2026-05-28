export interface RegistrarInventarioFisicoRequest {
    idProducto: number;
    idLoteProducto: number;
    cantidadFisica: number;
    nombreRegistro?: string;
    observacion?: string;
    idUsuarioGuid: string;
}