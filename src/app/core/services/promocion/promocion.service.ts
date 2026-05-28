import { Injectable } from '@angular/core';

export interface PromocionProducto {
    id: number;
    nombre: string;
    urlFoto?: string;
    codigo?: string;
}

export interface PromocionDTO {
    id: string;
    motivo: string;
    descuentoPorcentaje: number;
    fechaInicio: string;
    fechaFin: string;
    productos: PromocionProducto[];
    activo: boolean;
    fechaCreacion: string;
}

@Injectable({ providedIn: 'root' })
export class PromocionService {

    private readonly STORAGE_KEY = 'vl_promociones';

    getAll(): PromocionDTO[] {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) ?? '[]');
        } catch {
            return [];
        }
    }

    getActivas(): PromocionDTO[] {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return this.getAll().filter(p => {
            if (!p.activo) return false;
            const inicio = new Date(p.fechaInicio);
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date(p.fechaFin);
            fin.setHours(23, 59, 59, 999);
            return hoy >= inicio && hoy <= fin;
        });
    }

    getActivaParaProducto(idProducto: number): PromocionDTO | null {
        return this.getActivas().find(p => p.productos.some(pr => pr.id === idProducto)) ?? null;
    }

    crear(promo: Omit<PromocionDTO, 'id' | 'fechaCreacion' | 'activo'>): PromocionDTO {
        const nueva: PromocionDTO = {
            ...promo,
            id: this._uuid(),
            activo: true,
            fechaCreacion: new Date().toISOString(),
        };
        const all = this.getAll();
        all.unshift(nueva);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
        return nueva;
    }

    actualizar(id: string, data: Omit<PromocionDTO, 'id' | 'fechaCreacion' | 'activo'>): void {
        const all = this.getAll();
        const idx = all.findIndex(p => p.id === id);
        if (idx !== -1) {
            all[idx] = { ...all[idx], ...data };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
        }
    }

    toggleActivo(id: string): void {
        const all = this.getAll();
        const idx = all.findIndex(p => p.id === id);
        if (idx !== -1) {
            all[idx].activo = !all[idx].activo;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
        }
    }

    eliminar(id: string): void {
        const all = this.getAll().filter(p => p.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    }

    esActiva(promo: PromocionDTO): boolean {
        if (!promo.activo) return false;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicio = new Date(promo.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(promo.fechaFin);
        fin.setHours(23, 59, 59, 999);
        return hoy >= inicio && hoy <= fin;
    }

    getEstado(promo: PromocionDTO): 'activa' | 'inactiva' | 'vencida' | 'pendiente' {
        if (!promo.activo) return 'inactiva';
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicio = new Date(promo.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(promo.fechaFin);
        fin.setHours(23, 59, 59, 999);
        if (hoy > fin) return 'vencida';
        if (hoy < inicio) return 'pendiente';
        return 'activa';
    }

    private _uuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
}
