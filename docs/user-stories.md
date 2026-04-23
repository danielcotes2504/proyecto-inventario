# Historias de Usuario (Gherkin)

Formato: **Dado** / **Cuando** / **Entonces** (y **Y** cuando aplique).  
Referencias al PRD: secciones 3.1–3.5 y regla M8 (alerta de stock mínimo inclusiva).

---

## Backend

### US-BE-01 — Registro y gestión de producto (campos y borrado condicionado)

**Como** Administrador de Inventario  
**Quiero** registrar productos con los datos exigidos y eliminar productos solo cuando no afecte el historial  
**Para** mantener un inventario consistente y trazable.

```gherkin
Escenario: Registro exitoso de producto con campos obligatorios
  Dado que estoy autenticado (si aplica) y tengo acceso a la API de productos
  Cuando envío una solicitud de creación de producto con nombre, descripción, unidad de medida, categoría, stock mínimo y estado activo/inactivo
  Entonces el sistema persiste el producto y responde con el recurso creado incluyendo un identificador
  Y los campos requeridos no admiten vacíos inválidos según las reglas de validación

Escenario: Borrado de producto permitido sin movimientos
  Dado un producto que no tiene movimientos de inventario asociados
  Cuando solicito su eliminación definitiva
  Entonces el sistema elimina el producto y confirma la operación

Escenario: Borrado de producto rechazado con movimientos previos
  Dado un producto con al menos un movimiento (entrada o salida) en el historial
  Cuando solicito su eliminación
  Entonces el sistema no elimina el producto
  Y devuelve un error de negocio indicando la existencia de movimientos previos
```

---

### US-BE-02 — Validación transaccional de salida de stock (sin saldos negativos)

**Como** Sistema  
**Quiero** que cada salida de stock se valide y persista en una transacción de base de datos  
**Para** evitar existencias negativas y estados incoherentes.

```gherkin
Escenario: Salida aceptada cuando la cantidad no supera el stock disponible
  Dado un producto con stock actual suficiente para la operación
  Cuando registro un movimiento de salida cuya cantidad es menor o igual a ese stock
  Entonces el movimiento se persiste
  Y el saldo resultante no es negativo

Escenario: Salida rechazada en backend por exceso de cantidad
  Dado un producto cuyo stock actual es inferior a la cantidad solicitada en salida
  Cuando intento registrar el movimiento de salida
  Entonces el sistema no persiste el movimiento
  Y toda la transacción se revierte sin cambios parciales en la base de datos
  Y responde con error indicando que no hay stock suficiente

Escenario: Entrada de stock no queda sujeta al límite de salida
  Dado un producto (con cualquier saldo, incluso cero)
  Cuando registro un movimiento de entrada con cantidad positiva
  Entonces el movimiento se persiste y actualiza el stock de forma coherente
```

---

### US-BE-03 — Cálculo de stock actual en listado de productos

**Como** Administrador de Inventario  
**Quiero** ver el stock actual de cada producto en la respuesta de listado  
**Para** decidir reabastecimientos o movimientos con información actualizada.

```gherkin
Escenario: Stock actual calculado como entradas menos salidas
  Dado un producto con un conjunto de movimientos de entrada y salida registrados
  Cuando consulto el listado de productos
  Entonces la respuesta incluye para cada producto un campo con el stock actual
  Y ese valor es la suma de entradas menos la suma de salidas de todos los movimientos históricos
  Y el valor reflejado es consistente con el cálculo realizado a nivel de datos
```

---

### US-BE-04 — Alerta de stock mínimo (regla M8, condición inclusiva)

**Como** Administrador de Inventario  
**Quiero** identificar qué productos están en o bajo su stock mínimo  
**Para** reaccionar a tiempo a faltantes.

```gherkin
Escenario: Producto en alerta cuando el stock es igual o inferior al mínimo (M8 inclusiva)
  Dado un producto con stock mínimo definido
  Y su stock actual es estrictamente menor que el mínimo
  Cuando consulto el endpoint de alertas de inventario
  Entonces el producto aparece en el listado de alertas

Escenario: Producto en alerta cuando el stock es exactamente el mínimo
  Dado un producto cuyo stock actual es exactamente igual a su stock mínimo
  Cuando consulto el endpoint de alertas de inventario
  Entonces el producto aparece en el listado de alertas (condición stock_actual <= stock_minimo)

Escenario: Producto fuera de alerta por encima del mínimo
  Dado un producto cuyo stock actual es estrictamente mayor que su stock mínimo
  Cuando consulto el endpoint de alertas de inventario
  Entonces el producto no aparece en ese listado
```

---

## Frontend

### US-FE-01 — Visualización de alertas en la lista de productos

**Como** Administrador de Inventario  
**Quiero** ver de inmediato qué productos están en riesgo por bajo stock  
**Para** priorizar acciones en el tablero.

```gherkin
Escenario: Indicador rojo (StockBadge) con regla M8 en la lista
  Dado que visualizo el tablero o lista de productos con su stock y stock mínimo
  Cuando un producto cumple stock_actual <= stock_mínimo
  Entonces se muestra un indicador de alerta en color rojo (StockBadge) para ese producto
  Y los productos con stock por encima del mínimo no muestran alerta con ese criterio

Escenario: Coherencia con el stock mostrado
  Dado la lista con datos recientes del servicio
  Cuando se actualizan productos o movimientos en backend
  Entonces el stock mostrado y el estado de alerta de la fila se mantienen alineados con el criterio M8
```

---

### US-FE-02 — Validación en tiempo real del formulario de movimientos

**Como** Administrador de Inventario  
**Quiero** feedback inmediato al completar el formulario de movimientos  
**Para** no enviar operaciones inválidas y conocer el límite en salidas.

```gherkin
Escenario: En salida, bloqueo y aviso si la cantidad supera el disponible
  Dado el formulario de registro de movimiento con tipo salida
  Y el stock disponible mostrado o conocido del producto seleccionado
  Cuando ingreso una cantidad mayor que el stock disponible
  Entonces el envío se bloquea o deshabilita
  Y se muestra un mensaje claro (por ejemplo, stock insuficiente) antes de que el request llegue a backend

Escenario: Validación proactiva mientras edito el formulario
  Dado el formulario con tipo, producto, cantidad y demás atributos requeridos
  Cuando cambio cantidad, tipo o producto
  Entonces el estado de validación se actualiza en tiempo real
  Y no puedo finalizar con datos inconsistentes (cantidad no positiva, faltan campos obligatorios, etc., según reglas del PRD)
```

---

| ID        | Tipo   | Tema resumido                                      |
| --------- | ------ | -------------------------------------------------- |
| US-BE-01  | Backend | Registro y borrado de producto (sin borrar si hay movimientos) |
| US-BE-02  | Backend | Salida de stock transaccional y no negativa        |
| US-BE-03  | Backend | `stock_actual` en listado                          |
| US-BE-04  | Backend | `GET` alertas; regla M8 inclusiva                  |
| US-FE-01  | Frontend | Lista: StockBadge rojo (M8)                        |
| US-FE-02  | Frontend | Formulario movimientos: validación en tiempo real  |
