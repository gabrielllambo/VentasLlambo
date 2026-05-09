import { inject, Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { SecurityService } from 'app/core/auth/auth.service';
import { MenuRolDTO } from 'app/core/models/parametro/menu-rol-dto.model';
import { Numeracion } from 'app/core/resource/dictionary.constants';
import { cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class NavigationMockApi {

    public menuList: MenuRolDTO[] = [];
    private _securityService = inject(SecurityService);

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    private readonly reportesNav = {
        id: 'reportes',
        title: 'Reportes',
        type: 'collapsable',
        icon: 'heroicons_outline:chart-bar',
        children: [
            {
                id: 'reportes.ventas',
                title: 'Ventas',
                type: 'collapsable',
                icon: 'heroicons_outline:shopping-cart',
                children: [
                    {
                        id: 'reportes.ventas-categorias',
                        title: 'Por Categorías',
                        type: 'basic',
                        icon: 'heroicons_outline:tag',
                        link: '/admin/ventas/reporte-categorias',
                    },
                    {
                        id: 'reportes.ventas-marcas',
                        title: 'Por Marcas',
                        type: 'basic',
                        icon: 'heroicons_outline:bookmark',
                        link: '/admin/ventas/reporte-marcas',
                    },
                    {
                        id: 'reportes.ventas-productos',
                        title: 'Por Productos',
                        type: 'basic',
                        icon: 'heroicons_outline:shopping-bag',
                        link: '/admin/ventas/reporte-productos',
                    },
                    {
                        id: 'reportes.ganancias',
                        title: 'Dashboard de Ganancias',
                        type: 'basic',
                        icon: 'heroicons_outline:currency-dollar',
                        link: '/admin/ventas/reporte-ganancias',
                    },
                ],
            },
            {
                id: 'reportes.compras',
                title: 'Compras',
                type: 'collapsable',
                icon: 'heroicons_outline:archive-box',
                children: [
                    {
                        id: 'reportes.compras-categorias',
                        title: 'Por Categorías',
                        type: 'basic',
                        icon: 'heroicons_outline:tag',
                        link: '/admin/compras/reporte-categorias',
                    },
                    {
                        id: 'reportes.compras-marcas',
                        title: 'Por Marcas',
                        type: 'basic',
                        icon: 'heroicons_outline:bookmark',
                        link: '/admin/compras/reporte-marcas',
                    },
                    {
                        id: 'reportes.compras-productos',
                        title: 'Por Productos',
                        type: 'basic',
                        icon: 'heroicons_outline:shopping-bag',
                        link: '/admin/compras/reporte-productos',
                    },
                ],
            },
            {
                id: 'reportes.inventario',
                title: 'Inventario',
                type: 'collapsable',
                icon: 'heroicons_outline:cube',
                children: [
                    {
                        id: 'reportes.perdidas',
                        title: 'Reporte de Pérdidas',
                        type: 'basic',
                        icon: 'heroicons_outline:exclamation-triangle',
                        link: '/admin/inventario/reporte-perdidas',
                    },
                ],
            },
        ],
    };

    registerHandlers(): void {
        this._fuseMockApiService
            .onGet('api/common/navigation')
            .reply(() => {

                this.menuList = this._securityService.getMenuStorage();

                const buildNavigation = (menuStorage: MenuRolDTO[], aside: boolean) => {
                    const dbItems = menuStorage
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

                    return [...dbItems, this.reportesNav];
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
