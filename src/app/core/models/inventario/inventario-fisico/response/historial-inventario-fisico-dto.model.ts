export class HistorialInventarioFisicoDTO {
    idInventarioFisico: number;
    fechaRegistro: Date;
    nombreProducto: string;
    urlFotoProducto: string;
    nombreCategoria: string;
    colorCategoria: string;
    nombreMarca: string;
    colorMarca: string;
    numeroLote: string;
    stockSistema: number;
    cantidadFisica: number;
    diferencia: number;
    precioCompra: number;
    valorPerdida: number;
    nombreUsuario: string;
    correoUsuario: string;
    urlFotoUsuario: string;
    ajustado: boolean;
    fechaAjuste?: Date;
}
