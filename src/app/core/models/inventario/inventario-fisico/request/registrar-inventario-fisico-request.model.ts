export interface RegistrarInventarioFisicoRequest {
    idProducto: number;
    idLoteProducto: number;
    cantidadFisica: number;
    observacion?: string; 
    idUsuarioGuid: string; 
}