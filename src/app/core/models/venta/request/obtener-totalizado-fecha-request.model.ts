export class ObtenerResumenReporteRequest {
    destinationTimeZoneId!: string;
    idUsuario!: string;
    fechaInicio!: Date;
    fechaFin!: Date;
    lstCategorias: number[] = [];
    lstMarcas: number[] = [];
}
