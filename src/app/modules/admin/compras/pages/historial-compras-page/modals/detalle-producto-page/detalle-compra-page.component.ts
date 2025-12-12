import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { DetalleCompraDTO } from 'app/core/models/compra/response/detalle-compra-dto.model';
import { Flags, Numeracion } from 'app/core/resource/dictionary.constants';
import { SpanishDetalleComprasPaginatorService } from 'app/core/services/paginator/compras/detalle/spanish-detalle-compras-paginator.service';
import { ToolService } from 'app/core/services/tool/tool.service';

@Component({
  selector: 'app-detalle-compra-page',
  templateUrl: './detalle-compra-page.component.html',
  styleUrls: ['./detalle-compra-page.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: SpanishDetalleComprasPaginatorService
    }
  ],
})
export class DetalleCompraPageComponent implements OnInit {

  public pageSlice: MatTableDataSource<DetalleCompraDTO> = new MatTableDataSource();
  public detalleCompraTableColumns: string[] = [
    'urlfotoproducto',
    'nombreproducto',
    'nombrecategoria',
    'nombremarca',
    'preciocompra',
    'cantidad',
    'total'
  ];

  public allDetalleCompraDataSource: MatTableDataSource<DetalleCompraDTO> = new MatTableDataSource();

  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild('detalleCompraTable', { read: MatSort }) private detalleCompraMatSort: MatSort;

  public numeroCompra: string;
  public monedaInfo: MonedaDTO;
  public isCallingService: boolean = Flags.False;

  constructor(
    public matDialogRef: MatDialogRef<DetalleCompraPageComponent>,
    @Inject(MAT_DIALOG_DATA) public paramsForms: any,
    private _toolService: ToolService
  ) {}

  ngOnInit(): void {
    this.monedaInfo = this.paramsForms.monedaInfo;
    this.allDetalleCompraDataSource.data = this.paramsForms.lstDetalleCompra;
    this.numeroCompra = this.paramsForms.numeroCompra;

    this.setPageSlice(this.paramsForms.lstDetalleCompra);
  }

  cerrarVentanaEmergente() {
    this.matDialogRef.close();
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  onPageChange(event: any): void {
    const startIndex = event.pageIndex * event.pageSize;
    let endIndex = startIndex + event.pageSize;

    if (endIndex > this.allDetalleCompraDataSource.data.length) {
      endIndex = this.allDetalleCompraDataSource.data.length;
    }

    this.pageSlice.data = this.allDetalleCompraDataSource.data.slice(startIndex, endIndex);
  }

  setPageSlice(data: DetalleCompraDTO[]) {
    this.pageSlice.data = data.slice(Numeracion.Cero, Numeracion.Diez);
    if (this._paginator) {
      this._paginator.pageIndex = Numeracion.Cero;
      this._paginator.pageSize = Numeracion.Diez;
    }
  }

  ngAfterViewInit() {
    this.allDetalleCompraDataSource.sort = this.detalleCompraMatSort;
    this.allDetalleCompraDataSource.paginator = this._paginator;
  }
}
