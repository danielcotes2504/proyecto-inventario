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


--------------- First ticket implementation -----------
# Role: Senior Backend Developer
# Task: T-001 Implementation
/nestjs-best-practices  /terminalskills-skills-typeorm 

I need to initialize the backend following the @docs/architecture/data-model.md and execute Ticket **T-001** @docs/tickets.md 
1. **T-001**: Implement `POST /products`.
   - Create `services/product/` with the Factory pattern.
   - Use a DTO with Zod validation for: name, description, unit (kg, units, etc), category, stock_minimo, and status.
   - Ensure the response returns 201 with the created resource.

**Context Files**: @docs/architecture/data-model.md @docs/architecture/diagram-er.md @.cursor/rules/backend.mdc 

---------------------- Swagger config ------------
# Role: Senior Backend Engineer
# Task: Professional Swagger UI Integration

Please integrate Swagger (OpenAPI) into the NestJS backend. Use **npm** for installations and follow the project's coding standards. /nestjs-best-practices 

------------ Second ticket implementation  --------------
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

---------------------------- Third ticket implementation --------------------
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

----------------------------- Implementation of Ticket 4 ------------------
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