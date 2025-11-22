import { GeneroDTO } from "./genero-dto.model";
import { MonedaDTO } from "./moneda-dto.model";

export interface ParametroGeneralDTO {
    lstGenero: GeneroDTO[];
    lstMoneda: MonedaDTO[];
}
