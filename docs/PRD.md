# PRD: Sistema de Gestión de Inventario - AI for DEVs

## 1. Objetivo del Proyecto
Desarrollar un sistema de gestión de inventario profesional utilizando NestJS y React. El objetivo es garantizar el control de existencias mediante una arquitectura robusta que aplique generación de documentación con IA, prompt engineering y un stack de testing exhaustivo para asegurar la integridad de los datos.

## 2. Alcance del Sistema

### Backend (NestJS + TypeORM + PostgreSQL)
* **Gestión de Productos:** CRUD con validaciones de negocio y desactivación lógica.
* **Movimientos de Inventario:** Registro transaccional de entradas y salidas.
* **Motor de Stock:** Cálculo dinámico y sistema de alertas.
* **Testing:** Cobertura con pruebas unitarias, PBT (Property Based Testing) y Mutation Testing.

### Frontend (React + Axios + Playwright)
* **Dashboard:** Lista de productos con indicadores de stock en tiempo real.
* **Operaciones:** Formulario de registro de movimientos con validación proactiva.
* **Testing:** Pruebas E2E para flujos críticos de usuario.

## 3. Criterios de Aceptación por Funcionalidad

### 3.1 Gestión de Productos
* **Campos Requeridos:** Nombre, descripción, unidad de medida (unidades, kg, litros), categoría, stock mínimo y estado (activo/inactivo).
* **Desactivación Lógica:** Se debe utilizar `PATCH /products/:id` para cambiar el estado a inactivo.
* **Restricción de Borrado:** El endpoint `DELETE /products/:id` solo debe proceder si el producto **no tiene movimientos asociados** en el historial.

### 3.2 Movimientos de Inventario
* **Atributos:** Tipo (entrada/salida), cantidad (entero positivo), producto, fecha y razón (compra, venta, ajuste, merma, devolución).
* **Transaccionalidad:** El endpoint `POST /movements` debe ejecutar una transacción de base de datos que valide el stock disponible antes de persistir cualquier salida.
* **Validación Crítica:** Una salida no puede ser procesada si la cantidad supera el stock actual disponible.

### 3.3 Consulta de Stock Actual
* **Cálculo:** El stock se determina sumando todas las entradas y restando todas las salidas registradas.
* **API:** El endpoint `GET /products` debe retornar la lista de productos incluyendo el campo calculado `stock_actual`.

### 3.4 Sistema de Alertas (Regla M8)
* **Lógica Inclusiva:** Un producto entra en estado de alerta si `stock_actual <= stock_minimo`.
* **Visualización:** El indicador en el frontend debe ser de color **ROJO** cuando se cumpla esta condición (incluyendo el valor exacto del mínimo).
* **Endpoint:** `GET /inventory/alerts` debe retornar exclusivamente los productos que cumplen esta condición.

### 3.5 Historial de Movimientos
* **Filtros Obligatorios:** Debe permitir la consulta filtrada por producto, tipo (entrada/salida) y rango de fechas (validando que `fechaInicio <= fechaFin`).

## 4. Requisitos de Interfaz (Frontend)
* **Lista de Productos:** Visualización de metadatos, stock calculado y `StockBadge` (Alerta Roja si stock <= mínimo).
* **Registro de Movimiento:** Formulario que valide en tiempo real; en salidas, debe mostrar el stock disponible y bloquear el envío si la cantidad es superior.

## 5. Restricciones Técnicas y Calidad (QA)

### Stack Tecnológico
* **Base de Datos:** PostgreSQL con TypeORM.
* **Backend:** NestJS.
* **Frontend:** React con Axios para consumo de API.

### Estándares de Testing
* **Unitarios:** Jest para lógica de servicios.
* **PBT (Property Based Testing):** `fast-check` para asegurar que el stock nunca sea negativo bajo ninguna combinación de movimientos.
* **Mutation Testing:** `Stryker` para validar la robustez de las pruebas frente a cambios en operadores lógicos (especialmente en la validación de stock y alertas).
* **E2E:** Playwright para validar el flujo completo desde la creación hasta el registro de movimientos y visualización de alertas.