import { CategoriaDTO } from "../../categoria/response/categoria-dto.model";
import { MarcaDTO } from "../../marca/response/marca-dto.model";

 export class ProductoSeleccionadosVenta {
    id: number;
    codigo:string;
    nombre: string;
    color: string;
    precioCompra:number;
    precioVenta:number;
    stock: number;
    urlFoto: string;
    cantidad: number;
    categoria: CategoriaDTO;
    marca: MarcaDTO;
}
