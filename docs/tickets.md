# Tickets de Desarrollo

Artefacto técnico derivado de [user-stories.md](./user-stories.md). Criterios y restricciones alineados al [PRD](./PRD.md).

**Restricciones de negocio (obligatorias en implementación):**

- **Alerta M8:** Inclusiva: `stock_actual <= stock_mínimo`.
- **Salida de stock:** Validación en **backend** (transacción) para no permitir saldos negativos.
- **Borrado de producto:** Debe comprobarse la **no** existencia de movimientos previos; de lo contrario, rechazar.

---

## T-001 — API de creación y validación de producto (US-BE-01)

- **Título:** Implementar `POST` de productos y validación de campos requeridos.
- **Historia de Usuario Relacionada:** US-BE-01
- **Descripción Técnica:** Exponer endpoint de creación de producto (p. ej. `POST /products` según convenio del API) con validación de **nombre, descripción, unidad de medida** (p. ej. unidades, kg, litros), **categoría**, **stock mínimo** (numérico coherente con reglas) y **estado** (activo/inactivo). Persistir en PostgreSQL vía entidad/servicio TypeORM. Respuesta con cuerpo del recurso creado e identificador. No implementar lógica de movimientos en este ticket; enfoque en reglas de entrada y persistencia.
- **Criterios de Aceptación:**
  - [ ] Request con todos los campos requeridos válidos crea el registro y retorna 201 (o el código acordado) con el producto creado.
  - [ ] Request con campos faltantes o fuera de dominio (unidad, estado, etc.) es rechazado con error de validación claro.
  - [ ] `stock_mínimo` (o equivalente en esquema) se almacena para uso posterior en M8 y listados.
  - [ ] Pruebas unitarias de servicio cubren al menos un caso exitoso y un caso de validación fallida.

---

## T-002 — Eliminación de producto condicionada a ausencia de movimientos (US-BE-01)

- **Título:** `DELETE` de producto con comprobación de movimientos en base de datos.
- **Historia de Usuario Relacionada:** US-BE-01
- **Descripción Técnica:** Implementar `DELETE /products/:id` (o ruta equivalente). Antes de borrar, consultar en la capa de datos si existen filas de movimientos vinculadas al `productId`. Si **no** hay movimientos, ejecutar el borrado. Si **hay** al menos un movimiento, no eliminar y responder con error de negocio (p. ej. 409) con mensaje explícito. Transacción acotada a la comprobación + borrado para evitar condiciones de carrera obvias.
- **Criterios de Aceptación:**
  - [ ] Producto sin movimientos: se elimina y la respuesta confirma la operación.
  - [ ] Producto con cualquier movimiento (entrada o salida) previo: no se elimina; error que indica movimientos asociados.
  - [ ] `productId` inexistente manejado según convención del proyecto (404 o equivalente).
  - [ ] Criterio documentado/ probado: integridad referencial o consulta explícita coherente con el modelo de movimientos.

---

## T-003 — `POST` de movimientos: transacción, salidas y piso en cero (US-BE-02)

- **Título:** Registro transaccional de movimientos con validación de stock para salidas.
- **Historia de Usuario Relacionada:** US-BE-02
- **Descripción Técnica:** Implementar `POST /movements` con persistencia de **tipo** (entrada/salida), **cantidad** entera positiva, **producto**, **fecha** y **razón** (compra, venta, ajuste, merma, devolución) según PRD. Envolver en **transacción de base de datos**: para **salida**, calcular o leer el stock actual del producto (vía agregación de movimientos o mecanismo definido) y **rechazar** si `cantidad > stock_disponible`, sin insertar el movimiento y haciendo rollback. Para **entrada**, permitir sin esa restricción. Garantizar que nunca se persista un estado que implique **saldo negativo** tras el movimiento.
- **Criterios de Aceptación:**
  - [ ] Salida con cantidad \> stock actual: 4xx, mensaje de stock insuficiente, sin fila de movimiento persistida, sin cambios parciales.
  - [ ] Salida con cantidad ≤ stock actual: movimiento insertado; saldo no negativo.
  - [ ] Entrada: movimiento insertado con reglas de cantidad positiva; no aplica tope de “stock disponible” como en salida.
  - [ ] Uso explícito de transacción DB en el flujo de salida.
  - [ ] Alineado con requisito: validación de salida de stock en **backend** (no asumir solo el cliente).

---

## T-004 — Cálculo de `stock_actual` en `GET /products` (US-BE-03)

- **Título:** Listado de productos con campo `stock_actual` calculado.
- **Historia de Usuario Relacionada:** US-BE-03
- **Descripción Técnica:** El endpoint `GET /products` debe devolver la colección de productos enriquecida con **stock actual** calculado como **suma de entradas − suma de salidas** (u operación equivalente en SQL/agregado TypeORM) sobre el historial de movimientos por `productId`. Incluir el campo en el DTO de respuesta (nombre acordado: p. ej. `stock_actual`). Optimizar con consulta/agregado para evitar N+1 según criterio del lead.
- **Criterios de Aceptación:**
  - [ ] Cada producto en la respuesta incluye `stock_actual` coherente con la suma de movimientos históricos.
  - [ ] Producto sin movimientos: `stock_actual` es 0 (o el valor acordado con la definición de suma vacía).
  - [ ] Caso manual o automático que cruce varios movimientos y verifique el cálculo.
  - [ ] Documentación breve en contrato de API o swagger del nombre y semántica del campo.

---

## T-005 — `GET /inventory/alerts` y regla M8 inclusiva (US-BE-04)

- **Título:** Endpoint de alertas solo para productos con `stock_actual <= stock_mínimo`.
- **Historia de Usuario Relacionada:** US-BE-04
- **Descripción Técnica:** Implementar `GET /inventory/alerts` que devuelva **únicamente** productos en alerta. Criterio de negocio: **inclusivo** — alerta si `stock_actual <= stock_mínimo` (incluye igualdad estricta con el mínimo). Reutilizar la misma definición de `stock_actual` que en listados. Filtrar en consulta o capa de servicio; la respuesta debe contener la información necesaria para el front (p. ej. id, nombres, `stock_actual`, `stock_mínimo`).
- **Criterios de Aceptación:**
  - [ ] Productos con `stock_actual` **menor** que el mínimo aparecen en el listado.
  - [ ] Productos con `stock_actual` **igual** al mínimo también aparecen (M8 inclusiva).
  - [ ] Productos con `stock_actual` **mayor** que el mínimo **no** aparecen.
  - [ ] Endpoint dedicado; no mezclar con listado general salvo reutilizar componentes internos.
  - [ ] Criterio explícitamente alineado con regla M8 del PRD.

---

## T-006 — Lista de productos: metadatos, stock y `StockBadge` rojo (US-FE-01)

- **Título:** Tablero/lista con indicador de alerta roja según M8.
- **Historia de Usuario Relacionada:** US-FE-01
- **Descripción Técnica:** En la vista de **lista de productos** (dashboard), mostrar metadatos del producto, **stock** (o `stock_actual` recibido) y un componente **StockBadge** (o equivalente) que muestre estado de alerta de color **rojo** cuando se cumpla `stock_actual <= stock_mínimo`, **incluyendo** el caso límite en que el stock es exactamente el mínimo. Consumo vía **Axios** a `GET /products` (y/o `GET /inventory/alerts` si el diseño de UI lo usa de forma complementaria) según arquitectura de datos elegida, manteniendo coherencia con el backend. Sin implementar aún otras pantallas no requeridas por este ticket.
- **Criterios de Aceptación:**
  - [ ] Cada fila o tarjeta refleja stock y umbral mínimo necesarios para evaluar M8.
  - [ ] El indicador es **rojo** cuando `stock_actual <= stock_mínimo` (inclusivo).
  - [ ] No se muestra alerta roja por M8 cuando el stock es estrictamente mayor al mínimo.
  - [ ] Datos alineados con la API (mismo criterio que T-004/T-005).
  - [ ] Criterio accesible básico (p. ej. no solo color si el stack lo exige en el resto del proyecto; acorde a estándar del repo).

---

## T-007 — Formulario de movimientos: validación en tiempo real (US-FE-02)

- **Título:** Formulario de registro de movimientos con validación reactiva y tope de salida.
- **Historia de Usuario Relacionada:** US-FE-02
- **Descripción Técnica:** Implementar el formulario de **registro de movimientos** (tipo, cantidad, producto, fecha, razón) con **validación en tiempo real** al cambiar campos: **cantidad positiva**, atributos obligatorios, y para **salida** mostrar o usar el **stock disponible** y **bloquear** el envío (o deshabilitar submit) si la cantidad \> stock disponible, con mensaje claro. El **envío** debe apoyarse en la API existente; la validación proactiva no sustituye la validación en backend. Usar Axios para componer el payload de `POST /movements` y para obtener `stock`/`GET /products` o recurso acordado para el producto seleccionado.
- **Criterios de Aceptación:**
  - [ ] Al seleccionar salida, el usuario ve el límite (stock disponible) y no puede enviar con cantidad por encima (UI bloqueada o error previo al POST).
  - [ ] Al cambiar tipo, producto o cantidad, se actualizan validaciones y mensajes sin requerir “submit ciego”.
  - [ ] Campos requeridos y formato de la razón/tipo alineados al PRD 3.2.
  - [ ] Intento de envío con datos aún inválidos es impedido o corregido en cliente (recordando que T-003 es la fuente de verdad para no negativos en servidor).

---

## Trazabilidad resumida

| Ticket | Historia |
| ------ | -------- |
| T-001, T-002 | US-BE-01 |
| T-003 | US-BE-02 |
| T-004 | US-BE-03 |
| T-005 | US-BE-04 |
| T-006 | US-FE-01 |
| T-007 | US-FE-02 |
