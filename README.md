# Sistema de Gestión de Inventario

## Aplicaciones Desplegadas

| Servicio | URL |
|---|---|
| Aplicación React | https://proyecto-inventarion-dcotes.netlify.app/ |
| Swagger API | https://proyecto-inventario-mo6a.onrender.com/docs |

---

## Descripción General

Sistema de gestión de inventario full-stack construido con NestJS y React. Proporciona control de stock en tiempo real, registro transaccional de movimientos, alertas de stock mínimo y una estrategia de testing exhaustiva (unitario, basado en propiedades, mutación y E2E).

---

## Stack Tecnológico

### Backend
- **NestJS** — API REST modular
- **TypeORM** — capa de acceso a datos
- **PostgreSQL** — base de datos relacional
- **Zod** — validación de esquemas
- **Swagger** — documentación de API autogenerada
- **Jest + fast-check + Stryker** — testing unitario, PBT y mutación

### Frontend
- **React 19** con **TanStack Router** y **TanStack Query**
- **TanStack Form** — estado y validación de formularios
- **Axios** — cliente HTTP
- **Tailwind CSS** + **shadcn/ui** — estilos y componentes
- **Zod** — validación de esquemas
- **Playwright** — testing E2E

---

## Funcionalidades

- **Gestión de productos** — CRUD con desactivación lógica; eliminación bloqueada si el producto tiene movimientos asociados
- **Movimientos de inventario** — registro transaccional de entradas y salidas con validación de stock (salidas rechazadas si la cantidad supera el stock disponible)
- **Cálculo de stock en tiempo real** — derivado de la suma de todas las entradas menos las salidas
- **Alertas de stock mínimo** — productos donde `stock_actual <= stock_minimo` expuestos en `/inventory/alerts/low-stock` y resaltados en rojo en la interfaz
- **Historial de movimientos** — filtrable por producto, tipo (entrada/salida) y rango de fechas

---

## Estructura del Proyecto

```
proyecto-inventario/
├── backend/                  # API NestJS
│   └── src/
│       ├── products/         # Dominio de productos (CRUD, entidades, DTOs)
│       ├── movements/        # Dominio de movimientos (CRUD transaccional)
│       ├── inventory/        # Transversal: resúmenes de stock, alertas
│       ├── common/           # Pipes y guards compartidos
│       └── database/         # Bootstrap de TypeORM y migraciones
└── frontend/                 # Aplicación React
    └── src/
        ├── pages/            # Componentes a nivel de ruta
        ├── components/       # UI presentacional y de funcionalidad
        └── services/
            └── api.ts        # Configuración de Axios + todos los hooks de TanStack Query
```

---

## Inicio Rápido

### Requisitos Previos

- Node.js 20+
- PostgreSQL
- npm

### Backend

```bash
cd backend
cp .env.example .env   # configurar DATABASE_URL y otras variables
npm install
npm run start:dev
```

API disponible en `http://localhost:3000`.  
Documentación Swagger en `http://localhost:3000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación disponible en `http://localhost:5173`.

### Migraciones de Base de Datos

```bash
cd backend
npm run migration:run
```

---

## Testing

### Backend

```bash
cd backend
npm run test          # pruebas unitarias (Jest)
npm run test:e2e      # pruebas de integración
npx stryker run       # mutation testing (Stryker)
```

### Frontend

```bash
cd frontend
npm run test          # pruebas unitarias (Vitest)
npm run test:e2e      # pruebas E2E (Playwright)
```

---

## Referencia de API

Documentación interactiva completa disponible en la URL de Swagger desplegada. Endpoints principales:

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/products` | Listar productos con stock calculado |
| POST | `/products` | Crear producto |
| PATCH | `/products/:id` | Actualizar / desactivar producto |
| DELETE | `/products/:id` | Eliminar (bloqueado si tiene movimientos) |
| POST | `/movements` | Registrar entrada o salida (transaccional) |
| GET | `/movements` | Listar movimientos (filtrar por producto, tipo, fecha) |
| GET | `/inventory/alerts/low-stock` | Productos en o por debajo del stock mínimo |

---

## Licencia

Sin licencia — proyecto académico privado.
