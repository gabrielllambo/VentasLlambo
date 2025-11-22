import { DistribucionVentasCategoriaDTO } from "./distribucion-ventas-categoria-dto.model";
import { EvolucionVentasCategoriaFechaDTO } from "./evolucion-ventas-categorias-fecha-dto.model";
import { EvolucionVentasFechaDTO } from "./evolucion-ventas-fecha-dto.model";
import { VentasCategoriasTopDiezDTO } from "./ventas-categorias-top-diez-dto.model";

export class VentaAnalisisCategoriasDTO {
    lstEvolucionVentasCategoriaFecha: EvolucionVentasCategoriaFechaDTO[];
    evolucionVentasFecha: EvolucionVentasFechaDTO;
    distribucionVentasCategoria: DistribucionVentasCategoriaDTO;
    topDiezCategoriasVentas: VentasCategoriasTopDiezDTO;
}
