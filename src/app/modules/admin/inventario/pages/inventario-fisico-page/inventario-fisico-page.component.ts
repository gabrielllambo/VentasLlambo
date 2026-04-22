import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDrawer } from '@angular/material/sidenav';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service'; // Verifica que la ruta sea correcta
import { ResponseDTO } from 'app/core/models/generic/response-dto.model'; // IMPORT CORREGIDO
import { RegistrarInventarioFisicoRequest } from 'app/core/models/inventario/inventario-fisico/request/registrar-inventario-fisico-request.model';
import Swal from 'sweetalert2';
import { Observable, of, switchMap, forkJoin } from 'rxjs'; // Asegúrate de que forkJoin esté aquí

@Component({
  selector: 'app-inventario-fisico-page',
  templateUrl: './inventario-fisico-page.component.html'
  // Recuerda que quitamos standalone: true e imports: [] para que funcione con tu módulo
})
export class InventarioFisicoPageComponent implements OnInit {
  @ViewChild('matDrawer') matDrawer!: MatDrawer;

  // Configuración de la Tabla
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['producto', 'stockSistema', 'cantidadFisica', 'diferencia', 'acciones'];

  // Formularios (El signo ! evita el error de inicialización ts2564)
  filtroInventarioForm!: UntypedFormGroup;

  // Variable declarada correctamente (Evita el error ts2339)
  idUsuarioLogueado: string = '';

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _inventarioService: InventarioService,
    private _securityService: SecurityService
  ) {
    const token = this._securityService.getDecodetoken();
    this.idUsuarioLogueado = token?.idUsuario || '';
  }

  ngOnInit(): void {
    this.filtroInventarioForm = this._formBuilder.group({
      terminoBusqueda: ['', [Validators.required]]
    });
  }

  btnBuscar(): void {
    // El signo ? evita el error ts2531 de posible nulo
    const busqueda = this.filtroInventarioForm.get('terminoBusqueda')?.value;

    // El 'as any' evita el error ts2345 del tipo de dato del request
    this._inventarioService.GetAllLotesByFilterAsync({ numeroLote: busqueda } as any).subscribe(lotes => {
      if (lotes && lotes.length > 0) {

        const nuevosItems = lotes.map(l => ({
          idProducto: l.idProducto,
          idLoteProducto: l.id,
          nombreProducto: (l as any).nombreProducto || (l as any).producto,
          codigoLote: (l as any).codigoLote || (l as any).lote || 'N/A',
          cantidadSistema: (l as any).cantidadDisponible || (l as any).stock || 0,

          // 1. CAMBIA ESTO DE 0 a null para que el input empiece en blanco
          cantidadFisica: null,

          diferencia: -((l as any).cantidadDisponible || (l as any).stock || 0),
          observacion: ''
        }));

        this.dataSource.data = [...this.dataSource.data, ...nuevosItems];
        this.matDrawer.close();
      } else {
        Swal.fire('No encontrado', 'No hay lotes que coincidan con la búsqueda', 'warning');
      }
    });
  }

  calcularDiferencia(item: any): void {
    item.diferencia = item.cantidadFisica - item.cantidadSistema;
  }

  guardarBorrador(item: any): void {
    console.log("1. Clic detectado. Item a guardar: ", item);

    const request: RegistrarInventarioFisicoRequest = {
      idProducto: item.idProducto,
      idLoteProducto: item.idLoteProducto,
      cantidadFisica: Number(item.cantidadFisica), // Aseguramos que sea número
      idUsuarioGuid: this.idUsuarioLogueado,
      observacion: 'Conteo rápido desde página'
    };

    console.log("2. Objeto listo para enviar: ", request);

    this._inventarioService.RegistrarInventarioFisicoAsync(request).subscribe({
      next: (res: ResponseDTO) => {
        console.log("3. Respuesta del servidor: ", res);
        if (res.success) {
          Swal.fire('Guardado', 'El conteo ha sido registrado en la base de datos.', 'success');
          item.idInventarioFisico = res.value;
        } else {
          // Si el servidor responde pero dice que hubo error
          Swal.fire('Error', res.message || 'El servidor rechazó la petición', 'error');
        }
      },
      error: (err) => {
        // Si Angular no puede enviar la petición o el servidor está caído
        console.error("Error grave en la llamada HTTP: ", err);
        Swal.fire('Error del Sistema', 'Mira la pestaña "Console" (Consola) para ver el error técnico.', 'error');
      }
    });
  }

  onFinalizarAjuste(): void {
    // 1. DETECTAR OLVIDOS: Buscamos filas donde escribieron una cantidad pero olvidaron darle a la flecha azul.
    const itemsOlvidados = this.dataSource.data.filter(item =>
      item.cantidadFisica !== null &&
      item.cantidadFisica !== undefined &&
      item.cantidadFisica !== '' &&
      !item.idInventarioFisico
    );

    // Si encontramos al menos un producto olvidado, frenamos todo y los delatamos por su nombre
    if (itemsOlvidados.length > 0) {
      const nombresFaltantes = itemsOlvidados.map(item => item.nombreProducto || 'Producto sin nombre').join(', ');

      Swal.fire({
        title: '¡Tienes cambios sin guardar!',
        text: `Olvidaste hacer clic en la flecha azul para guardar el borrador de: ${nombresFaltantes}. Por favor, guárdalos antes de finalizar.`,
        icon: 'warning'
      });
      return; // Cortamos la ejecución aquí
    }

    // 2. VALIDACIÓN ORIGINAL: Buscamos cuántos items ya tienen el ID guardado
    const itemsGuardados = this.dataSource.data.filter(item => item.idInventarioFisico);

    // Si la tabla está totalmente vacía o no han guardado nada
    if (itemsGuardados.length === 0) {
      Swal.fire({
        title: 'No hay nada que ajustar',
        text: 'Primero debes ingresar la cantidad y hacer clic en el ícono de "Actualizar" (flechas azules) en la fila del producto.',
        icon: 'info'
      });
      return; // Cortamos la ejecución aquí
    }

    // 3. Si no hay olvidos y sí hay items guardados, procedemos con el cierre
    Swal.fire({
      title: '¿Finalizar Inventario?',
      text: `Vas a ajustar el stock de ${itemsGuardados.length} producto(s). ¡No se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ajustar stock'
    }).then((result) => {
      if (result.isConfirmed) {
        const peticiones = itemsGuardados.map(item =>
          this._inventarioService.AjustarInventarioFisicoAsync(item.idInventarioFisico, this.idUsuarioLogueado)
        );

        // B. forkJoin dispara todas de forma controlada y espera pacientemente a que todas terminen
        forkJoin(peticiones).subscribe({
          next: (respuestas) => {
            // C. Solo cuando C# confirma que TODO terminó sin errores, mostramos la alerta de éxito
            Swal.fire('¡Éxito!', 'El stock ha sido actualizado.', 'success');
            this.dataSource.data = []; // Limpiamos la tabla
          },
          error: (err) => {
            console.error("Error al ajustar stock:", err);
            Swal.fire('Error', 'Hubo un problema de conexión al ajustar el stock. Intenta de nuevo.', 'error');
          }
        });
      }
    });
}
}