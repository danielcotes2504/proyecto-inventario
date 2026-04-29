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


--------------- Creation of the first ticket -----------
# Role: Senior Backend Developer
# Task: T-001 Implementation
/nestjs-best-practices  /terminalskills-skills-typeorm 

I need to initialize the backend following the @docs/architecture/data-model.md and execute Ticket **T-001** @docs/tickets.md 
1. **T-001**: Implement `POST /products`.
   - Create `services/product/` with the Factory pattern.
   - Use a DTO with Zod validation for: name, description, unit (kg, units, etc), category, stock_minimo, and status.
   - Ensure the response returns 201 with the created resource.

**Context Files**: @docs/architecture/data-model.md @docs/architecture/diagram-er.md @.cursor/rules/backend.mdc 

---------------------- Configuración de Swagger ------------
# Role: Senior Backend Engineer
# Task: Professional Swagger UI Integration

Please integrate Swagger (OpenAPI) into the NestJS backend. Use **npm** for installations and follow the project's coding standards. /nestjs-best-practices 
