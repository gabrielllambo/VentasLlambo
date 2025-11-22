export class ObtenerVentaRequest {
    destinationTimeZoneId: string;
    idUsuario: string;
    lstUsuario: string[];
    numeroVenta?: string;
    fechaVentaInicio?: Date;
    fechaVentaFin?: Date;
    montoVentaInicio: number;
    montoVentaFin: number;
}
