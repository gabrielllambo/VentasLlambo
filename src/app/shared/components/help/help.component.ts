import { CUSTOM_ELEMENTS_SCHEMA, Component, Inject, Input, OnDestroy, OnInit, Optional, inject } from '@angular/core';
import { Direction } from '@angular/cdk/bidi';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';



import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';

import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-help',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogClose,
    MatIconModule,

  ],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
})
export default class HelpComponent implements OnInit, OnDestroy {

  direction!: Direction;
  @Input() lstSrc: string[]

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public paramsForms: any,
    @Optional() public dialogRef: MatDialogRef<HelpComponent>)
    {
      this.lstSrc = paramsForms.lstSrc || [];
    }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  cerrarVentanaEmergente() {
    this.dialogRef.close();
  }

}

