import { EvolucionComprasFechaDTO } from "../reporte/categoria/evolucion-compras-fecha-dto.model";
import { DistribucionComprasMarcasDTO } from "../reporte/marca/distribucion-compras-marca-dto.model";
import { EvolucionComprasMarcaFechaDTO } from "../reporte/marca/evolucion-compras-marcas-fecha-dto.model";
import { ComprasMarcasTopDiezDTO } from "../reporte/marca/compras-marcas-top-diez-dto.model";

export class CompraAnalisisMarcasDTO {
    lstEvolucionComprasMarcaFecha: EvolucionComprasMarcaFechaDTO[];
    evolucionComprasFecha: EvolucionComprasFechaDTO;
    distribucionComprasMarca: DistribucionComprasMarcasDTO;
    topDiezMarcasCompras: ComprasMarcasTopDiezDTO;
}
