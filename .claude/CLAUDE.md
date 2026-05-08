# Project: Inventory App — Architecture Rules

## Backend Architecture — mandatory modular structure (NestJS)

> Applies to all files under `backend/`

Follow NestJS best practices (see `/nestjs` command for detailed rules). This section overrides folder layout wherever they differ.

### Mandatory folder & file map

```text
backend/ (NestJS)
└── src
    ├── products/               # Product domain
    │   ├── dto/                # Product DTOs (Zod-based / validated)
    │   ├── entities/           # Product TypeORM entities
    │   ├── products.controller.ts
    │   ├── products.service.ts
    │   └── products.module.ts
    ├── movements/              # Inventory movements domain
    │   ├── dto/
    │   ├── entities/
    │   ├── movements.controller.ts
    │   ├── movements.service.ts
    │   └── movements.module.ts
    ├── inventory/              # Cross-domain / analytical inventory
    │   ├── dto/
    │   ├── inventory.controller.ts
    │   ├── inventory.service.ts
    │   └── inventory.module.ts
    ├── common/                 # Shared utilities only
    │   ├── pipes/
    │   └── guards/
    ├── database/               # Bootstrap only (data-source.ts, migrations/)
    └── app.module.ts
```

**Exception — `src/database/`:** Only for TypeORM bootstrap (not domain logic). Domain entities belong under `products/entities/` and `movements/entities/` — never under a global `src/entities/`.

### Implementation rules

- **Domain isolation:** Product behavior in `products/`; movement CRUD in `movements/`.
- **`inventory/` module:** Cross-domain only — alerts, global stock summaries, views combining product + movement data.
- **Naming:** Filenames `kebab-case.ts` (e.g. `products.controller.ts`, `create-product-api.dto.ts`).
- **DTOs & entities:** Stay inside the owning domain folder. No global `src/entities/`.
- **Services:** Keep the factory pattern inside each domain service.

### Prohibitions

- NO global domain `entities/` at `src/` root.
- NO extra feature trees outside this map (`src/features/`, etc.).
- NO barrel `index.ts` re-export aggregators unless explicitly requested.
- NO domain logic in `movements/` that belongs in `products/` or `inventory/`.

---

## Frontend Architecture — mandatory structure

> Applies to all files under `frontend/`

### Mandatory folder & file map

```text
└── src
    ├── pages/
    │   ├── ProductList.tsx
    │   └── MovementForm.tsx
    ├── components/
    │   ├── ProductCard.tsx
    │   ├── StockBadge.tsx
    │   └── MovementForm.tsx
    ├── services/
    │   └── api.ts               # Single source: Axios + TanStack Query hooks
    └── e2e/                     # Playwright
        ├── product-list.spec.ts
        └── movement-form.spec.ts
```

- **`src/pages/`**: Route-level composition only. No nested folders.
- **`src/components/`**: Presentational/feature UI. No nested folders (except `ui/` from shadcn CLI).
- **`src/services/api.ts`**: The only module for outbound HTTP: Axios config, endpoints, and all `useQuery`/`useMutation` hooks.
- **`src/e2e/`**: Playwright specs, kebab-case filenames.

### Component & logic rules

- **Data fetching:** Import React Query hooks only from `src/services/api.ts`. No `fetch`/Axios directly in pages or components.
- **Business logic:** Keep pages and components thin. Validation/transform pipelines belong in `api.ts`.
- **Forms:** TanStack Form + Zod. Schemas may live in `api.ts`.
- **10-line rule:** If non-trivial UI logic in a component exceeds ~10 lines, extract a hook as a flat file sibling in the same directory.

### Type system & naming

- **Use `type`, never `interface`** for data shapes and props.
- **No TypeScript `enum`**: use literal unions or `as const` objects.
- **Zod** is the single source of truth for validated API/form shapes; infer TS types with `z.infer<typeof schema>`.
- **Naming:** PascalCase for pages/components; camelCase for variables/functions; kebab-case for e2e specs.

### Styling & UI

- Style with **Tailwind CSS**.
- Add UI via **shadcn/ui**: `pnpm dlx shadcn@latest add <component>`. See `/shadcn` command for rules.
- Prefer theme tokens and shared CSS variables over raw colors.

### Prohibitions

- NO barrel files (`index.ts`/`index.tsx` re-export aggregators).
- NO `interface` for API/domain shapes (use Zod + `type`).
- NO server hooks outside `src/services/api.ts`.
- NO `app/features/`, nested feature trees, or per-entity `services/` folders.

---

## Available slash commands

- `/nestjs` — NestJS best practices (40 rules: arch, DI, security, perf, testing, DB, API)
- `/typeorm` — TypeORM entities, QueryBuilder, migrations, best practices
- `/shadcn` — shadcn/ui component management, CLI, composition rules
- `/caveman` — Ultra-compressed communication mode (reduce token usage)
- `/caveman-commit` — Generate terse Conventional Commits messages
