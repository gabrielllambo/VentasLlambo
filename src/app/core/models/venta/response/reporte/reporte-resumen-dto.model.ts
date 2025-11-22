import { EvolucionVentasFechaDTO } from "./categoria/evolucion-ventas-fecha-dto.model";
import { DistribucionVentasMarcasDTO } from "./marca/distribucion-ventas-marca-dto.model";
import { VentasMarcasTopDiezDTO } from "./marca/ventas-marcas-top-diez-dto.model";
import { DistribucionVentasProductosDTO } from "./producto/distribucion-ventas-productos-dto.model";
import { VentasProductosTopDiezDTO } from "./producto/ventas-productos-top-diez-dto.model";

export class ReporteResumenDTO {
    evolucionVentasFecha: EvolucionVentasFechaDTO;
    distribucionVentasMarca: DistribucionVentasMarcasDTO;
    distribucionVentasProducto: DistribucionVentasProductosDTO;
    topDiezMarcasVentas: VentasMarcasTopDiezDTO;
    topDiezProductosVentas: VentasProductosTopDiezDTO;
}
