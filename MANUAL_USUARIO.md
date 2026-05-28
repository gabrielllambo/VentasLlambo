# Manual de Usuario — Sistema Don Llambo

**Versión:** 2.0  
**Fecha:** Mayo 2026  
**Plataforma:** Aplicación Web (Angular 17)

---

## Índice

1. [Introducción](#1-introducción)
2. [Acceso al sistema](#2-acceso-al-sistema)
3. [Roles y permisos](#3-roles-y-permisos)
4. [Módulo: Inicio (Dashboard)](#4-módulo-inicio-dashboard)
5. [Módulo: Ventas](#5-módulo-ventas)
6. [Módulo: Compras](#6-módulo-compras)
7. [Módulo: Inventario](#7-módulo-inventario)
8. [Módulo: Clientes](#8-módulo-clientes)
9. [Módulo: Proveedores](#9-módulo-proveedores)
10. [Módulo: Usuarios](#10-módulo-usuarios)
11. [Módulo: Negocio](#11-módulo-negocio)
12. [Módulo: Reportes](#12-módulo-reportes)
13. [Preguntas frecuentes](#13-preguntas-frecuentes)

---

## 1. Introducción

El **Sistema Don Llambo** es una plataforma web de gestión comercial diseñada para carnicerías y negocios de venta de productos cárnicos. Permite administrar ventas, compras, inventario de lotes, clientes, proveedores y generar reportes analíticos.

**Principales capacidades:**
- Registro de ventas con generación automática de comprobantes (boleta/factura) en PDF
- Control de inventario por lotes con seguimiento de fechas de vencimiento
- Registro de compras con sistema FIFO (primero en entrar, primero en salir) para el consumo de stock
- Tomas físicas de inventario
- Gestión de promociones y descuentos
- Reportes analíticos de ventas, compras e inventario
- Devoluciones de productos vencidos

---

## 2. Acceso al sistema

### 2.1 Inicio de sesión

1. Abrir el navegador e ingresar la URL del sistema
2. En la pantalla de inicio de sesión ingresar:
   - **Usuario:** correo electrónico registrado
   - **Contraseña:** contraseña asignada
3. Hacer clic en **Iniciar sesión**

> El sistema redirige automáticamente al **Dashboard de inicio** luego de autenticarse.

### 2.2 Cerrar sesión

- Hacer clic en el icono de perfil (esquina superior derecha)
- Seleccionar **Cerrar sesión**

### 2.3 Interfaz general

La pantalla principal tiene tres zonas:

| Zona | Descripción |
|------|-------------|
| **Barra lateral izquierda** | Menú de navegación con los módulos según el rol |
| **Área central** | Contenido de la página activa |
| **Barra superior** | Nombre del usuario, notificaciones y acceso al perfil |

---

## 3. Roles y permisos

El sistema cuenta con **4 roles** predefinidos. Cada rol tiene acceso únicamente a los módulos que le corresponden.

### 3.1 Tabla de permisos por rol

| Módulo / Función | Administrador | Gerente de Ventas | Vendedor | Encargado de Stock |
|---|:---:|:---:|:---:|:---:|
| **Inicio (Dashboard)** | ✅ | — | — | — |
| **Nueva Venta** | ✅ | ✅ | ✅ | — |
| **Historial de Ventas** | ✅ | ✅ | — | — |
| **Reportes de Ventas** | ✅ | ✅ | — | — |
| **Registro de Compras** | ✅ | — | — | — |
| **Reportes de Compras** | ✅ | — | — | — |
| **Lista de Productos** | ✅ | — | — | ✅ |
| **Lista de Categorías** | ✅ | — | — | ✅ |
| **Lista de Marcas** | ✅ | — | — | ✅ |
| **Lista de Lotes** | ✅ | — | — | — |
| **Toma Física** | ✅ | — | — | ✅ |
| **Promociones** | ✅ | — | — | — |
| **Vencimientos** | ✅ | — | — | — |
| **Lista de Clientes** | ✅ | — | — | — |
| **Lista de Proveedores** | ✅ | — | — | — |
| **Lista de Usuarios** | ✅ | — | — | — |
| **Configuración Negocio** | ✅ | — | — | — |

### 3.2 Descripción de cada rol

#### Administrador del sistema
Acceso total a todas las funciones del sistema. Es el único que puede crear usuarios, configurar el negocio, gestionar proveedores, clientes, lotes, promociones y vencimientos.

#### Gerente de Ventas
Enfocado en el área comercial. Puede registrar ventas, revisar el historial completo y analizar reportes de ventas por categorías, marcas y productos.

#### Vendedor
Perfil de acceso mínimo. Puede únicamente **registrar nuevas ventas**. No tiene acceso a historial ni reportes.

#### Encargado de Stock
Enfocado en el inventario. Puede gestionar productos, categorías, marcas y realizar tomas físicas de inventario.

---

## 4. Módulo: Inicio (Dashboard)

> **Acceso:** Administrador del sistema

El dashboard muestra un resumen ejecutivo del negocio en tiempo real.

### Indicadores principales

| Indicador | Descripción |
|-----------|-------------|
| **Total ventas del día** | Monto total facturado en el día actual |
| **Número de transacciones** | Cantidad de ventas realizadas hoy |
| **Productos en stock bajo** | Productos con poca cantidad disponible |
| **Lotes próximos a vencer** | Lotes con fecha de vencimiento cercana |

### Gráficos disponibles
- Ventas por periodo (barras)
- Distribución de ventas por categoría (dona)
- Tendencia de ingresos

---

## 5. Módulo: Ventas

### 5.1 Nueva Venta

> **Acceso:** Administrador, Gerente de Ventas, Vendedor

**Pasos para registrar una venta:**

1. Ir a **Ventas → Nueva Venta**
2. **(Opcional)** Buscar cliente por cédula o correo en el campo de búsqueda de cliente
3. Seleccionar una categoría de producto usando los botones de categoría, o buscar por nombre/código en el campo de búsqueda
4. Hacer clic sobre el producto deseado para agregarlo al carrito
5. Ajustar la cantidad:
   - **Productos por Unidad (ej. Pollo):** usar los botones **+** y **−**
   - **Productos por Kilogramo (ej. Posta de Res):** ingresar el peso en el campo decimal con etiqueta `kg`
   - **Productos por Libra (ej. Carne Suave):** ingresar el peso en el campo decimal con etiqueta `lb`
6. **(Opcional)** Activar descuento en un producto:
   - Marcar el switch de descuento en la fila del producto
   - Ingresar el porcentaje de descuento (0–100%)
   - Ingresar una observación del descuento (ej. "Promoción de temporada")
7. **(Opcional)** Escribir una nota adicional en el campo de nota
8. **(Opcional)** Seleccionar la fecha de la venta (por defecto es hoy)
9. **(Opcional)** Activar la opción **Enviar comprobante** si el cliente tiene correo registrado
10. Hacer clic en **Registrar Venta**
11. Confirmar en el diálogo de confirmación
12. El sistema abre automáticamente el **comprobante PDF** en una nueva pestaña

> **Nota:** Si un producto tiene una **promoción activa**, el descuento se aplica automáticamente al agregarlo al carrito.

### Información del comprobante PDF
El comprobante incluye: datos del negocio, datos del cliente (si aplica), detalle de productos con cantidad, unidad de medida, precio, descuento (si existe), subtotal, IVA y total.

---

### 5.2 Historial de Ventas

> **Acceso:** Administrador, Gerente de Ventas

Muestra todas las ventas registradas con filtros de búsqueda.

**Filtros disponibles:**
- Rango de fechas (fecha inicio / fecha fin)
- Número de comprobante
- Nombre del cliente

**Acciones por venta:**
- Ver detalle completo de la venta
- Descargar el comprobante PDF nuevamente

---

## 6. Módulo: Compras

> **Acceso:** Administrador del sistema

### 6.1 Registro de Compra

Registra el ingreso de mercadería al inventario. Cada compra crea uno o varios **lotes** con:
- Fecha de vencimiento (opcional)
- Cantidad comprada
- Precio de compra por unidad/kg/lb

**Pasos:**
1. Ir a **Compras → Nueva Compra**
2. Seleccionar el proveedor
3. Ingresar la fecha de la compra
4. Agregar los productos comprados:
   - Seleccionar producto
   - Ingresar cantidad
   - Ingresar precio de compra
   - Ingresar fecha de vencimiento (si aplica)
5. Hacer clic en **Registrar Compra**

> El sistema crea automáticamente un lote por cada producto registrado en la compra.

---

## 7. Módulo: Inventario

### 7.1 Productos

> **Acceso:** Administrador, Encargado de Stock

Lista todos los productos del catálogo con su stock, precio de venta, categoría y marca.

**Acciones disponibles:**
- **Agregar producto:** nombre, código, categoría, marca, precio de venta, foto (opcional)
- **Editar producto:** modificar datos del producto
- **Ver detalle:** información completa con historial de lotes
- **Desactivar producto:** retira el producto del catálogo sin eliminarlo

**Tipos de medida por categoría:**
| Categoría | Medida | Comportamiento en ventas |
|-----------|--------|--------------------------|
| Carne de Pollo | Unidad | Botones +/− (enteros) |
| Carne de Res, Cerdo, Cordero, Vísceras | Libra / Kilogramo | Campo decimal con lb / kg |
| Embutidos, Lácteos, otros | Unidad | Botones +/− (enteros) |

---

### 7.2 Categorías

> **Acceso:** Administrador, Encargado de Stock

Gestiona las categorías de productos (ej. Carne de Res, Carne de Pollo, Embutidos).

**Datos de una categoría:**
- Nombre
- Descripción (opcional)
- Color identificador
- Medida asociada (Unidad, Kilogramo, Libra)

---

### 7.3 Marcas

> **Acceso:** Administrador, Encargado de Stock

Gestiona las marcas de los productos (ej. Pronaca, Don Diego, Plumrose).

---

### 7.4 Lotes

> **Acceso:** Administrador del sistema

Muestra todos los lotes de inventario creados por las compras.

**Información de cada lote:**
| Campo | Descripción |
|-------|-------------|
| Producto | Nombre del producto |
| Proveedor | Proveedor de la compra |
| Cantidad inicial | Unidades compradas |
| Cantidad disponible | Stock restante (se descuenta con cada venta FIFO) |
| Precio de compra | Costo unitario del lote |
| Fecha de vencimiento | Cuándo vence el lote |
| Estado | Activo / Agotado |

> **Sistema FIFO:** Las ventas consumen primero los lotes más antiguos para minimizar pérdidas por vencimiento.

---

### 7.5 Toma Física de Inventario

> **Acceso:** Administrador, Encargado de Stock

Permite registrar el stock real contado físicamente y compararlo con el stock del sistema.

**Pasos:**
1. Ir a **Inventario → Toma Física**
2. Hacer clic en **Nueva Toma Física**
3. Para cada producto, ingresar la cantidad física contada
4. El sistema calcula la diferencia (sobrante / faltante)
5. Si hay diferencia, se puede registrar como **pérdida** con un motivo
6. Confirmar el registro

**Motivos de pérdida comunes:**
- Vencimiento
- Daño / deterioro
- Robo o merma
- Error de conteo

---

### 7.6 Promociones

> **Acceso:** Administrador del sistema

Gestiona descuentos automáticos sobre productos específicos.

**Datos de una promoción:**
- Producto al que aplica
- Porcentaje de descuento (ej. 10%)
- Fecha de inicio y fin de la promoción
- Motivo o descripción

> Cuando un producto con promoción activa se agrega a una venta, el descuento se aplica automáticamente y aparece en el comprobante PDF.

---

### 7.7 Vencimientos

> **Acceso:** Administrador del sistema

Muestra todos los lotes clasificados por su estado de vencimiento.

**Estados de vencimiento:**

| Estado | Condición | Color |
|--------|-----------|-------|
| Vencido | Fecha ya pasó | Rojo |
| Crítico | Vence en ≤ 30 días | Naranja |
| Alerta | Vence en 31–90 días | Amarillo |
| Vigente | Vence en > 90 días | Verde |

**Filtrar por estado:** Hacer clic en la tarjeta del estado deseado (Vencidos, Críticos, Alerta, Vigentes).

**Registrar devolución de lote vencido:**
1. Ubicar el lote en la tabla
2. Hacer clic en el botón de devolución (icono de retorno)
3. En el diálogo ingresar:
   - Cantidad a devolver
   - Motivo (Vencimiento / Defecto / Otro)
   - Observación adicional (opcional)
4. Confirmar — el stock del lote se reduce

---

## 8. Módulo: Clientes

> **Acceso:** Administrador del sistema

Gestiona el registro de clientes para asociarlos a ventas y enviar comprobantes por correo.

**Datos de un cliente:**
- Nombre completo
- Tipo y número de documento (cédula / RUC)
- Correo electrónico
- Teléfono
- Dirección

**Cómo agregar un cliente:**
1. Ir a **Clientes → Lista de Clientes**
2. Hacer clic en **Nuevo Cliente**
3. Completar los datos y guardar

---

## 9. Módulo: Proveedores

> **Acceso:** Administrador del sistema

Registra los proveedores de los productos para asociarlos a las compras.

**Datos de un proveedor:**
- Nombre / razón social
- RUC / cédula
- Teléfono
- Correo electrónico
- Dirección

---

## 10. Módulo: Usuarios

> **Acceso:** Administrador del sistema

Gestiona las cuentas de acceso al sistema.

**Acciones disponibles:**
- **Crear usuario:** nombre, correo, contraseña, rol asignado
- **Editar usuario:** modificar datos o cambiar rol
- **Activar / Desactivar:** suspender el acceso sin eliminar la cuenta

**Roles disponibles para asignar:**
1. Administrador del sistema
2. Gerente de Ventas
3. Vendedor
4. Encargado de Stock

---

## 11. Módulo: Negocio

> **Acceso:** Administrador del sistema

Configura la información general del negocio que aparece en los comprobantes PDF.

**Datos configurables:**
- Nombre del negocio
- RUC
- Dirección
- Teléfono
- Correo electrónico
- Logo del negocio
- Moneda del sistema (USD, etc.)

---

## 12. Módulo: Reportes

### 12.1 Reportes de Ventas

> **Acceso:** Administrador, Gerente de Ventas

#### Por Categorías
Muestra el total vendido agrupado por categoría de producto en un rango de fechas. Incluye gráfico de barras y tabla con montos.

#### Por Marcas
Muestra el total vendido agrupado por marca en un rango de fechas. Útil para identificar qué marcas generan más ingresos.

#### Por Productos
Muestra el ranking de productos más vendidos por cantidad y monto en un rango de fechas.

#### Dashboard de Ganancias
Muestra la ganancia neta (precio de venta – precio de compra) por producto y periodo. Incluye:
- Margen de ganancia por producto
- Comparativo de ingresos vs costos

#### Flujo de Caja
Muestra el movimiento de dinero (entradas por ventas, salidas por compras) en un periodo.

#### Tendencia de Ventas
Gráfico de líneas con la evolución de ventas en el tiempo.

---

### 12.2 Reportes de Compras

> **Acceso:** Administrador del sistema

#### Por Categorías
Total invertido en compras agrupado por categoría.

#### Por Marcas
Total invertido en compras agrupado por marca.

#### Por Productos
Detalle de compras por producto: cantidad comprada, costo total y precio promedio.

---

### 12.3 Centro de Análisis (Inventario)

> **Acceso:** Administrador del sistema

Panel centralizado con múltiples reportes de inventario disponibles en un solo lugar:

| Reporte | Descripción |
|---------|-------------|
| **Stock y Valorización** | Valor monetario del stock actual por producto |
| **Margen de Ganancia** | Rentabilidad por producto (precio venta vs precio compra) |
| **Rotación de Inventario** | Frecuencia con que cada producto se vende (alta/media/baja rotación) |
| **Productos sin Movimiento** | Productos que no han tenido ventas en un periodo |
| **Impacto de Descuentos** | Cuánto se dejó de percibir por descuentos aplicados |
| **Devoluciones** | Historial de devoluciones de lotes registradas |

---

### 12.4 Reporte de Pérdidas

> **Acceso:** Administrador del sistema

Muestra las diferencias registradas en las tomas físicas de inventario:
- Fecha de la toma
- Producto afectado
- Cantidad perdida
- Motivo de la pérdida
- Usuario que registró

---

### 12.5 Reporte de Tomas Físicas

> **Acceso:** Administrador del sistema

Historial completo de todas las tomas físicas realizadas con sus resultados de ajuste de inventario.

---

## 13. Preguntas frecuentes

**¿Qué pasa si me equivoco en una venta?**
El historial de ventas (accesible al Administrador y Gerente) permite ver el detalle. Si necesita anular, contactar al Administrador.

**¿Puedo vender sin seleccionar un cliente?**
Sí. El cliente es opcional. Si no se selecciona, el comprobante se emite como consumidor final.

**¿Cómo sé si un producto está por vencer?**
El módulo **Inventario → Vencimientos** muestra todos los lotes con semáforo de colores. También, en la pantalla de ventas cada producto muestra su fecha de caducidad más próxima con un indicador de color.

**¿Qué es el sistema FIFO?**
Las ventas descuentan primero los lotes más antiguos. Esto asegura que los productos con mayor tiempo de almacenamiento se vendan antes de que venzan.

**¿Cómo registro una devolución de un producto vencido al proveedor?**
Ir a **Inventario → Vencimientos**, ubicar el lote, hacer clic en el botón de devolución e ingresar la cantidad y el motivo.

**¿El descuento aparece en el comprobante?**
Sí. Si se aplica un descuento, el comprobante PDF muestra el precio original tachado, el precio con descuento aplicado y el porcentaje de descuento junto a la observación.

**¿Puedo cambiar el precio de venta al momento de registrar una venta?**
Sí. En la pantalla de nueva venta, el precio de venta de cada producto es editable para esa transacción puntual.

**¿Qué usuario puedo contactar si olvido mi contraseña?**
El **Administrador del sistema** puede resetear contraseñas desde el módulo de Usuarios.

---

*Manual generado para el Sistema Don Llambo v2.0 — Uso interno*
