import { EvolucionComprasFechaDTO } from "../categoria/evolucion-compras-fecha-dto.model";
import { DistribucionComprasProductosDTO } from "./distribucion-compras-productos-dto.model";
import { EvolucionComprasProductosFechaDTO } from "./evolucion-compras-producto-fecha-dto.model";
import { ComprasProductosTopDiezDTO } from "./compras-productos-top-diez-dto.model";

export class CompraAnalisisProductosDTO {
    lstEvolucionComprasProductoFecha: EvolucionComprasProductosFechaDTO[];
    evolucionComprasFecha: EvolucionComprasFechaDTO;
    distribucionComprasProducto: DistribucionComprasProductosDTO;
    topDiezProductosCompras: ComprasProductosTopDiezDTO;
}
