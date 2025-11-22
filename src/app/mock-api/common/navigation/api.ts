import { inject, Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { SecurityService } from 'app/core/auth/auth.service';
import { MenuRolDTO } from 'app/core/models/parametro/menu-rol-dto.model';
import { Numeracion } from 'app/core/resource/dictionary.constants';
import { cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class NavigationMockApi {

    public menuList: MenuRolDTO[]
    private _securityService = inject(SecurityService);

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    registerHandlers(): void {
        this._fuseMockApiService
            .onGet('api/common/navigation')
            .reply(() => {

                this.menuList = this._securityService.getMenuStorage();

                const buildNavigation = (menuStorage: MenuRolDTO[], aside: boolean) => {
                    return menuStorage
                        .filter(menu => !menu.flgMenuHijo)
                        .map(parentMenu => {



                            const children = menuStorage
                                .filter(menu => menu.flgMenuHijo && menu.padre === parentMenu.padre)
                                .map(child => ({
                                    id: child.hijoTexto,
                                    title: child.titulo,
                                    type: child.tipo = aside && child.tipo == "group" ? "aside" : child.tipo,
                                    icon: child.icono,
                                    link: child.ruta,
                                    externalLink: child.flgEnlaceExterno,

                                }));

                            return {
                                id: parentMenu.padre,
                                title: parentMenu.titulo,
                                type: parentMenu.tipo = aside && parentMenu.tipo == "group" ? "aside" : parentMenu.tipo,
                                icon: parentMenu.icono,
                                link: parentMenu.ruta,
                                externalLink: parentMenu.flgEnlaceExterno,
                                children: children.length > Numeracion.Cero ? children : undefined,
                                target: parentMenu.flgEnlaceExterno == true ? '_blank' : ''
                            };
                        });
                };

                const compactNavigation = buildNavigation(this.menuList, true);
                const defaultNavigation = buildNavigation(this.menuList, false);
                const horizontalNavigation = buildNavigation(this.menuList, false);

                return [
                    200,
                    {
                        compact: cloneDeep(compactNavigation),
                        default: cloneDeep(defaultNavigation),
                        horizontal: cloneDeep(horizontalNavigation),
                    },
                ];
            });
    }
}
