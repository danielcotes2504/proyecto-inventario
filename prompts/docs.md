Actua como un product manager senior. Dado el contexto de un sistema de inventario con backend (NestJS, TypeORM, PostgreSQL, Jest, fast-check, Stryker) y frontend (React y Playwright), genera un PRD con: objetivo, alcance, criterios de aceptación por funcionalidad y restricciones técnicas. Incluye las pantallas de lista de productos y registro de movimiento



Usa el prompt de ejemplo del PDF. Pásale el contexto del negocio (inventario, NestJS, TypeORM, PostgreSQL, Jest, fast-check, Stryker, React, Axios, Playwright) y pidele que defina: objetivo, alcance, criterios de aceptación generales y restricciones

USER CORRECTION & REFINEMENT:



He revisado el PRD inicial y es necesario integrar las siguientes precisiones técnicas para asegurar la consistencia de todo el sistema y cumplir con los estándares de calidad requeridos:



1. CONTRATO DE API (Restricción Obligatoria):

   Debes considerar los siguientes endpoints para los futuros tickets y lógica de backend:

   - GET /products (Debe incluir el stock_actual calculado).

   - PATCH /products/:id (Para desactivación lógica).

   - DELETE /products/:id (Debe validar que no existan movimientos antes de proceder).

   - POST /movements (Debe ejecutar una transacción que valide stock disponible antes de restar).

   - GET /inventory/alerts/low-stock (Debe retornar productos donde stock_actual <= stock_minimo).



2. REGLA DE NEGOCIO CRÍTICA (Mutante M8):

   La lógica de alerta debe ser INCLUSIVA. Si el stock es exactamente igual al stock mínimo, el indicador debe ser ROJO y el producto debe aparecer en la lista de alertas.



3. STACK TÉCNICO:

   Asegúrate de que toda la documentación técnica (Diagramas C4 y ER) considere:

   - DB: PostgreSQL.

   - Backend: NestJS con TypeORM.

   - Frontend: React con Axios.

   - Testing: Jest (Unitarios), fast-check (PBT), Stryker (Mutation) y Playwright (E2E).