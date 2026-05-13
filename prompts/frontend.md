# Prompts · Frontend

---

## Frontend Architecture, Code Standards & Folder Enforcement

## 1. Type System & Code Standards
Cursor must strictly follow these TypeScript standards:
- **Use `type`, never `interface`**: All data structures and prop types must use `type`.
- **Do not use enums**: Use literal union types or constant objects with `as const`. 
  *Example:* export const ROLES = { ADMIN: "admin" } as const; 
  type Role = typeof ROLES[keyof typeof ROLES];
- **Zod as Single Source of Truth**: All schemas must be defined with Zod. TypeScript types MUST be inferred using `z.infer<typeof schema>`.
- **Naming Conventions**: 
  - Files and common folders: `kebab-case`.
  - React Components: `PascalCase`.
  - Variables, functions, and instances: `camelCase`.

## 2. API & Data Fetching (TanStack)
- **Library**: ONLY `tanstack/react-query` is allowed for API calls. No raw `fetch` or `axios` inside components.
- **Service Factories**: Services must be created in `services/[entity]/` as factory objects.
  - Files: `[entity].service.ts` and `[entity].types.ts`.
  - *Example:* `export const productService = { get: () => ... };`
- **Mappers**: Mandatory use of mappers to transform API raw data to Zod schemas and vice-versa.

## 3. Logic & Component Boundaries
- **Logic Placement**: NO business logic or complex data transformations inside components.
- **10-Line Rule**: If component logic (hooks, handlers, effects) exceeds 10 lines, it MUST be moved to a custom hook.
- **Forms**: Use `tanstack/form` combined with `zod` for all form handling and validation.

## 4. Feature-Oriented Structure (`app/features/`)
Each folder in `features/` is a self-contained domain module.
- **Strict Isolation**: No feature can import from another feature folder. Use `app/lib/` for shared logic.
- **Sub-feature nesting**: For entities like `user`, use sub-folders (e.g., `overview`, `creation`) to maintain consistency.

## 5. Global Folder Hierarchy & Enforcement
Cursor must enforce this exact structure:

app/
├── components/        # Reusable UI (ui/ folder for stateless visual components)
├── lib/               # Domain-agnostic logic (auth, middleware, common types)
├── services/          # API Service Factories (services/[entity]/[entity].service.ts)
└── features/          # Domain-specific modules
    └── [entity]/
        └── [sub-feature]/
            ├── index.tsx
            ├── hooks/
            ├── types/
            ├── components/
            ├── filters/
            ├── schemas/
            └── mappers/

## 6. Prohibitions
- **NO Barrel Files**: Never generate `index.ts` or `index.tsx` as re-export aggregators.
- **NO Logic in Components**: Keep components as thin and presentational as possible.
- **NO Manual Interfaces**: Use Zod inference for all data-related types.

---

## T-006 · Lista de productos (dashboard)

Actúa como un desarrollador Senior Frontend, Implementa el ticket T-006 @tickets.md (157-167)  Para el @frontend , sigue estrictamente las reglas de @.cursor/rules/frontend.mdc , es necesario implemtar la lista de productos en el frontend, esta será la pantalla principal del sistema, donde debe mostrar el listado de todos los productos activos con su nombre, categoría, unidad de medida, stock actual y un indicador visual (Badge) que seále si el produto está bajo el stock mínimo. Debes crear los servicios de movement.service.ts, inventory.service.ts y product.service.ts. Recuerda llamar a los endpoints mediante el servicio usando react query, y los componentes que vayas a crear requeriran /shadcn 


---

## T-007 · Formulario de movimientos

Actua como un desarrolladro Senior Frontend, experto en React. Implementa el ticket T007 @tickets.md (171-180) para el @frontend, es necesario implementar un formulario para registrar una entrada o salida de stock. Es necesario que para ello hagas uso de tanstac form, un esquema de zod para validar el formulario en el cliente, el formulario debe desplegarse en un Dialog, para ello puedes usar shadcn, una vez hecho el post, la respuesta de la API si es exitosa debe ser desplegada en un toast, o si no, en un toast con variant de error debe ser desplegado /shadcn . El botón que permite registrar una entrada debe encontrarse en la ruta principal por encima de la tabla 

---

## Flujo · Actualizar reglas Cursor y estructura del `frontend/` (secuencia posterior a T-007)

### Paso A — Cursor Rules (nueva arquitectura)

# Role: Senior Frontend Architect
# Task: ARCHITECTURE UPDATE - MANDATORY STRUCTURE

Please update the frontend development rules  @.cursor/rules/frontend.mdc to follow this EXACT structure. All previous rules about feature-based services are now DEPRECATED.

## 1. Mandatory Folder & File Map
The project MUST adhere to this organization without exceptions:

└── src
    ├── pages/
    │   ├── ProductList.tsx
    │   └── MovementForm.tsx
    ├── components/
    │   ├── ProductCard.tsx
    │   ├── StockBadge.tsx
    │   └── MovementForm.tsx    <-- (UI component)
    ├── services/
    │   └── api.ts             <-- (Single source for TanStack Query & Axios)
    └── e2e/ (Playwright)
        ├── product-list.spec.ts
        └── movement-form.spec.ts

## 2. Component & Logic Rules
- **src/services/api.ts**: This is the ONLY file for data fetching. Centralize all useQuery and useMutation hooks here.
- **src/components/**: Put the specific components mentioned above here.
- **src/pages/**: Use these files only for page composition and routing logic.
- **Naming**: Maintain the exact names provided in the map (PascalCase for components/pages, kebab-case for tests).

## 3. Implementation Policy
- When a ticket (like T-006 or T-007) asks to "create a component", ensure it lands in `src/components/`.
- If a "page" is required, it must be in `src/pages/`.
- NO nested folders inside these directories unless I explicitly ask for it.

**Confirm that you have indexed this new map and are ready to implement T-006 following these paths.**

### Paso B — Alinear el código con las reglas

Por favor, con base a las nuevas cursor rules añadidas en el frontend, actualiza la estructura del @frontend/ @.cursor/rules/frontend.mdc


---

## Code Review · `MovementForm.tsx`

### Prompt

Actúa como un senior developer revisando este código @../frontend/src/components/MovementForm.tsx. Identifica problemas de mantenibilidad, manejo de errores, lógica incorrecta y oportunidades de refactoring. Se específico y muestra como corregir cada problema encontrado.

### Problemas identificados y resultado

**1. Unidad hardcodeada "unidades" para todos los productos (Media — lógica incorrecta)**
El hint de stock disponible mostraba siempre "X unidades" independientemente de si el producto era KG o LITROS.

→ Añadido `PRODUCT_UNIT_LABELS` en `api.ts`. El componente ahora busca el `product` completo (no solo `stock_actual`) y usa `PRODUCT_UNIT_LABELS[product.unit]` para mostrar la unidad correcta.

**2. `Reflect.get` innecesario en `firstFieldError` (Baja)**
`'message' in first` ya estrecha el tipo suficiente. `Reflect.get` añade indirección sin beneficio.

→ Reemplazado por `(first as { message: unknown }).message`.

**3. `safeParse` ejecutado dos veces en submit (Baja)**
`validators.onSubmit` y el cuerpo de `onSubmit` llamaban a `schemaRef.current.safeParse` por separado. TanStack Form bloquea `onSubmit` cuando el validator falla, haciendo la segunda llamada redundante.

→ Eliminado `validators.onSubmit`. El `onSubmit` hace un único `safeParse`: si falla, retorna los errores de validación al form; si pasa, llama a la API con el tipo seguro de `parsed.data`.

**4. Mensajes de error HTTP en inglés para 422 y 409 (Media)**
Tras el cambio de `BadRequestException` → `UnprocessableEntityException` en el backend, el mensaje "Insufficient stock for this operation." llegaba en inglés al usuario.

→ Añadido `STATUS_MESSAGES` en `api-error-message.ts` con mensajes localizados para 422 y 409. Se evalúa antes del parsing del body.

### Archivos modificados
- `services/api.ts` — añadido `PRODUCT_UNIT_LABELS`
- `components/MovementForm.tsx` — fix #1 (unidad dinámica) + fix #2 (`Reflect.get`)
- `hooks/use-movement-form.ts` — fix #3 (un solo `safeParse` en submit)
- `lib/api-error-message.ts` — fix #4 (mensajes localizados para 422/409)


---

## Code Review · `ProductCard.tsx`

### Prompt

Actúa como un senior developer revisando este código @../frontend/src/components/ProductCard.tsx. Identifica problemas de mantenibilidad, manejo de errores, lógica incorrecta y oportunidades de refactoring. Se específico y muestra como corregir cada problema encontrado.

### Problemas identificados y resultado

**1. `product.unit` renderiza el valor raw del objeto (Media — lógica incorrecta)**
La columna "Unidad" mostraba "UNIDADES", "KG" o "LITROS" (las claves internas) en lugar de etiquetas legibles.

→ Reemplazado `{product.unit}` por `{PRODUCT_UNIT_LABELS[product.unit]}`, usando el mapa añadido en el review anterior de `MovementForm`.

**2. `aria-label` de `StockBadge` con "unidades" hardcodeado (Baja — accesibilidad)**
`StockBadge` solo recibía números, sin contexto de unidad. El lector de pantalla anunciaba "quedan 10 unidades" aunque el producto fuera KG o LITROS.

→ Añadida prop opcional `unit?: string` (default `'unidades'`) a `StockBadge`. `ProductCard` pasa `unit={PRODUCT_UNIT_LABELS[product.unit]}` para que el `aria-label` sea preciso.

**3. Nombre `ProductCard` no describe lo que renderiza (Baja — naming)**
El componente renderiza un `<TableRow>`, no una tarjeta. El nombre correcto sería `ProductRow`. Sin embargo el mapa de arquitectura del proyecto fija el nombre `ProductCard.tsx`, por lo que no se modificó.

### Archivos modificados
- `components/ProductCard.tsx` — fix #1 (unidad legible) + pasa `unit` a `StockBadge`
- `components/StockBadge.tsx` — fix #2 (prop `unit` en `aria-label`)


---

## E2E Testing · Playwright Suite (Day 10 — Final Phase)

# Role: Senior QA Engineer & Playwright Expert
# Task: E2E Testing Implementation (Day 10 - Final Phase)

Please implement the End-to-End (E2E) testing suite for the frontend using Playwright, following the "Flujo E2E mínimo esperado" and the project architecture.

## 1. Setup Phase
- Install Playwright in the frontend directory: 'npm init playwright@latest'.
- Configure Playwright to point to the development server (default: http://localhost:5173).
- Ensure test files are located in: 'src/e2e/'.

## 2. Test Suite Implementation (src/e2e/inventory.spec.ts)
Implement the following flows in one or more spec files:

### Flow A: Product List & Alerts
- Navigate to the product list.
- Verify that products are loaded (check for visibility of names/prices).
- **M8 Rule Check**: Identify a product where stock <= min_stock and verify that the 'StockBadge' or alert badge is visible and correctly styled (e.g., red/alert state).

### Flow B: Movement Management (The Core Flow)
- Navigate to the movement form.
- **Stock Entry**: Select a product, register an 'IN' movement of 10 units. Verify that after submission, the user is redirected or sees an update where the stock increased.
- **Valid Stock Exit**: Register an 'OUT' movement within available limits. Verify the stock decreases correctly in the list.
- **Invalid Stock Exit (Safety Check)**: Attempt to register an 'OUT' movement that exceeds current stock. Verify that the system stays on the page, the form is NOT submitted, and a clear error message from the backend is displayed to the user.

## 3. Technical Constraints
- Use 'data-testid' selectors if possible, or semantic selectors (role, text).
- Ensure the tests wait for network idleness or specific elements to avoid flakiness.
- Architecture: Follow the file map:
  - src/e2e/product-list.spec.ts
  - src/e2e/movement-form.spec.ts

**Please start by installing Playwright and then generate the test scripts.**
