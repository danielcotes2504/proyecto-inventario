# Frontend Architecture, Code Standards & Folder Enforcement

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

------- Ticket 006 Implementation -----------
Actúa como un desarrollador Senior Frontend, Implementa el ticket T-006 @tickets.md (157-167)  Para el @frontend , sigue estrictamente las reglas de @.cursor/rules/frontend.mdc , es necesario implemtar la lista de productos en el frontend, esta será la pantalla principal del sistema, donde debe mostrar el listado de todos los productos activos con su nombre, categoría, unidad de medida, stock actual y un indicador visual (Badge) que seále si el produto está bajo el stock mínimo. Debes crear los servicios de movement.service.ts, inventory.service.ts y product.service.ts. Recuerda llamar a los endpoints mediante el servicio usando react query, y los componentes que vayas a crear requeriran /shadcn 