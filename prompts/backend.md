# Prompts · Backend

---

## Database setup & migración inicial (`InitialSchema`)

# Role: Senior Backend Engineer & DevOps
# Task: Database Setup and Initial Migration

Please perform the following steps to initialize the database layer using `@data-model.md`, `@diagram-c4.md`, and `@diagram-er.md` as the source of truth.

## 1. Infrastructure Setup
- Create a `docker-compose.yml` in the backend root using `postgres:15-alpine`.
- Configure environment variables in a `.env` file (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
- Ensure the `AppModule` is configured to use `@nestjs/typeorm` with these environment variables.

## 2. Entity Generation
- Generate TypeORM entities for `Product` and `Movement` based on the ER diagram.
- **Constraints**: 
    - Use `type` for any supporting data structures (no interfaces).
    - Use literal unions or `as const` objects instead of Enums.
    - Use UUIDs for primary keys.
    - Implement the 1:N relationship between Product and Movement.
    - Add indices to `product.name` and `movement.createdAt`.

## 3. Database Migration
- Configure the TypeORM DataSource for CLI usage.
- Generate a fresh migration file named `InitialSchema` that contains the `CREATE TABLE` statements for all entities defined in the data model.
- **Requirement**: The migration must be empty of data; only schema structure.

## 4. Execution
- Provide the exact terminal commands to:
    1. Start the Docker container.
    2. Run the migration to initialize the PostgreSQL schema.

Follow the project naming conventions (kebab-case for files) and coding standards defined in the rules.


---

## T-001 · POST /products

# Role: Senior Backend Developer
# Task: T-001 Implementation
/nestjs-best-practices  /terminalskills-skills-typeorm 

I need to initialize the backend following the @docs/architecture/data-model.md and execute Ticket **T-001** @docs/tickets.md 
1. **T-001**: Implement `POST /products`.
   - Create `services/product/` with the Factory pattern.
   - Use a DTO with Zod validation for: name, description, unit (kg, units, etc), category, stock_minimo, and status.
   - Ensure the response returns 201 with the created resource.

**Context Files**: @docs/architecture/data-model.md @docs/architecture/diagram-er.md @.cursor/rules/backend.mdc 


---

## Swagger UI

# Role: Senior Backend Engineer
# Task: Professional Swagger UI Integration

Please integrate Swagger (OpenAPI) into the NestJS backend. Use **npm** for installations and follow the project's coding standards. /nestjs-best-practices 


---

## T-002 · DELETE /products/:id (borrado condicional)

# Role: Senior Backend Engineer
# Task: Implementation of Ticket T-002 (Conditional Product Deletion) @.cursor/skills/backend/nestjs-best-practices/SKILL.md 

Please implement the product deletion logic following the requirements in T-002 and the project standards.

## 1. Objective
Implement the `DELETE /products/:id` endpoint with a safety check for associated movements.

## 2. Technical Requirements
- Endpoint: DELETE /products/:id
- Business Logic:
  1. Check if the product exists. If not, return 404.
  2. Query the 'movements' table/collection for any records linked to this productId.
  3. IF movements exist: Reject the deletion and return a 409 Conflict error with the message: "Cannot delete product: associated movements found."
  4. IF no movements exist: Proceed to delete the product record.
- Atomicity: Wrap the check and the deletion in a database Transaction to prevent race conditions.

## 3. Documentation (Swagger)
- Update the controller with Swagger decorators:
  - @ApiOperation: "Delete a product only if it has no movements"
  - @ApiResponse 200: "Product deleted successfully"
  - @ApiResponse 404: "Product not found"
  - @ApiResponse 409: "Conflict: Product has associated movements"


**Please provide the updated code for the Service and Controller, and any necessary changes to the Product module.**

Context files: @docs/tickets.md @docs/user-stories.md 


---

## T-003 · POST /movements (stock transaccional)

# Role: Senior Backend Engineer
# Task: Implementation of Ticket T-003 (Transactional Stock Movements)
/nestjs-best-practices 

Please implement the movement registration logic following the business requirements in T-003. @docs/tickets.md 

## 1. Objective
Implement the `POST /movements` endpoint with strict stock validation for outgoing items and full database transaction support.

## 2. Business Logic & Constraints
- **Endpoint**: POST /movements
- **Payload**: type (IN/OUT), quantity (positive integer), productId, reason (purchase, sale, adjustment, waste, return), and date.
- **Transactional Flow**:
  1. Start a database transaction.
  2. If type is 'OUT' (Salida):
     - Calculate the current stock of the product (SUM of entries - SUM of exits).
     - Check if `requested_quantity > current_stock`.
     - If true: Rollback transaction and return a 400 or 422 error with the message: "Insufficient stock for this operation."
  3. If type is 'IN' (Entrada) or 'OUT' with sufficient stock:
     - Persist the movement record.
     - Commit the transaction.
- **Safety**: Ensure that no state involving a negative balance is ever persisted. Validation MUST happen in the backend.

## 3. Documentation (Swagger)
- Update the controller with Swagger decorators:
  - @ApiOperation: "Register a new stock movement (IN/OUT) with transactional validation"
  - @ApiResponse 201: "Movement registered successfully"
  - @ApiResponse 400: "Invalid input or insufficient stock"
  - @ApiResponse 404: "Product not found"

## 4. Technical Details
- Ensure the logic is encapsulated within the Service layer.
- Use the TypeORM `DataSource` or `EntityManager` to handle the transaction explicitly.
- Use the existing entities and DTO patterns established in previous tickets.

**Please provide the implementation for the Movement service, controller, and any updates to the DTOs.**
context files: @docs/user-stories.md @.cursor/rules/backend.mdc 


---

## T-004 · GET /products (`stock_actual`)

# Role: Senior Backend Engineer
/nestjs-best-practices 
# Task: Implementation of Ticket T-004 (Calculated stock_actual in Product List) @docs/tickets.md 

Please implement the logic to include the real-time calculated stock in the product listing, following the requirements of T-004.

## 1. Objective
Update the `GET /products` endpoint so that each product in the collection includes a `stock_actual` field, calculated from its movement history.

## 2. Technical Requirements & Logic
- **Calculation**: stock_actual = (SUM of 'IN' movements) - (SUM of 'OUT' movements).
- **Zero Case**: If a product has no movements, `stock_actual` must return 0.
- **Optimization (Anti N+1)**: 
  - Do NOT fetch movements separately for each product in a loop.
  - Use a TypeORM QueryBuilder with a subquery, a Left Join with grouping, or a dedicated View/Raw SQL to calculate the balance efficiently in a single query.
- **DTO Update**: Ensure the response DTO includes the `stock_actual` field as a number.

## 3. Documentation (Swagger)
- Update the Swagger decorators in the Controller and DTO:
  - @ApiProperty for `stock_actual` describing it as the "Current calculated stock based on movement history".
  - Ensure the example value is consistent with the calculation logic.

## 4. Execution
- Update the Product Service `findAll` method (or equivalent).
- Ensure the logic remains consistent with the existing `Product` entity and `Movement` relationship.

**Please provide the updated code for the Service, the response DTO, and the Controller.**


---

## T-005 · GET /inventory/alerts/low-stock (M8)

# Role: Senior Backend Engineer
# Task: Implementation of Ticket T-005 (M8 Rule - Inventory Alerts Endpoint) @docs/tickets.md 
/nestjs-best-practices 
Please implement the dedicated alerts endpoint following the business logic defined in the PRD and Ticket T-005.

## 1. Objective
Create a specific endpoint `GET /inventory/alerts/low-stock` that returns ONLY products where the current stock is at or below the minimum threshold.

## 2. Business Logic (M8 Rule)
- **Filtering Criterion**: A product must be included if and only if `stock_actual <= stock_minimo`.
- **Inclusivity**: Ensure the logic is inclusive (<=). If stock is exactly equal to the minimum, it IS an alert.
- **Consistency**: Use the same calculation logic for `stock_actual` as implemented in T-004 (SUM of IN - SUM of OUT).

## 3. Technical Requirements
- **Endpoint**: GET /inventory/alerts/low-stock
- **Efficiency**: Filter the results at the database level (using HAVING or a subquery) rather than fetching all products and filtering in memory with JavaScript.
- **Response Payload**: Must include at least: id, name, stock_actual, and stock_minimo.
- **Code Reuse**: If possible, reuse the query logic/helper from T-004 to maintain a single source of truth for stock calculation.

## 4. Documentation (Swagger)
- Update the controller with Swagger decorators:
  - @ApiOperation: "Get products that have reached or dropped below their minimum stock (M8 Rule)"
  - @ApiResponse 200: "List of products in alert status"

**Please provide the implementation for the new endpoint in the Service and Controller.**


---

## T-008

Implement T-008 /nestjs-best-practices @tickets.md (78-91) 


---

## T-009

Implement T-009:
@tickets.md (93-102) /nestjs-best-practices 


---

## T-010

Implement  T-010: @tickets.md (107-116) /nestjs-best-practices 


---

## T-011

Implement  T-011:@tickets.md (121-127)  /nestjs-best-practices 


---

## T-012

Implement T-012: @tickets.md (133-141) /nestjs-best-practices 


---

## T-013

Implement T-013: @tickets.md (144-153)  /nestjs-best-practices 


---

## CORS

Solve the issues in the @backend for the CORS policy

---

## Flujo · Actualizar reglas Cursor y estructura del `backend/` (secuencia posterior a los prompts anteriores)

### Paso A — Cursor Rules (arquitectura modular NestJS)

# Role: Senior Backend Architect
# Task: BACKEND ARCHITECTURE UPDATE - MANDATORY MODULAR STRUCTURE

Please update the backend development rules to follow this EXACT NestJS modular structure. All files must remain within their designated domain folders.

## 1. Mandatory Folder & File Map
The backend MUST adhere to this organization without exceptions:

backend/ (NestJS)
└── src
    ├── products/               # Product Domain
    │   ├── dto/                # Product DTOs (Zod-based)
    │   ├── entities/           # Product Entities (TypeORM)
    │   ├── products.controller.ts
    │   └── products.service.ts
    ├── movements/              # Inventory Movements Domain
    │   ├── dto/
    │   ├── entities/
    │   ├── movements.controller.ts
    │   └── movements.service.ts
    ├── inventory/              # Analytical & Global Inventory Logic
    │   ├── inventory.controller.ts
    │   └── inventory.service.ts
    ├── common/                 # Shared Utilities
    │   ├── pipes/
    │   └── guards/
    └── app.module.ts           # Root Module

## 2. Implementation Rules
- **Domain Isolation**: Product logic goes in `products/`, movement logic goes in `movements/`.
- **Inventory Module**: Use the `inventory/` module specifically for cross-domain features like the Alerts (T-005) or global stock summaries that require data from both products and movements.
- **Naming Convention**: All filenames must be kebab-case (e.g., `products.controller.ts`).
- **DTOs & Entities**: Must stay inside their respective domain folders. DO NOT create a global `entities/` folder at the root of `src`.

## 3. Strict Constraints
- NO "feature" folders outside of this map.
- If a new service is needed, it must be evaluated if it belongs to an existing module or requires a new domain module.
- Maintain the Factory pattern within each service as per previous .cursorrules.

**Confirm that you have indexed this backend map and are ready to proceed with T-004 and T-005 using these specific paths.**

### Paso B — Alinear el código con las reglas

Por favor, con base a las nuevas cursor rules añadidas en el backend, actualiza la estructura del `@backend/`.


---

## Code Review · `products.service.ts` + refactor arquitectónico

### Prompt

Actúa como un senior developer revisando este código @backend/src/products/products.service.ts. Identifica
problemas de mantenibilidad, manejo de errores, lógica incorrecta y oportunidades de refactoring. Se
específico y muestra como corregir cada problema encontrado.

### Problemas identificados y resultado

**1. Violación de arquitectura — cross-domain coupling (Alta)**
`ProductsService` importaba `InventoryProductDetailDto` (dominio `inventory`) y construía la respuesta directamente. El `InventoryController` inyectaba `ProductsService` en lugar de un servicio de su propio dominio.

→ Se creó `inventory/inventory.service.ts` como módulo de orquestación puro (sin entidad). Ahora `InventoryController` inyecta `InventoryService`, que a su vez delega en `ProductsService` para datos y realiza el mapeo al DTO.

**2. `InventoryAlertItem` definida en el dominio equivocado (Alta)**
El tipo vivía en `inventory/types/inventory-alert.item.ts` pero solo lo consumía el factory de products. Acoplamiento invertido.

→ Tipo movido al `product.factory.ts`. Archivo `inventory/types/inventory-alert.item.ts` eliminado.

**3. `low_stock` duplicado en 3 lugares (Media)**
La regla `stock_actual <= stock_minimo` estaba hardcodeada en `products.service.ts`, en `findAllInventoryPositions` y en `findAlertsWithStock` del factory.

→ Consolidada en `inventory.service.ts::getProductDetail`. Las instancias del factory se mantienen locales (la del WHERE clause SQL es inherentemente diferente).

**4. `patchProduct` con 3 round-trips a la BD (Media)**
Flujo original: `findOne` → `save` → `findOneWithStock`. Tres queries para un PATCH.

→ Reemplazado por `repository.update()` + verificación de `affected === 0` para el 404. Reducido a 2 queries.

**5. Dead code en `parseAggregateNumber` (Baja)**
`typeof value === 'string' ? Number(value) : Number(value)` — ambas ramas idénticas.

→ Simplificado a `Number(value)`.

**6. Comentario con referencia a task ID (Baja)**
Comentario `T-013` en `products.service.ts` violaba la regla del proyecto ("no referencias a tareas en el código").

→ Eliminado junto con el método que lo contenía.

### Archivos modificados
- `products/services/product/product.factory.ts` — fixes #2 #4 #5
- `products/products.service.ts` — fixes #1 #2 #6
- `products/products.service.spec.ts` — tests actualizados para `patchProduct` (mock `update` en lugar de `findOne`+`save`); bloque `findInventoryProductDetail` eliminado
- `inventory/inventory.service.ts` — **creado** (fix #1 #3)
- `inventory/inventory.module.ts` — registra `InventoryService`
- `inventory/inventory.controller.ts` — inyecta `InventoryService`
- `inventory/types/inventory-alert.item.ts` — **eliminado** (fix #2)


---

## Code Review · `movements.service.ts`

### Prompt

Actúa como un senior developer revisando este código @backend/src/movements/movements.service.ts. Identifica problemas de mantenibilidad, manejo de errores, lógica incorrecta y oportunidades de refactoring. Se específico y muestra como corregir cada problema encontrado.

### Problemas identificados y resultado

**1. Dead ternary en `getCurrentStock` (Baja)**
`typeof raw === 'string' ? Number(raw) : Number(raw)` — copia exacta del bug de `parseAggregateNumber` del producto factory. Ambas ramas idénticas.

→ Simplificado a `Number(raw)`.

**2. `BadRequestException` para stock insuficiente (Media)**
HTTP 400 es para input malformado. Stock insuficiente es una violación de regla de negocio con payload válido — el código correcto es 422 (`UnprocessableEntity`).

→ `BadRequestException` reemplazado por `UnprocessableEntityException`. Controller actualizado: el `@ApiBadRequestResponse` combinado (Zod + stock) se separó en `@ApiBadRequestResponse` (solo Zod, 400) y `@ApiUnprocessableEntityResponse` (stock insuficiente, 422).

**3. Acceso sin guarda a `movement.product` (Baja/defensivo)**
Si por cualquier razón la relación viene `null` (constraint violado en BD, entorno de test), `product.id` lanza un `TypeError` genérico sin contexto.

→ Añadida guarda explícita que lanza `NotFoundException` con mensaje descriptivo antes del acceso a los campos.

**4. Comentarios con referencia a task IDs (Baja)**
Bloques JSDoc `T-011` y `T-010` en el factory violan la regla del proyecto.

→ Eliminados.

### Archivos modificados
- `movements/services/movement/movement.factory.ts` — fixes #1 #2 #3 #4
- `movements/movements.controller.ts` — fix #2 (Swagger separado: 400 Zod / 422 stock)
- `movements/movements.service.spec.ts` — test actualizado a `UnprocessableEntityException`


---

## Suite de tests unitarios + Property-Based Testing (fast-check)

### Prompt

```
# Role: Senior QA Automation Engineer
# Task: Unit Tests + Property-Based Testing suite for backend services

Implement a comprehensive test suite for the NestJS backend following these requirements:

## 1. Unit Tests — InventoryService
Create `backend/src/inventory/inventory.service.spec.ts` covering:
- `getProductDetail`: boundary case where stock_actual === stock_minimo sets low_stock=true (M8 inclusive rule)
- `getProductDetail`: stock below minimum → low_stock=true
- `getProductDetail`: stock above minimum → low_stock=false
- `getProductDetail`: full DTO mapping (all fields present)
- `getProductDetail`: propagates NotFoundException when product not found
- `getPositions`: delegates entirely to productsService.findInventoryPositions
- `getAlerts`: delegates entirely to productsService.findInventoryAlerts

## 2. Property-Based Testing — fast-check
Install fast-check and add PBT properties to existing specs:

**Property 1 (movements.service.spec.ts):**
Stock balance is always >= 0 when OUT movements are gated by available stock.
- Corollary: all-OUT array starting at balance=0 still stays non-negative.

**Property 2 (inventory.service.spec.ts):**
M8 consistency: the JS low_stock flag and the DB WHERE clause use identical criteria,
so for any arbitrary stock values the sets they produce are always equal.
- Corollary: zero stock is always a low-stock alert for any non-negative minimum.

**Property 3 (movements.service.spec.ts):**
IN movement sum is commutative/order-independent: original, reversed, ascending, and
descending sort all yield the same total.

Use jest mocks for all NestJS dependencies; no real DB.
```

### Resultado

**Instalación**
`fast-check@^4.8.0` añadido como devDependency.

**`inventory/inventory.service.spec.ts` — creado (9 tests)**
- 5 tests unitarios para `getProductDetail` (boundary M8, below, above, full mapping, NotFoundException propagation)
- 2 tests de delegación (`getPositions`, `getAlerts`)
- PBT Property 2: 2_000 runs — verifica que `low_stock` JS y el WHERE SQL producen el mismo conjunto para cualquier par `(stock_actual, stock_minimo)`
- PBT corolario: 10_000 runs — `stock_actual=0` es siempre alerta para cualquier mínimo ≥ 0

**`movements/movements.service.spec.ts` — extendido**
- PBT Property 1: 2_000 runs — balance nunca cae a negativo cuando OUT está gated por stock disponible
- PBT corolario: 1_000 runs — array all-OUT arrancando en 0 mantiene balance ≥ 0
- PBT Property 3: 1_000 runs — suma de entradas IN es idéntica en cualquier orden (original, reversed, sorted asc/desc)

**Resultado final**: 44/44 tests passing.

### Archivos modificados
- `package.json` (backend) — `fast-check` añadido a devDependencies
- `inventory/inventory.service.spec.ts` — **creado** (7 unit tests + 2 PBT)
- `movements/movements.service.spec.ts` — PBT Properties 1 y 3 añadidas al final


---

## Fix · ReferenceError en MovementsService tests

### Prompt

```
# Role: Senior Backend Engineer
# Task: Fix ReferenceError in MovementsService Tests

The test for "OUT exceeds stock" is failing with a ReferenceError.

## Analysis:
- Expected: UnprocessableEntityException
- Received: ReferenceError
- Location: src/movements/movements.service.spec.ts:152:19

## Instructions:
1. Check 'src/movements/movements.service.ts':
   - Ensure 'UnprocessableEntityException' is correctly imported from '@nestjs/common'.
   - Look for any undefined variables or typos in the logic that handles stock validation.
2. Check 'src/movements/movements.service.spec.ts':
   - Ensure 'UnprocessableEntityException' is imported at the top of the test file.
   - Verify that the 'expect(err).toBeInstanceOf(UnprocessableEntityException)' has access to the class definition.
3. Fix the code and ensure 'npm test' passes all 60 tests.

**Please provide the fix for the affected files.**
```

### Resultado

La causa raíz era que el test referenciaba `UnprocessableEntityException` antes de que el código de producción lanzara esa excepción — el factory todavía lanzaba `BadRequestException` (ya corregido en el Code Review anterior de `movements.service.ts`). El spec también importaba `BadRequestException` en lugar de `UnprocessableEntityException`.

→ El import en `movements.service.spec.ts` ya fue actualizado a `UnprocessableEntityException` como parte del code review previo. El error no se reproducía con el estado actual del código; los 60 tests pasaban sin cambios adicionales.

### Archivos modificados
- Ninguno — la corrección ya estaba aplicada desde el code review de `movements.service.ts`.


---

## Stryker · Mutation Testing (Day 9)

# Role: Senior QA Automation Engineer
# Task: Stryker Configuration & Mutation Testing Defense

I am implementing Day 9 of my project: Mutation Testing. I need you to configure Stryker and prepare the test suite to ensure no dangerous mutants survive, especially those defined in my business logic requirements.

## 1. Setup Phase
- Install: @stryker-mutator/core, @stryker-mutator/jest-runner, @stryker-mutator/typescript-checker.
- Configure: Create a 'stryker.config.json' optimized for NestJS. 
  - Mutate only 'src/**/*.service.ts'.
  - Exclude tests, main.ts, and modules.
  - Use 'jest' as the testRunner and 'typescript' as the checker.

## 2. Strategic Test Implementation (Based on Risk Matrix)
I need you to review 'src/products/products.service.ts' and 'src/movements/movements.service.ts' to ensure we have "Mutant Killers" for these specific cases:

- M1 & M2 (Status/Min Stock): Ensure tests check boundaries like stockMinimo = 0 and blocking deactivation if movements > 0.
- M3 (Equality Boundary): Ensure a 'OUT' movement is allowed when quantity EXACTLY equals current stock.
- M4 & M5 (Data Integrity): This is CRITICAL. Write tests that verify the EXACT final stock value after IN/OUT movements to catch '+' changed to '-' or 'type ===' changed to '!=='.
- M6 (Filtering): Ensure filtered results are checked for length and content, not just absence of error.
- M8 (M8 Rule): Create a test where stock_actual === stock_minimo and assert it MUST be included in alerts.

## 3. Execution Rule
- Run 'npx stryker run' after implementing the tests.
- If any mutant from the IDs M1 through M8 survives, analyze the 'reports/mutation/index.html', explain why it survived, and refactor the tests until the Mutation Score for these lines is 100%.

**Please start by installing the dependencies and creating the config file.**
