# Modelo de datos (TypeORM + PostgreSQL)

Documento alineado con [PRD](../PRD.md) (secciones 3.1–3.4) y con los tickets T-001 a T-005, [tickets.md](../tickets.md).

## Principio: `stock_actual` no se persiste

**`stock_actual` no es columna** de `Product` ni de ninguna tabla de saldos. Se obtiene en **lógica de consulta o agregación** sobre `Movement` (suma de entradas \− suma de salidas) según [PRD 3.3](../PRD.md#33-consulta-de-stock-actual). Lo mismo aplica a la **regla M8** (`stock_actual <= stock_minimo`, inclusivo): se evalúa al consultar, no almacenada como flag.

---

## Enums (dominio)

| Nombre (TypeScript) | Valores | Uso |
| --------------------- | ------- | --- |
| `ProductUnit` | p. ej. `UNIDADES`, `KG`, `LITROS` (alinear con unidades, kg, litros del PRD) | `Product.unit` |
| `ProductStatus` | p. ej. `ACTIVO`, `INACTIVO` | `Product.status` (desactivación lógica vía `PATCH`, no en este documento) |
| `MovementType` | `IN`, `OUT` | Alineado a entrada / salida del PRD |
| `MovementReason` | `COMPRA`, `VENTA`, `AJUSTE`, `MERMA`, `DEVOLUCION` | [PRD 3.2](../PRD.md#32-movimientos-de-inventario) |

---

## Entidad `Product`

| Atributo (propiedad) | Tipo lógico | Notas |
| -------------------- | ----------- | ----- |
| `id` | UUID o entero (PK) | Estrategia de generación acordada en implementación (UUID recomendable para API pública) |
| `name` | string | Requerido |
| `description` | string (text) | Requerido |
| `unit` | `ProductUnit` (enum) | Requerido |
| `category` | string | Requerido |
| `stock_minimo` | number (int o decimal) | Requerido; umbral M8 (comparar con `stock_actual` calculado) |
| `status` | `ProductStatus` (enum) | Requerido |
| `createdAt` | `timestamp` | `@CreateDateColumn()` |
| `updatedAt` | `timestamp` | `@UpdateDateColumn()` |

**Relación:** `@OneToMany(() => Movement, (movement) => movement.product, { … })` hacia `Movement` (cascade según criterio del equipo: normalmente *no* `cascade: true` en remove para no borrar movimientos por accidente; el borrado de producto se gobierna con [T-002](#integridad-referencial-y-ticket-t-002)).

---

## Entidad `Movement`

| Atributo (propiedad) | Tipo lógico | Notas |
| -------------------- | ----------- | ----- |
| `id` | UUID o entero (PK) | Misma convención que `Product` |
| `type` | `MovementType` (`IN` / `OUT`) | Requerido |
| `quantity` | entero positivo | \> 0; validación en servicio (PRD) |
| `reason` | `MovementReason` | compra, venta, ajuste, merma, devolución |
| `date` | `date` o `timestamptz` | Fecha del movimiento (PRD) |
| `productId` | FK a `Product.id` | Requerido; columna de unión a la entidad `Product` |

**Relación:** `@ManyToOne(() => Product, (product) => product.movements, { nullable: false, onDelete: 'RESTRICT' })` en la FK hacia `Product`.

---

## Código de referencia (definición TypeORM)

> Referencia de forma; ajuste de nombres de tabla, índices y nombres de columnas en DB al estándar del repositorio (p. ej. `snake_case` en base de datos con `@Column({ name: '...' })`).

```typescript
// product.entity.ts (extracto)
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') // o 'increment' según decisión
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ProductUnit })
  unit: ProductUnit;

  @Column()
  category: string;

  @Column({ name: 'stock_minimo' })
  stock_minimo: number;

  @Column({ type: 'enum', enum: ProductStatus })
  status: ProductStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Movement, (movement) => movement.product)
  movements: Movement[];
}
```

```typescript
// movement.entity.ts (extracto)
@Entity('movements')
export class Movement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column('int')
  quantity: number;

  @Column({ type: 'enum', enum: MovementReason })
  reason: MovementReason;

  @Column({ type: 'date' }) // o timestamptz
  date: Date;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.movements, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
```

**Mapeo de nombres:** si en el dominio se expone `stock_minimo` en API y se desea en columna, usar `@Column({ name: 'stock_minimo' })` o propiedad `stock_minimo` en la entidad según guía de estilo del proyecto.

---

## Integridad referencial y ticket T-002 (no borrado si hay movimientos)

Cumplir [T-002](../tickets.md#t-002--eliminación-de-producto-condicionada-a-ausencia-de-movimientos-us-be-01) implica doble defensa, coherente con “integridad referencial o consulta explícita”:

1. **A nivel de base de datos (recomendado):** la FK `movements.product_id` → `products.id` con **`ON DELETE RESTRICT`** (equivalente en TypeORM: `onDelete: 'RESTRICT'` en el lado `Movement`). Mientras exista al menos un movimiento, **PostgreSQL impide** eliminar el producto; evita estados huérfanos.
2. **A nivel de aplicación (requisito T-002):** el caso de uso `DELETE /products/:id` debe, antes o mediante la excepción de integridad, **rechazar** con error de negocio (p. ej. 409) y mensaje claro si hay movimientos. Un patrón es: comprobar con `COUNT(*)` o `EXISTS` sobre `movements` para `productId` y abortar; si se confía solo en `RESTRICT`, mapear el error de DB a 409. La **consulta explícita** satisface el ticket; **RESTRICT** refuerza la regla aunque otra vía intente un borrado.

**Resumen:** la relación **1:N** (un producto, muchos movimientos) materializada por `productId` y la restricción de borrado aseguran que un producto con historial no se elimine sin romper trazabilidad, alineado al PRD 3.1 y T-002.

---

## Relaciones (resumen)

| Desde     | Hacia     | Cardinalidad | Decoradores |
| --------- | --------- | ------------ | ----------- |
| `Product` | `Movement` | 1 : N        | `Product`: `@OneToMany`; `Movement`: `@ManyToOne` con `@JoinColumn` en `product_id` |

---

## Véase también

- [Diagrama ER](./diagram-er.md)
- [Diagrama C4 — contenedores](./diagram-c4.md) (cálculo de `stock_actual` y regla M8 en el sistema contenedor)
