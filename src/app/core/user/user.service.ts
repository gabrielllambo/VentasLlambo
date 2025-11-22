import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { userInfoLogueado } from 'app/core/userInfoLogueado/userInfoLogueado.types';
import { map, Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({providedIn: 'root'})
export class userInfoLogueadoService
{
    private _httpClient = inject(HttpClient);
    private _userInfoLogueado: ReplaySubject<userInfoLogueado> = new ReplaySubject<userInfoLogueado>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for userInfoLogueado
     *
     * @param value
     */
    set userInfoLogueado(value: userInfoLogueado)
    {
        // Store the value
        this._userInfoLogueado.next(value);
    }

    get userInfoLogueado$(): Observable<userInfoLogueado>
    {
        return this._userInfoLogueado.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in userInfoLogueado data
     */
    get(): Observable<userInfoLogueado>
    {
        return this._httpClient.get<userInfoLogueado>('api/common/userInfoLogueado').pipe(
            tap((userInfoLogueado) =>
            {
                this._userInfoLogueado.next(userInfoLogueado);
            }),
        );
    }

    /**
     * Update the userInfoLogueado
     *
     * @param userInfoLogueado
     */
    update(userInfoLogueado: userInfoLogueado): Observable<any>
    {
        return this._httpClient.patch<userInfoLogueado>('api/common/userInfoLogueado', {userInfoLogueado}).pipe(
            map((response) =>
            {
                this._userInfoLogueado.next(response);
            }),
        );
    }
}
