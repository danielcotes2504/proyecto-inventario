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

## T-005 — `GET /inventory/alerts/low-stock` y regla M8 inclusiva (US-BE-04)

- **Título:** Endpoint de alertas solo para productos con `stock_actual <= stock_mínimo`.
- **Historia de Usuario Relacionada:** US-BE-04
- **Descripción Técnica:** Implementar `GET /inventory/alerts/low-stock` (antes `/inventory/alerts`) que devuelva **únicamente** productos en alerta por **bajo stock**. Criterio de negocio: **inclusivo** — alerta si `stock_actual <= stock_mínimo` (incluye igualdad estricta con el mínimo). Reutilizar la misma definición de `stock_actual` que en listados. Filtrar en consulta o capa de servicio; la respuesta debe contener la información necesaria para el front (p. ej. id, nombres, `stock_actual`, `stock_mínimo`).
- **Criterios de Aceptación:**
  - [ ] Productos con `stock_actual` **menor** que el mínimo aparecen en el listado.
  - [ ] Productos con `stock_actual` **igual** al mínimo también aparecen (M8 inclusiva).
  - [ ] Productos con `stock_actual` **mayor** que el mínimo **no** aparecen.
  - [ ] Endpoint dedicado bajo el prefijo `/inventory/alerts/…`; no mezclar con listado general salvo reutilizar componentes internos.
  - [ ] Criterio explícitamente alineado con regla M8 del PRD.

---

## T-008 — Detalle de producto `GET /products/:id` (US-BE-01 / US-BE-03)

- **Título:** Obtener un producto por identificador con `stock_actual` calculado.
- **Historia de Usuario Relacionada:** US-BE-01 (lectura de recurso); US-BE-03 (stock coherente con movimientos).
- **Descripción Técnica:** Implementar `GET /products/:id` que devuelva el producto persistido y **`stock_actual`** con la **misma fórmula** que en `GET /products` (suma entradas − suma salidas; sin movimientos ⇒ `0`). Evitar N+1: una consulta con agregado/subconsulta o join equivalente al criterio de T-004. Respuesta **404** si el `id` no existe. Documentar en Swagger (DTO de respuesta alineado al detalle + `stock_actual`).
- **Criterios de Aceptación:**
  - [ ] Producto existente: respuesta 200 con todos los campos persistidos y `stock_actual` correcto frente a movimientos de prueba.
  - [ ] Producto sin movimientos: `stock_actual === 0`.
  - [ ] `id` inválido o desconocido: **404** acorde al estándar del proyecto.
  - [ ] Contrato OpenAPI actualizado (`@ApiOperation`, `@ApiParam`, `@ApiOkResponse`, `@ApiNotFoundResponse`).

---

## T-009 — Actualización parcial de producto `PATCH /products/:id` (US-BE-01)

- **Título:** Editar atributos editables del producto sin reemplazo total del recurso.
- **Historia de Usuario Relacionada:** US-BE-01
- **Descripción Técnica:** Implementar `PATCH /products/:id` con cuerpo **parcial** (solo campos enviados se actualizan). Validar dominio igual que en creación para los campos presentes (unidad, estado, `stock_minimo` ≥ 0, etc., según PRD). No permitir cambiar el `id`. Respuesta con el producto actualizado; **404** si no existe. Opcional: tras actualización, incluir en la respuesta `stock_actual` calculado como en T-008 para coherencia con el front (explicitar en implementación). Documentación Swagger y pruebas de servicio/controlador según el patrón del repo (p. ej. Zod + pipe).
- **Criterios de Aceptación:**
  - [ ] Un solo campo en el body actualiza solo ese campo; resto inalterado en base de datos.
  - [ ] Campos inválidos u omitidos no corrompen datos; errores de validación **400** claros.
  - [ ] Producto inexistente: **404**.
  - [ ] No altera reglas de borrado T-002 ni de movimientos T-003.

---

## T-010 — Listado de movimientos `GET /movements` (US-BE-02)

- **Título:** Consultar historial de movimientos con paginación y orden definido.
- **Historia de Usuario Relacionada:** US-BE-02
- **Descripción Técnica:** Implementar `GET /movements` que devuelva una colección de movimientos. Definir **orden por defecto** (recomendado: `createdAt` descendente o `movement_date` descendente según modelo). Incluir **paginación** (`limit`/`offset` o `page`/`pageSize` — documentar convención). Opcional: filtro por `productId`, por tipo IN/OUT, por rango de fechas (si el alcance lo permite). Respuesta con metadatos de paginación si se usa cursor/page (explicitar en ticket de implementación). Swagger actualizado.
- **Criterios de Aceptación:**
  - [ ] Lista vacía cuando no hay movimientos (200 con colección vacía).
  - [ ] Los ítems incluyen al menos: `id`, `type`, `quantity`, `reason`, `date`, `productId`, `createdAt` (y relación mínima necesaria para el contrato).
  - [ ] Paginación estable y documentada; sin cargar todo el historial en memoria antes de paginar en consultas grandes.
  - [ ] Prueba(s) que cubran paginación o filtro acordado.

---

## T-011 — Detalle de movimiento `GET /movements/:id` (US-BE-02)

- **Título:** Obtener un movimiento por identificador.
- **Historia de Usuario Relacionada:** US-BE-02
- **Descripción Técnica:** Implementar `GET /movements/:id` que devuelva una única fila de movimiento. **404** si no existe. Opcional: incluir datos mínimos del producto enlazado (solo lectura) si el front lo requiere — definir en DTO de respuesta y Swagger.
- **Criterios de Aceptación:**
  - [ ] Movimiento existente: **200** con cuerpo completo según contrato.
  - [ ] UUID inexistente: **404**.
  - [ ] Documentación Swagger (`@ApiParam`, respuestas 200/404).

---

## T-012 — Vista agregada de inventario `GET /inventory` (US-BE-03)

- **Título:** Listado de inventario (posiciones) para la vista global de existencias.
- **Historia de Usuario Relacionada:** US-BE-03
- **Descripción Técnica:** Implementar `GET /inventory` que exponga una colección orientada a **inventario**: por cada producto (o posición), incluir al menos **identificador**, **nombre**, **`stock_actual`** (misma definición que T-004), **`stock_minimo`** y un campo derivado **`low_stock`** (o nombre acordado) booleano tal que sea verdadero **si y solo si** se cumple la regla M8 inclusiva (`stock_actual <= stock_minimo`). Optimizar en base de datos (una consulta agregada / join con la subconsulta de saldos compartida con T-004/T-005 cuando sea posible). Opcional: paginación si el catálogo crece. Swagger actualizado.
- **Criterios de Aceptación:**
  - [ ] Coherencia numérica de `stock_actual` con `GET /products`.
  - [ ] `low_stock` alineado con M8 (inclusivo en el límite).
  - [ ] Sin bucles por producto que repercutan en N+1 sobre movimientos.
  - [ ] Contrato documentado en OpenAPI.

---

## T-013 — Detalle de inventario por producto `GET /inventory/:productId` (US-BE-03 / US-BE-02 lectura)

- **Título:** Consultar inventario de un producto concreto.
- **Historia de Usuario Relacionada:** US-BE-03 (stock y umbrales); US-BE-02 (contexto de historial, solo lectura).
- **Descripción Técnica:** Implementar `GET /inventory/:productId` donde `:productId` es UUID del producto. Respuesta incluye al menos: datos base del producto (o subconjunto acordado), **`stock_actual`**, **`stock_minimo`**, **`low_stock`** (M8 inclusiva). Opcional en el mismo ticket o subsiguiente: resumen de últimos movimientos (p. ej. últimos N) **sin** duplicar la lógica transaccional de T-003 — preferible consulta de lectura acotada o remisión al cliente a `GET /movements?productId=…`. **404** si el producto no existe. **Orden de rutas:** en el controlador de inventario, registrar rutas estáticas (`GET /inventory`, `GET /inventory/alerts/low-stock`, …) **antes** de `@Get(':productId')`; usar **`ParseUUIDPipe`** en `:productId` para evitar que segmentos como `alerts` se interpreten como identificador.
- **Criterios de Aceptación:**
  - [ ] Producto existente: **200** con `stock_actual` correcto.
  - [ ] Producto inexistente: **404**.
  - [ ] `low_stock` coherente con M8.
  - [ ] Swagger con `@ApiParam` para `productId`.

---

## T-006 — Lista de productos: metadatos, stock y `StockBadge` rojo (US-FE-01)

- **Título:** Tablero/lista con indicador de alerta roja según M8.
- **Historia de Usuario Relacionada:** US-FE-01
- **Descripción Técnica:** En la vista de **lista de productos** (dashboard), mostrar metadatos del producto, **stock** (o `stock_actual` recibido) y un componente **StockBadge** (o equivalente) que muestre estado de alerta de color **rojo** cuando se cumpla `stock_actual <= stock_mínimo`, **incluyendo** el caso límite en que el stock es exactamente el mínimo. Consumo vía **Axios** a `GET /products` (y/o `GET /inventory/alerts/low-stock` o `GET /inventory` si el diseño de UI lo usa de forma complementaria) según arquitectura de datos elegida, manteniendo coherencia con el backend. Sin implementar aún otras pantallas no requeridas por este ticket.
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
| T-001, T-002, T-008, T-009 | US-BE-01 |
| T-008 | US-BE-01, US-BE-03 |
| T-003 | US-BE-02 |
| T-010, T-011 | US-BE-02 |
| T-004 | US-BE-03 |
| T-012, T-013 | US-BE-03 (+ lectura US-BE-02 en T-013 opcional) |
| T-005 | US-BE-04 |
| T-006 | US-FE-01 |
| T-007 | US-FE-02 |
