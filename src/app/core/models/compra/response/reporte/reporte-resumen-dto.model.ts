import { EvolucionComprasFechaDTO } from "./categoria/evolucion-compras-fecha-dto.model";
import { DistribucionComprasMarcasDTO } from "./marca/distribucion-compras-marca-dto.model";
import { ComprasMarcasTopDiezDTO } from "./marca/compras-marcas-top-diez-dto.model";
import { DistribucionComprasProductosDTO } from "./producto/distribucion-compras-productos-dto.model";
import { ComprasProductosTopDiezDTO } from "./producto/compras-productos-top-diez-dto.model";

export class ReporteResumenComprasDTO {
    evolucionComprasFecha: EvolucionComprasFechaDTO;
    distribucionComprasMarca: DistribucionComprasMarcasDTO;
    distribucionComprasProducto: DistribucionComprasProductosDTO;
    topDiezMarcasCompras: ComprasMarcasTopDiezDTO;
    topDiezProductosCompras: ComprasProductosTopDiezDTO;
}
