import { CommonModule, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import {   Flags } from 'app/core/resource/dictionary.constants';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FuseValidators } from '@fuse/validators';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { ToolService } from 'app/core/services/tool/tool.service';
import { EnviarEnlacePagoRequest } from 'app/core/models/usuario/request/enviar-enlace-pago-request.model';
import { ResponseDTO } from 'app/core/models/generic/response-dto.model';
import * as CustomValidator from 'app/core/util/functions';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'landing-home',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FuseCardComponent, FormsModule, MatButtonModule, CommonModule, NgIf, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, RouterModule],
})
export class LandingHomeComponent implements OnInit {
  public isCallingService: boolean = Flags.False;
  mostrarFormulario: boolean = false;
  nombre: string;
  correo: string;
  disabledInputs: boolean = false
 
  // Variables para manejar el estado del warning
  nombreInvalido: boolean = false;
  correoInvalido: boolean = false;
  constructor(private route: ActivatedRoute, private router: Router,
    private _usuarioService: UsuarioService,
    private _toolService: ToolService,
    private cdr: ChangeDetectorRef,
    private titleService: Title, private metaService: Meta,
    @Inject(DOCUMENT) private document: Document,
  ) { }
  ngOnInit() {
    this.titleService.setTitle('Sistema de Ventas | Código Fuente en Angular 18, SQL y .NET 9');
    this.metaService.updateTag({
      name: 'description',
      content: 'Adquiere el código fuente del sistema de ventas más completo. Desarrollado con Angular 18, .NET 9 y SQL Server. Ideal para desarrolladores y empresas.'
    });
   
  
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const el = this.document.getElementById(fragment);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
 
  }

  openFaq: number | null = null;

  toggleAccordion(faqId: number): void {
    if (this.openFaq === faqId) {
      this.openFaq = null;
    } else {
      this.openFaq = faqId;
    }
  }
  scrollToPrecio() {
  
      const element = this.document.getElementById("precio");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
  
  }
  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  solicitarSistema() {
    
    const destinationTimeZoneId = this._toolService.getTimeZone();

    if (FuseValidators.isEmptyInputValue(destinationTimeZoneId)) {
      this._toolService.showWarning(DictionaryWarning.InvalidLocalizacion, DictionaryWarning.Tittle);
      return;
    }

    if (FuseValidators.isEmptyInputValue(this.nombre)) {
      this._toolService.showWarning(DictionaryWarning.RequiredNombre, DictionaryWarning.Tittle);
      this.nombreInvalido = Flags.True;
      return;
    } else {
      this.nombreInvalido = Flags.False;
    }

    if (FuseValidators.isEmptyInputValue(this.correo)) {
      this._toolService.showWarning(DictionaryWarning.RequiredCorreo, DictionaryWarning.Tittle);
      this.correoInvalido = Flags.True;
      return;
    } else {
      this.correoInvalido = Flags.False;
    }

    if (!CustomValidator.UtilExtension.isValidNombreApellido(this.nombre)) {
      this._toolService.showWarning(DictionaryWarning.InvalidNombre, DictionaryWarning.Tittle);
      this.nombreInvalido = Flags.True;
      return;
    }

    if (!CustomValidator.UtilExtension.isValidCorreo(this.correo)) {
      this._toolService.showWarning(DictionaryWarning.InvalidCorreo, DictionaryWarning.Tittle);
      this.correoInvalido = Flags.True;
      return;
    }

    const request = new EnviarEnlacePagoRequest();
    
    request.nombre = this.nombre;
    request.correo = this.correo;
    request.destinationTimeZoneId = destinationTimeZoneId;

    this.isCallingService = Flags.True;
    this.disabledInputs = Flags.True;

    this._usuarioService.EnviarEnlacePagoAsync(request).subscribe((response: ResponseDTO) => {
      if (response.success == Flags.SuccessTransaction) {
        this._toolService.showSuccess(response.message, response.titleMessage);
        this.isCallingService = Flags.False;
        this.mostrarFormulario = Flags.False;
        this.disabledInputs = Flags.False;
        this.nombre = null;
        this.correo = null;
        this.cdr.detectChanges();
        return;
      }
    }, err => {
      this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
      this.isCallingService = Flags.False;
      console.log(err);
    });
  }
}
