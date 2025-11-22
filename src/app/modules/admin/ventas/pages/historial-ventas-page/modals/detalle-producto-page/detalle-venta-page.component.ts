import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SecurityService } from 'app/core/auth/auth.service';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { DetalleVentaDTO } from 'app/core/models/venta/response/detalle-venta-dto.model';
import { Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { SpanishDetalleVentasPaginatorService } from 'app/core/services/paginator/ventas/detalle/spanish-detalle-ventas-paginator.service';
import { ToolService } from 'app/core/services/tool/tool.service';

@Component({
  selector: 'app-detalle-venta-page',
  templateUrl: './detalle-venta-page.component.html',
  styleUrl: './detalle-venta-page.component.scss',
    providers: [
          {
              provide: MatPaginatorIntl,
              useClass: SpanishDetalleVentasPaginatorService,
          }
      ],
})
export class DetalleVentaPageComponent implements OnInit {

  public pageSlice: MatTableDataSource<DetalleVentaDTO> = new MatTableDataSource();
  public detalleVentaTableColumns: string[] = ['urlfotoproducto', 'nombreproducto', 'categoriaproducto', 'marcaproducto', 'precioproducto', 'cantidad', 'total',];
  public allDetalleVentaDataSource: MatTableDataSource<DetalleVentaDTO> = new MatTableDataSource();

  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild('detalleVentaTable', { read: MatSort })
  private detalleVentaTableeMatSort: MatSort;

  public numeroVenta: string;

  public isCallingService: boolean = Flags.False;
  public monedaInfo: MonedaDTO;
  constructor(
    public matDialogRef: MatDialogRef<DetalleVentaPageComponent>,
    @Inject(MAT_DIALOG_DATA)
    public paramsForms: any,
    private _toolService: ToolService,
    private _securityService: SecurityService,
  ) {
  }

  ngOnInit(): void {
    this.monedaInfo = this.paramsForms.monedaInfo;
    this.allDetalleVentaDataSource.data = this.paramsForms.lstDetalleVenta;
    this.numeroVenta = this.paramsForms.numeroVenta;
    this.setPageSlice(this.paramsForms.lstDetalleVenta);
  }

  cerrarVentanaEmergente() {
    this.matDialogRef.close();
  }

  isMobilSize(): boolean {
    return this._toolService.isMobilSize();
  }

  obtenerInfouserInfoLogueado(): DecodedToken {
    return this._securityService.getDecodetoken();
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  sortingActivoData = (data: any, sortHeaderId: string) => {
    return this._toolService.sortingActivoData(data, sortHeaderId);
  };

  onPageChange(event: any): void {
    const startIndex = event.pageIndex * event.pageSize;
    let endIndex = startIndex + event.pageSize;
    if (endIndex > this.allDetalleVentaDataSource.data.length) {
      endIndex = this.allDetalleVentaDataSource.data.length;
    }

    this.pageSlice.data = this.allDetalleVentaDataSource.data.slice(startIndex, endIndex);
  }

  setPageSlice(data) {
    this.pageSlice.data = data.slice(Numeracion.Cero, Numeracion.Diez);
    if (this._paginator) {
      this._paginator.pageIndex = Numeracion.Cero;
      this._paginator.pageSize = Numeracion.Diez;
    }
  }

  ngAfterViewInit() {
    this.allDetalleVentaDataSource.sort = this.detalleVentaTableeMatSort;
    this.allDetalleVentaDataSource.paginator = this._paginator;
  }
}
