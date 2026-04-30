import { useState } from 'react';

import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Spinner } from '#/components/ui/spinner';

import type { ProductListItem } from '../schemas/product-list.schema';
import {
  MOVEMENT_REASON_LABELS,
  MOVEMENT_REASON_LITERALS,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_LITERALS,
} from '../schemas/register-movement.schema';

import { useRegisterMovementForm } from '../hooks/use-register-movement-form';

type RegisterMovementDialogProps = {
  products: ProductListItem[];
  disabled?: boolean;
};

function firstFieldError(errors: readonly unknown[]): string | undefined {
  const first = errors[0];
  if (typeof first === 'string') {
    return first;
  }
  if (first !== null && typeof first === 'object' && 'message' in first) {
    const msg = Reflect.get(first, 'message');
    if (typeof msg === 'string') {
      return msg;
    }
  }
  return undefined;
}

export function RegisterMovementDialog({
  products,
  disabled,
}: RegisterMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, isPending } = useRegisterMovementForm(
    products,
    open,
    () => setOpen(false),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" disabled={disabled}>
          Registrar movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 sm:max-w-lg">
        <DialogHeader className="gap-2">
          <DialogTitle>Registrar entrada o salida</DialogTitle>
          <DialogDescription>
            Completa los datos del movimiento. Si es una salida, no podrás
            indicar más unidades de las que hay disponibles.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          {products.length === 0 ? (
            <Alert>
              <AlertTitle>No hay productos para elegir</AlertTitle>
              <AlertDescription>
                Cuando tengas productos activos en tu inventario, podrás
                registrar movimientos desde aquí.
              </AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <form.Field name="type">
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0}
                  className="gap-2"
                >
                  <FieldLabel htmlFor={field.name}>Tipo</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as (typeof MOVEMENT_TYPE_LITERALS)[number])
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        className="w-full max-w-none"
                        aria-invalid={field.state.meta.errors.length > 0}
                      >
                        <SelectValue placeholder="Elige tipo" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {MOVEMENT_TYPE_LITERALS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {MOVEMENT_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError>
                      {firstFieldError(field.state.meta.errors)}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="productId">
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0}
                  className="gap-2"
                >
                  <FieldLabel htmlFor={field.name}>Producto</FieldLabel>
                  <FieldContent>
                    <Select
                      value={
                        field.state.value.length > 0 ? field.state.value : undefined
                      }
                      onValueChange={field.handleChange}
                      disabled={products.length === 0}
                    >
                      <SelectTrigger
                        id={field.name}
                        className="w-full max-w-none"
                        aria-invalid={field.state.meta.errors.length > 0}
                      >
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <form.Subscribe
                      selector={(s) => ({
                        type: s.values.type,
                        productId: s.values.productId,
                      })}
                    >
                      {({ type, productId }) => {
                        if (type !== 'OUT' || productId.length === 0) {
                          return null;
                        }
                        const stock = products.find(
                          (p) => p.id === productId,
                        )?.stock_actual;
                        if (stock === undefined) {
                          return null;
                        }
                        return (
                          <FieldDescription>
                            Disponible ahora: {stock} unidades
                          </FieldDescription>
                        );
                      }}
                    </form.Subscribe>
                    <FieldError>
                      {firstFieldError(field.state.meta.errors)}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="quantity">
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0}
                  className="gap-2"
                >
                  <FieldLabel htmlFor={field.name}>Cantidad</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={1}
                      step={1}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                      placeholder="Ej. 10"
                    />
                    <FieldError>
                      {firstFieldError(field.state.meta.errors)}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="reason">
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0}
                  className="gap-2"
                >
                  <FieldLabel htmlFor={field.name}>Motivo</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(
                          v as (typeof MOVEMENT_REASON_LITERALS)[number],
                        )
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        className="w-full max-w-none"
                        aria-invalid={field.state.meta.errors.length > 0}
                      >
                        <SelectValue placeholder="Motivo" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {MOVEMENT_REASON_LITERALS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {MOVEMENT_REASON_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError>
                      {firstFieldError(field.state.meta.errors)}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="date">
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0}
                  className="gap-2"
                >
                  <FieldLabel htmlFor={field.name}>Fecha y hora</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="datetime-local"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    <FieldError>
                      {firstFieldError(field.state.meta.errors)}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || products.length === 0}
              className="gap-2"
            >
              {isPending ? <Spinner /> : null}
              Guardar movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
