import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
 
import { Subject } from 'rxjs';
@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, NgIf, MatIconModule, NgClass, MatDividerModule],
})
export class UserComponent implements OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-e  slint/naming-convention */
    @Input() showAvatar: boolean = true;
    public decodeToken: DecodedToken;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    /**
     * Constructor
     */

    avatarSize: number = 40; // Tamaño en píxeles


    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
 
    ) {
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    /**
     * On init
     */
    ngOnInit(): void {
        const userData = localStorage.getItem('decodeTokenStorage');
        const userDataObject = JSON.parse(userData);
        if (userDataObject) {
            this.decodeToken = userDataObject.decodeToken
        }
    }
    get avatarDimensions(): string {
        return `${this.avatarSize}px`;
      }
    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * Update the user status
     *
     * @param status
     */
 
    /**
     * Sign out
     */
    signOut(): void {
        this._router.navigate(['/sign-out']);
    }
    
    configuracion(): void {
        this._router.navigate(['/admin/configuracion']);
    }
}