import { EvolucionComprasFechaDTO } from "../categoria/evolucion-compras-fecha-dto.model";
import { DistribucionComprasMarcasDTO } from "./distribucion-compras-marca-dto.model";
import { EvolucionComprasMarcaFechaDTO } from "./evolucion-compras-marcas-fecha-dto.model";
import { ComprasMarcasTopDiezDTO } from "./compras-marcas-top-diez-dto.model";

export class CompraAnalisisMarcasDTO {
    lstEvolucionComprasMarcaFecha: EvolucionComprasMarcaFechaDTO[];
    evolucionComprasFecha: EvolucionComprasFechaDTO;
    distribucionComprasMarca: DistribucionComprasMarcasDTO;
    topDiezMarcasCompras: ComprasMarcasTopDiezDTO;
}
