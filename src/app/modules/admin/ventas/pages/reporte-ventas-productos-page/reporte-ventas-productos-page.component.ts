import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { DictionaryErrors, DictionaryWarning } from 'app/core/resource/dictionaryError.constants';
import { DictionaryInfo, Flags, ImagenesUrl, Numeracion, StatusCode } from 'app/core/resource/dictionary.constants';
import { InventarioService } from 'app/core/services/inventario/inventario.service';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';;
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MatSelect } from '@angular/material/select';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ApexOptions } from 'ng-apexcharts';

import { VentaAnalisisProductosDTO } from 'app/core/models/venta/response/reporte/producto/venta-analisis-productos-dto.model';
import { ProductoDTO } from 'app/core/models/inventario/producto/response/producto-dto.model';
import { ObtenerProductoRequest } from 'app/core/models/inventario/producto/request/obtener-producto-request.model';
import { ObtenerReporteProductoRequest } from 'app/core/models/venta/request/obtener-reporte-producto-request.model';
import { DetalleVentaService } from 'app/core/services/detalleventa/detalleventa.service';
import { ObtenerReporteMarcaRequest } from 'app/core/models/venta/request/obtener-reporte-marca-request.model';

@Component({
    selector: 'app-reporte-ventas-productos-page',
    templateUrl: './reporte-ventas-productos-page.component.html',
    styleUrl: './reporte-ventas-productos-page.component.scss',
})

export class ReporteVentasProductosPageComponent implements OnInit, OnDestroy {

    @ViewChild('selectProductoItem') selectProductos: MatSelect;
    @ViewChild('matDrawer') matDrawer: MatDrawer;

    public disabledExportar: boolean = Flags.False;

    private decodeToken: DecodedToken = this.obtenerInfouserInfoLogueado();
    public monedaInfo: MonedaDTO = this.obtenerInfoMoneda();

    public isExportingReport: boolean = Flags.False;

    public currencyNumberFormat: Intl.NumberFormat;

    public chartEvolucionVentasProductoFecha: ApexOptions = {};
    public chartTotalizadoProductos: ApexOptions = {};
    public chartTopDiezProductos: ApexOptions = {};

    public disabledBuscar: boolean = Flags.False;

    public _unsubscribeAll: Subject<any> = new Subject<any>();
    public filtroAnalisisVentasForm: UntypedFormGroup;

    public ventasAnalisisDataSource: VentaAnalisisProductosDTO;

    public allProductosDataSource: ProductoDTO[];

    public skeleton: boolean = Flags.False;
    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    public imgNoDataHome: string = ImagenesUrl.noDataHome;
    public textoResultado: string = DictionaryInfo.NoDataResult;

    public rangoFecha: string[];
    public filtroRangoFecha: string = "";
    public fechaInicio: Date;
    public fechaFin: Date;

    constructor(
        private _securityService: SecurityService,
        private _formBuilder: UntypedFormBuilder,
        private _toolService: ToolService,
        private _detalleVentasService: DetalleVentaService,
        private _inventarioService: InventarioService,
    ) { }

    ngOnInit(): void {
        this.formFiltros();
        this.showSkeleton();
        this.getResumen(Flags.False);
        this.getFilterComboConsulta();
    }

    formFiltros() {
        this.filtroAnalisisVentasForm = this._formBuilder.group({
            fechaVentaInicio: [this._toolService.getStartDateOfMonth(), [Validators.required]],
            fechaVentaFin: [this._toolService.getEndDateOfMonth(), [Validators.required]],
            productos: [''],
        });
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    }

    getFilterComboConsulta() {
        forkJoin({
            dataProductos: this._inventarioService.GetAllProductoForComboBoxAsync(),
        }).subscribe({
            next: (response) => {
                this.allProductosDataSource = response.dataProductos;
                this.filtroAnalisisVentasForm.get('productos')?.setValue(this.allProductosDataSource);
            },
            error: (err) => {

                this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
                this.disabledBuscar = Flags.False;
                this.disabledExportar = Flags.True;
                console.log(err);
            },
        });
    }

    getResumen(hideFilter: boolean) {
        this.showSkeleton();

        const request = this.obtenerRequest();
        this.disabledBuscar = Flags.True;
        this._detalleVentasService.GetAnalisisProductosByFilterAsync(request).subscribe((response: VentaAnalisisProductosDTO) => {
            this.ventasAnalisisDataSource = response;
            this.disabledBuscar = Flags.False;
            this.getFechaFiltroCadena();
            this.generateCharts();
            if (hideFilter) {
                this.closedDrawer();
            }
            this.hideSkeleton();
            if (response.distribucionVentasProducto.totalVentasProductos.length > Numeracion.Cero) {
                this.disabledExportar = Flags.False;
            } else {
                this.disabledExportar = Flags.True;
            }
        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.disabledBuscar = Flags.False;
            console.log(err);
            if (hideFilter) {
                this.closedDrawer();
            }
        });
    }

    generateCharts() {
        this.rangoFecha = this.getRangeDate();
        this.generarchartEvolucionVentasProductoFecha();
        this.generarchartTotalizadoProductos();
        this.generarChartTopDiezProductos();
    }

    getRangeDate(): string[] {
        return this.ventasAnalisisDataSource.evolucionVentasFecha.fechaVenta.map(fecha => this._toolService.formatoFecha(fecha));
    }

    generarchartEvolucionVentasProductoFecha() {
        const seriesData = this.ventasAnalisisDataSource.lstEvolucionVentasProductoFecha.map(Producto => {
            return {
                color: Producto.colorProducto,
                name: Producto.nombreProducto,
                data: this.rangoFecha.map(fecha => {
                    const ventaEncontrado = Producto.datosVentasAgrupados.find(g => this._toolService.formatoFecha(g.fechaVenta) === fecha);
                    return ventaEncontrado ? ventaEncontrado.montoVentaTotal : Numeracion.Cero;
                })
            };
        });

        this.chartEvolucionVentasProductoFecha = {
            series: seriesData,
            chart: {
                type: "bar",
                height: 350,
                stacked: true,
                toolbar: {
                    show: false,
                },
            },
            noData: {
                text: 'Seleccione una categoría',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#000000',
                    fontSize: '14px'
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: "55%",
                }
            },
            dataLabels: {
                enabled: false,
                style: {
                    fontSize: '12px',
                },
            },
            stroke: {
                show: true,
                width: 2,
                colors: ["transparent"]
            },
            xaxis: {
                categories: this.rangoFecha,
                labels: {
                    rotateAlways: true,
                    rotate: -45
                },

            },
            yaxis: {
                labels: {
                    formatter: (val: number) => {
                        return this.currencyNumberFormat.format(val);
                    },
                    style: {
                        fontSize: '12px',
                    }
                }
            },
            fill: {
                opacity: 1
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val: number) => {
                        return this.currencyNumberFormat.format(val);
                    },
                },
            },
        };

    }

    generarchartTotalizadoProductos(): void {
        const isMovilSize = this.isMobilSize();

        const totalVentas = this.ventasAnalisisDataSource.distribucionVentasProducto.totalVentasProductos.reduce((acc, curr) => acc + curr, 0);

        this.chartTotalizadoProductos = {
            chart: {
                type: "donut",
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '95%',

            },
            responsive: [
                {
                    breakpoint: 600,
                    options: {
                        chart: {
                            width: '100%',
                            height: 350
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            ],
            labels: this.ventasAnalisisDataSource.distribucionVentasProducto.nombreProductos,
            series: this.ventasAnalisisDataSource.distribucionVentasProducto.totalVentasProductos,
            noData: {
                text: 'Seleccione una categoría',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#000000',
                    fontSize: '14px'
                }
            },
            colors: this.ventasAnalisisDataSource.distribucionVentasProducto.coloresProductos,
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val: number) => {
                        return this.currencyNumberFormat.format(val);
                    }
                }
            },
            dataLabels: {
                enabled: true
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            name: {
                                show: false
                            },
                            value: {
                                show: true,
                                fontSize: isMovilSize ? '19px' : '22px',
                                color: '#494949',
                                offsetY: 0,
                                formatter: () => {
                                    return this.currencyNumberFormat.format(totalVentas);
                                }
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: '',
                                fontSize: isMovilSize ? '19px' : '22px',
                                color: '#494949',
                                formatter: () => {
                                    return this.currencyNumberFormat.format(totalVentas);
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    generarChartTopDiezProductos() {

        const currencyFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);

        this.chartTopDiezProductos = {
            series: [{
                name: "Total",
                data: this.ventasAnalisisDataSource.topDiezProductosVentas.totalMontos
            }],
            noData: {
                text: 'Seleccione una categoría',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#000000',
                    fontSize: '14px'
                }
            },
            colors: this.ventasAnalisisDataSource.topDiezProductosVentas.colores,
            chart: {
                type: "bar",
                height: 350,
                toolbar: {
                    show: false,
                },
            },
            plotOptions: {
                bar: {
                    barHeight: "100%",
                    distributed: true,
                    horizontal: true,
                    dataLabels: {
                        position: "top"
                    }
                }
            },
            dataLabels: {
                enabled: true,
                textAnchor: "middle",
                formatter: function (val: number) {
                    return currencyFormat.format(val);
                },
                offsetY: -6,
                style: {
                    colors: ["#FFFFFF"],
                    fontSize: '12px',
                    fontWeight: 'bold',
                },
                dropShadow: {
                    enabled: true,
                    top: 1,
                    left: 1,
                    blur: 2,
                    color: '#000000',
                    opacity: 0.5
                }
            },
            stroke: {
                width: 1,
                colors: ["#fff"]
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val: number) => {
                        return currencyFormat.format(val);
                    },
                },
            },
            xaxis: {
                categories: this.ventasAnalisisDataSource.topDiezProductosVentas.productos,
                labels: {
                    show: false,
                    style: {
                        fontSize: "12px",
                    },
                    formatter: function (val: any) {
                        if (typeof val === 'number') {
                            return currencyFormat.format(val);
                        }
                        return val;
                    },
                },
            },
        };
    }

    getReportePorProductoAsync() {

        if (this.ventasAnalisisDataSource.distribucionVentasProducto.totalVentasProductos.length == Numeracion.Cero && this.ventasAnalisisDataSource.distribucionVentasProducto.totalVentasProductos.length == Numeracion.Cero) {
            return;
        }

        if (this.filtroAnalisisVentasForm.invalid) { return; }

        const request = this.obtenerRequestReporte();

        this.isExportingReport = Flags.True
        this._detalleVentasService.GetReportePorProductosAsync(request).subscribe((response: any) => {
            this.isExportingReport = Flags.False;
            if (response) {
                const fileURL = window.URL.createObjectURL(new Blob([response], { type: "application/vnd.ms-excel" }))
                const a = document.createElement('a')
                a.download = `Reporte_Venta_Por_Productos_${this.getFechaFiltroCadenaReporte()}.xlsx`;
                a.href = fileURL
                a.click()
                a.parentNode?.removeChild(a)
            }
        }, err => {
            if (err.status == StatusCode.Forbidden) {
                this._toolService.showWarning(DictionaryWarning.InvalidPermisos, DictionaryWarning.Tittle);
                this.isExportingReport = Flags.False = Flags.False;
                console.log(err);
                return;
            }
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.isExportingReport = Flags.False
            console.log(err);
        });
    }

    getFechaFiltroCadenaReporte(): string {
        const fechaInicio = this._toolService.formatoFecha(this.fechaInicio)
        const fechafin = this._toolService.formatoFecha(this.fechaFin)

        return `del_${fechaInicio}_hasta_${fechafin}`.trim();
    }

    isMobilSize(): boolean {
        return this._toolService.isMobilSize();
    }

    obtenerRequest(): ObtenerReporteProductoRequest {

        const request = new ObtenerReporteProductoRequest();

        request.destinationTimeZoneId = this._toolService.getTimeZone();

        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaVentaInicio = this.filtroAnalisisVentasForm.get('fechaVentaInicio').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaVentaInicio').value;
        request.fechaVentaFin = this.filtroAnalisisVentasForm.get('fechaVentaFin').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaVentaFin').value;
        request.lstProductos = [];

        if (this.selectProductos) {
            const selectProductos = this.selectProductos.options.filter(x => x.selected == true && x.value != 0)
            selectProductos.forEach(element => {
                request.lstProductos?.push(element.value.id);
            });
        }

        this.fechaInicio = request.fechaVentaInicio
        this.fechaFin = request.fechaVentaFin

        return request;
    }
 
    obtenerRequestReporte(): ObtenerReporteProductoRequest {

        const request = new ObtenerReporteProductoRequest();

        request.destinationTimeZoneId = this._toolService.getTimeZone();

        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaVentaInicio = this.filtroAnalisisVentasForm.get('fechaVentaInicio').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaVentaInicio').value;
        request.fechaVentaFin = this.filtroAnalisisVentasForm.get('fechaVentaFin').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaVentaFin').value;
        request.lstProductos = [];

        this.fechaInicio = request.fechaVentaInicio
        this.fechaFin = request.fechaVentaFin

        if (this.selectProductos) {
            const selectProductos = this.selectProductos.options.filter(x => x.selected == true && x.value != 0)
            selectProductos.forEach(element => {
                request.lstProductos?.push(element.value.id);
            });
        }

        return request;
    }

    getFechaFiltroCadena() {
        const fechaInicio = this._toolService.formatoFecha(this.fechaInicio)
        const fechafin = this._toolService.formatoFecha(this.fechaFin)

        this.filtroRangoFecha = `Desde ${fechaInicio} Hasta ${fechafin}`.trim();
    }

    obtenerInfouserInfoLogueado(): DecodedToken {
        return this._securityService.getDecodetoken();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closedDrawer() {
        this.matDrawer.close();
    }

    showSkeleton() {
        this.skeleton = Flags.Show
    }

    hideSkeleton() {
        this.skeleton = Flags.Hide
    }

    obtenerInfoMoneda(): MonedaDTO {
        return this._securityService.getMonedaStorage();
    }
}
