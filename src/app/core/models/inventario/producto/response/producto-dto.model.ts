import { CategoriaDTO } from "../../categoria/response/categoria-dto.model";
import { MarcaDTO } from "../../marca/response/marca-dto.model";

export class ProductoDTO {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    color: string;
    precioCompra: number | null;
    precioVenta: number;
    stock: number | null;
    urlFoto: string;
    fechaRegistro: Date;
    fechaActualizacion: Date;
    activo: boolean;
    categoria: CategoriaDTO;
    marca: MarcaDTO;
    cantidad: number;
    fechaCaducidad: Date | null;
    tipoMedida: number;
}
