import { EvolucionVentasFechaDTO } from "../categoria/evolucion-ventas-fecha-dto.model";
import { DistribucionVentasProductosDTO } from "./distribucion-ventas-productos-dto.model";
import { EvolucionVentasProductosFechaDTO } from "./evolucion-ventas-producto-fecha-dto.model";
import { VentasProductosTopDiezDTO } from "./ventas-productos-top-diez-dto.model";

export class VentaAnalisisProductosDTO {
    lstEvolucionVentasProductoFecha: EvolucionVentasProductosFechaDTO[];
    evolucionVentasFecha: EvolucionVentasFechaDTO;
    distribucionVentasProducto: DistribucionVentasProductosDTO;
    topDiezProductosVentas: VentasProductosTopDiezDTO;
}
