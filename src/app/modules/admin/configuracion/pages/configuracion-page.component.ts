import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { SecurityService } from 'app/core/auth/auth.service';

import { UsuarioService } from 'app/core/services/usuario/usuario.service';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioDTO } from '../../../../core/models/usuario/response/usuario-dto.model';
import { ToolService } from 'app/core/services/tool/tool.service';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { ParametroGeneralDTO } from 'app/core/models/parametro/parametro-general-dto.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ParametroGeneralService } from 'app/core/services/parametro/parametro-general.service';

@Component({
    selector: 'app-configuracion-page',
    standalone: false,

    templateUrl: './configuracion-page.component.html',
    styleUrl: './configuracion-page.component.scss'
})
export class ConfiguracionPageComponent implements OnInit, OnDestroy {

    public usuarioDetalleSource: UsuarioDTO;
    public parametrosGeneralesSource: ParametroGeneralDTO[];

    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'account';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _usuarioService: UsuarioService,
        private _parametrosService: ParametroGeneralService,
        private _securityService: SecurityService,
        private _toolService: ToolService
    ) {

    }

    ngOnInit(): void {

        this._usuarioService.usuarioData$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                this.usuarioDetalleSource = response;
            });

 
        this.panels = [
            {
                id: 'account',
                icon: 'heroicons_outline:user-circle',
                title: 'Cuenta',
                description: 'Administre su información personal',
            },
            {
                id: 'security',
                icon: 'heroicons_outline:lock-closed',
                title: 'Seguridad',
                description: 'Administre su contraseña',
            },
 
        ];

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Set the drawerMode and drawerOpened
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                }
                else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }
                this._changeDetectorRef.markForCheck();
            });
    }
 
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
    }

    getPanelInfo(id: string): any {
        return this.panels.find(panel => panel.id === id);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }
}
