import { DistribucionComprasCategoriaDTO } from "./distribucion-compras-categoria-dto.model";
import { EvolucionComprasCategoriaFechaDTO } from "./evolucion-compras-categorias-fecha-dto.model";
import { EvolucionComprasFechaDTO } from "./evolucion-compras-fecha-dto.model";
import { ComprasCategoriasTopDiezDTO } from "./compras-categorias-top-diez-dto.model";

export class CompraAnalisisCategoriasDTO {
    lstEvolucionComprasCategoriaFecha: EvolucionComprasCategoriaFechaDTO[];
    evolucionComprasFecha: EvolucionComprasFechaDTO;
    distribucionComprasCategoria: DistribucionComprasCategoriaDTO;
    topDiezCategoriasCompras: ComprasCategoriasTopDiezDTO;
}
