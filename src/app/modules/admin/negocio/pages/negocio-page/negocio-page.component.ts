import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { SecurityService } from 'app/core/auth/auth.service';

import { UsuarioService } from 'app/core/services/usuario/usuario.service';
import { Subject, takeUntil } from 'rxjs';

import { ToolService } from 'app/core/services/tool/tool.service';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';

import { ParametroGeneralDTO } from 'app/core/models/parametro/parametro-general-dto.model';
import { UsuarioDTO } from 'app/core/models/usuario/response/usuario-dto.model';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { ParametroGeneralService } from 'app/core/services/parametro/parametro-general.service';
import { NegocioDTO } from 'app/core/models/parametro/negocio-dto.model';


@Component({
    selector: 'app-negocio-page',
    templateUrl: './negocio-page.component.html',
    styleUrl: './negocio-page.component.scss',
})

export class NegocioPageComponent implements OnInit, OnDestroy {

    public userlogin: DecodedToken;

    public negocioData: NegocioDTO;

    @ViewChild('drawer') drawer: MatDrawer;
    public drawerMode: 'over' | 'side' = 'side';
    public drawerOpened: boolean = true;
    public panels: any[] = [];
    public selectedPanel: string = 'informacion';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _parametroService: ParametroGeneralService,
        private _securityService: SecurityService,
    ) {

    }

    ngOnInit(): void {
        this._parametroService.negocioData$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response: NegocioDTO) => {
                this.negocioData = response;
            });

        this.userlogin = this.obtenerInfouserInfoLogueado();

        this.panels = [
            {
                id: 'informacion',
                icon: 'heroicons_outline:user-circle',
                title: 'Información',
                description: 'Administre su información empresarial',
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



