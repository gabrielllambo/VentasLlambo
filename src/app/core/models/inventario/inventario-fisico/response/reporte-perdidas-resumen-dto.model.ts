import { HistorialInventarioFisicoDTO } from './historial-inventario-fisico-dto.model';

export class TopProductosPerdidasDTO {
    colores: string[];
    productos: string[];
    cantidadesPerdidas: number[];
    valoresPerdidos: number[];
}

export class EvolucionPerdidasFechaDTO {
    fechas: Date[];
    cantidadesPerdidas: number[];
    valoresPerdidos: number[];
}

export class DistribucionPerdidasCategoriaDTO {
    coloresCategorias: string[];
    nombreCategorias: string[];
    valoresPerdidosCategorias: number[];
}

export class ReportePerdidasResumenDTO {
    lstHistorial: HistorialInventarioFisicoDTO[];
    totalRegistros: number;
    totalUnidadesPerdidas: number;
    totalValorPerdido: number;
    totalAjustados: number;
    topProductosPerdidas: TopProductosPerdidasDTO;
    evolucionPerdidasFecha: EvolucionPerdidasFechaDTO;
    distribucionPerdidasCategoria: DistribucionPerdidasCategoriaDTO;
}
