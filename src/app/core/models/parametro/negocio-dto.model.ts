import { MonedaDTO } from "./moneda-dto.model";

export interface NegocioDTO {
    id: number;
    idMoneda: number;
    razonSocial: string;
    ruc: string;
    direccion: string;
    celular: string;
    correo: string;
    nombreLogo: string;
    urlLogo: string;
    fechaRegistro: Date;
    moneda: MonedaDTO
}
