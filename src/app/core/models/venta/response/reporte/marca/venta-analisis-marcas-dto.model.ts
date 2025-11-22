import { EvolucionVentasFechaDTO } from "../categoria/evolucion-ventas-fecha-dto.model";
import { DistribucionVentasMarcasDTO } from "./distribucion-ventas-marca-dto.model";
import { EvolucionVentasMarcaFechaDTO } from "./evolucion-ventas-marcas-fecha-dto.model";
import { VentasMarcasTopDiezDTO } from "./ventas-marcas-top-diez-dto.model";

export class VentaAnalisisMarcasDTO {
    lstEvolucionVentasMarcaFecha: EvolucionVentasMarcaFechaDTO[];
    evolucionVentasFecha: EvolucionVentasFechaDTO;
    distribucionVentasMarca: DistribucionVentasMarcasDTO;
    topDiezMarcasVentas: VentasMarcasTopDiezDTO;
}
