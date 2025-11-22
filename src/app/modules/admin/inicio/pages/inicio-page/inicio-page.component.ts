import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { DictionaryErrors } from 'app/core/resource/dictionaryError.constants';
import { DictionaryInfo, Flags, ImagenesUrl, Numeracion } from 'app/core/resource/dictionary.constants';
import { SecurityService } from 'app/core/auth/auth.service';
import { ToolService } from 'app/core/services/tool/tool.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';;
import { MatDrawer } from '@angular/material/sidenav';
import { DecodedToken } from 'app/core/models/auth/response/decode-token-dto.model';
import { MatSelect } from '@angular/material/select';
import { MonedaDTO } from 'app/core/models/parametro/moneda-dto.model';
import { ApexOptions, ChartComponent } from 'ng-apexcharts';
import { ObtenerResumenReporteRequest } from 'app/core/models/venta/request/obtener-totalizado-fecha-request.model';
import { ReporteResumenDTO } from 'app/core/models/venta/response/reporte/reporte-resumen-dto.model';
import { DetalleVentaService } from 'app/core/services/detalleventa/detalleventa.service';
import { ObtenerColaboradoresActivosDTO } from 'app/core/models/usuario/response/obtener-colaboradores-activos-dto.model';
import { ObtenerColaboradoresRequest } from 'app/core/models/usuario/request/obtener-colabores-request.model';
import { UsuarioService } from 'app/core/services/usuario/usuario.service';

@Component({
    selector: 'app-inicio-page',
    templateUrl: './inicio-page.component.html',
    styleUrl: './inicio-page.component.scss',
})

export class InicioPageComponent implements OnInit, OnDestroy {


    @ViewChild('selectProductos') selectProductos: MatSelect;
    @ViewChild('matDrawer') matDrawer: MatDrawer;

    public disabledExportar: boolean = Flags.False;

    public decodeToken: DecodedToken = this.obtenerInfouserInfoLogueado();
    public monedaInfo: MonedaDTO = this.obtenerInfoMoneda();

    public isExportingReport: boolean = Flags.False;

    public currencyNumberFormat: Intl.NumberFormat;

    public chartEvolucionVentasProductosFecha: ApexOptions = {};

    public chartTopDiezProductos: ApexOptions = {};
    public chartEvolucionVentasFecha: ApexOptions = {};
    public chartTopDiezMarcas: ApexOptions = {};

    public disabledBuscar: boolean = Flags.False;

    public _unsubscribeAll: Subject<any> = new Subject<any>();
    public filtroAnalisisVentasForm: UntypedFormGroup;
    public colaboradoresActivos: ObtenerColaboradoresActivosDTO[];
    public reporteResumenDataSource: ReporteResumenDTO;
 
    public skeleton: boolean = Flags.False;
    public minDate: Date = this._toolService.getMinDateFIlter();
    public maxDate: Date = this._toolService.getMaxDateFIlter();

    public imgNoDataHome: string = ImagenesUrl.noDataHome;
    public textoResultado: string = DictionaryInfo.NoDataResult;

    public rangoFecha: string[];
    public filtroRangoFecha: string = "";
    public fechaInicio: Date;
    public fechaFin: Date;
    @ViewChild("chart") chart: ChartComponent;
    public chartOptions: Partial<ApexOptions>;
    constructor(
        private _securityService: SecurityService,
        private _formBuilder: UntypedFormBuilder,
        private _toolService: ToolService,
        private _detalleVentaService: DetalleVentaService,
        private _usuarioService: UsuarioService
    ) { }

    ngOnInit(): void {
        this.formFiltros();
        this.showSkeleton();
        this.getColaboradoresActivos();
        this.getResumen(Flags.False);
    }

    formFiltros() {
        this.filtroAnalisisVentasForm = this._formBuilder.group({
            fechaInicio: [this._toolService.getStartDateOfMonth(), [Validators.required]],
            fechaFin: [this._toolService.getEndDateOfMonth(), [Validators.required]],
        });
        this.currencyNumberFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);
    }

    getResumen(hideFilter: boolean) {
        this.showSkeleton();
        const request = this.obtenerRequest();
        this.disabledBuscar = Flags.True;
        this._detalleVentaService.GetResumenReporteAsync(request).subscribe((response: ReporteResumenDTO) => {
            this.reporteResumenDataSource = response;
            this.disabledBuscar = Flags.False;
            this.getFechaFiltroCadena();
            this.generateCharts();
            this.generarChartEvolucionFecha();
            if (hideFilter) {
                this.closedDrawer();
            }
            this.hideSkeleton();
        }, err => {
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            this.disabledBuscar = Flags.False;
            console.log(err);
            if (hideFilter) {
                this.closedDrawer();
            }
        });
    }

        getColaboradoresActivos() {
        const request = new ObtenerColaboradoresRequest();

        request.idUsuario = this.decodeToken.idUsuario;
        request.destinationTimeZoneId = this._toolService.getTimeZone();

        this.disabledBuscar = Flags.True;
        this._usuarioService.GetAllActivesAsync(request).subscribe(
            (response: ObtenerColaboradoresActivosDTO[]) => {
                this.colaboradoresActivos = response;
            },
            (err) => {
                this._toolService.showError(
                    DictionaryErrors.Transaction,
                    DictionaryErrors.Tittle
                );
                this.disabledBuscar = Flags.False;
                console.log(err);
            }
        );
    }

    generateCharts() {
        this.rangoFecha = this.getRangeDate();

        this.generarChartTopDiezMarcas();
        this.generarChartTopDiezProductos();
    }

    getRangeDate(): string[] {
        return this.reporteResumenDataSource.evolucionVentasFecha.fechaVenta.map(fecha => this._toolService.formatoFecha(fecha));
    }

    generarChartEvolucionFecha() {
        const currencyFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);

        this.chartEvolucionVentasFecha = {
            series: [
                {
                    color: "#056DB6",
                    name: "Total",
                    data: this.reporteResumenDataSource.evolucionVentasFecha.totalVenta
                }
            ],
            noData: {
                text: 'Seleccione una categoría',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#000000',
                    fontSize: '14px'
                }
            },
            chart: {
                animations: {
                    enabled: false
                },
                height: 350,
                type: "line",
                zoom: {
                    enabled: false
                },
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
                textAnchor: "start",
                formatter: function (val: number) {
                    return currencyFormat.format(val);
                },
                offsetX: 0,
                dropShadow: {
                    enabled: true
                }
            },
            stroke: {
                show: true,
                width: 2,
                colors: ["transparent"]
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: (val: number) => {
                        return currencyFormat.format(val);
                    },
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
            xaxis: {
                categories: this.rangoFecha,
                labels: {
                    show: true,
                    style: {
                        fontSize: "12px",
                    },
                    formatter: function (val: any) {
                        if (typeof val === 'number') {
                            return currencyFormat.format(val);
                        }
                        return val;
                    },
                    rotateAlways: true,
                    rotate: -45
                },

            },
            fill: {
                opacity: 1
            },
        };
    }

    generarChartTopDiezProductos() {

        const currencyFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);

        this.chartTopDiezProductos = {
            series: [{
                name: "Total",
                data: this.reporteResumenDataSource.topDiezProductosVentas.totalMontos
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
            colors: this.reporteResumenDataSource.topDiezProductosVentas.colores,
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
                categories: this.reporteResumenDataSource.topDiezProductosVentas.productos,
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

    generarChartTopDiezMarcas() {

        const currencyFormat = this._toolService.getCurrencyNumberFormat(this.monedaInfo.codigoMoneda);

        this.chartTopDiezMarcas = {
            series: [{
                name: "Total",
                data: this.reporteResumenDataSource.topDiezMarcasVentas.totalMontos
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
            colors: this.reporteResumenDataSource.topDiezMarcasVentas.colores,
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
                categories: this.reporteResumenDataSource.topDiezMarcasVentas.marcas,
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


    getAnalisisVentasReporteAsync() {

        // if (this.ventasAnalisisDataSource.distribucionVentasCategoria.totalVentasCategorias.length == Numeracion.Cero && this.ventasAnalisisDataSource.distribucionVentasCategoria.totalVentasCategorias.length == Numeracion.Cero) {
        //     return;
        // }

        // if (this.filtroAnalisisVentasForm.invalid) { return; }

        // const request = this.obtenerRequestReporte();

        // this.isExportingReport = Flags.True
        // this._ventasService.GetAnalisisGastosReporteAsync(request).subscribe((response: any) => {
        //     this.isExportingReport = Flags.False;
        //     if (response) {
        //         const fileURL = window.URL.createObjectURL(new Blob([response], { type: "application/vnd.ms-excel" }))
        //         const a = document.createElement('a')
        //         a.download = `Analisis_Gastos_${this.getFechaFiltroCadenaReporte()}.xlsx`;
        //         a.href = fileURL
        //         a.click()
        //         a.parentNode?.removeChild(a)
        //     }
        // }, err => {
        //     if (err.status == StatusCode.Forbidden) {
        //         this._toolService.showWarning(DictionaryWarning.ActualizarPlan, DictionaryWarning.Tittle);
        //         this.isExportingReport = Flags.False = Flags.False;
        //         console.log(err);
        //         return;
        //     }
        //     this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
        //     this.isExportingReport = Flags.False
        //     console.log(err);
        // });
    }

    getFechaFiltroCadenaReporte(): string {
        const fechaInicio = this._toolService.formatoFecha(this.fechaInicio)
        const fechafin = this._toolService.formatoFecha(this.fechaFin)

        return `del_${fechaInicio}_hasta_${fechafin}`.trim();
    }

    btnBuscar(hideFilter: boolean) {
        this.showSkeleton();
        if (this.filtroAnalisisVentasForm.invalid) { return; }

        const idUsuario = this.decodeToken.idUsuario;
        const destinationTimeZoneId = this._toolService.getTimeZone();

        const request = this.obtenerRequest();
        request.idUsuario = idUsuario;
        request.destinationTimeZoneId = destinationTimeZoneId;
        request.fechaInicio = this.filtroAnalisisVentasForm.get('fechaInicio').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaInicio').value;
        request.fechaFin = this.filtroAnalisisVentasForm.get('fechaFin').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaFin').value;
        this.fechaInicio = request.fechaInicio;
        this.fechaFin = request.fechaFin;
        this.getFechaFiltroCadena();
     
        this.disabledBuscar = Flags.True;
        this._detalleVentaService.GetResumenReporteAsync(request).subscribe((response: ReporteResumenDTO) => {
            this.reporteResumenDataSource = response;
            this.disabledBuscar = Flags.False;
            this.getFechaFiltroCadena();
            this.generateCharts();
            this.generarChartEvolucionFecha();
            this.hideSkeleton();
            if (hideFilter) {
                this.closedDrawer();
            }
            return;
        }, err => {
            this.disabledBuscar = Flags.False;
            this._toolService.showError(DictionaryErrors.Transaction, DictionaryErrors.Tittle);
            console.log(err);
            this.hideSkeleton();
            if (hideFilter) {
                this.closedDrawer();
            }
            return;
        });
    }

    isMobilSize(): boolean {
        return this._toolService.isMobilSize();
    }

    obtenerRequest(): ObtenerResumenReporteRequest {

        const request = new ObtenerResumenReporteRequest();

        request.destinationTimeZoneId = this._toolService.getTimeZone();

        request.idUsuario = this.decodeToken.idUsuario;
        request.fechaInicio = this.filtroAnalisisVentasForm.get('fechaInicio').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaInicio').value;
        request.fechaFin = this.filtroAnalisisVentasForm.get('fechaFin').value == "" ? null : this.filtroAnalisisVentasForm.get('fechaFin').value;

        this.fechaInicio = request.fechaInicio
        this.fechaFin = request.fechaFin

        return request;
    }

    // obtenerRequestReporte(): ObtenerAnalisisGastosReporteRequest {

    //     // const request = new ObtenerAnalisisGastosReporteRequest();

    //     // request.destinationTimeZoneId = this._toolService.getTimeZone();

    //     // request.idUsuario = this.usuarioLogueado.idUsuario;
    //     // request.fechaGastoInicio = this.filtroAnalisisGastoForm.get('fechaGastoInicio').value == "" ? null : this.filtroAnalisisGastoForm.get('fechaGastoInicio').value;
    //     // request.fechaGastoFin = this.filtroAnalisisGastoForm.get('fechaGastoFin').value == "" ? null : this.filtroAnalisisGastoForm.get('fechaGastoFin').value;
    //     // request.lstCategorias = [];

    //     // this.fechaInicio = request.fechaGastoInicio
    //     // this.fechaFin = request.fechaGastoFin

    //     // if (this.selectCategorias) {
    //     //     const selectCategorias = this.selectCategorias.options.filter(x => x.selected == true && x.value != 0)
    //     //     selectCategorias.forEach(element => {
    //     //         request.lstCategorias?.push(element.value.id);
    //     //     });
    //     // }

    //     // return request;
    // }

    getFechaFiltroCadena() {
        const fechaInicio = this._toolService.formatoFecha(this.fechaInicio)
        const fechafin = this._toolService.formatoFecha(this.fechaFin)

        this.filtroRangoFecha = `del ${fechaInicio} Hasta ${fechafin}`.trim();
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



