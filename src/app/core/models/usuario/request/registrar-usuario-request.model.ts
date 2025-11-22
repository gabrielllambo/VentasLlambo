export class RegistrarUsuarioRequest {
    destinationTimeZoneIdRegistro: string;
    idUsuario: string;
    idRol: number;
    idTipoDocumento: number;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    idGenero: number;
    correoElectronico: string;
    fechaNacimiento: Date;
    celular: string;
    direccion: string;
    contrasenia: string;
}
