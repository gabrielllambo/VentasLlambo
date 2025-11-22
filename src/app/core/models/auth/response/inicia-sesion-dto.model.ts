import { ResponseDTO } from "../../generic/response-dto.model";
import { MenuRolDTO } from "../../parametro/menu-rol-dto.model";
import { MonedaDTO } from "../../parametro/moneda-dto.model";

export interface IniciaSesionDTO {
    response: ResponseDTO;
    menuRol: MenuRolDTO[];
    moneda: MonedaDTO;
}
