import { DistribucionGastosCategoriaDTO } from "./distribucion-gastos-categorias-dto.model";
 
import { DistribucionIngresosCategoriaDTO } from "./distribucion-ingresos-categorias-dto.model";

export interface HomeDTO {
    flgHayGastosAnio: boolean;
    totalIngresosAnio: number;
    totalGastosAnio: number;
    saldoRestanteAnio: number;
    distribucionGastosCategoria: DistribucionGastosCategoriaDTO;
    distribucionIngresosCategoria: DistribucionIngresosCategoriaDTO;
 

}
    