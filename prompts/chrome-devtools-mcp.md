# Prompts · Chrome DevTools MCP — E2E Tests

---

## Prerequisites

### Chrome DevTools MCP setup (Brave / Chromium)

The Chrome DevTools MCP plugin looks for Google Chrome at `/opt/google/chrome/chrome`.
If you use **Brave** (or another Chromium-based browser), create a symlink once:

```bash
sudo mkdir -p /opt/google/chrome
sudo ln -sf /usr/bin/brave-browser /opt/google/chrome/chrome
```

The plugin is enabled via `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "mcp-server-dev@claude-plugins-official": true
  }
}
```

Services must be running before the tests:
- Frontend: `http://localhost:5173`
- Backend:  `http://localhost:3000`

---

## E2E Test Suite — Chrome DevTools MCP

### Test plan (9 tests)

**product-list.spec**

| # | Test | MCP approach |
|---|------|-------------|
| 1 | shows heading and register control | Navigate `/`, snapshot — check "Tus productos" + button |
| 2 | renders a table row for each product | Navigate `/`, snapshot — check real products from backend |
| 3 | M8 – Stock bajo badge | Find a row with low stock, assert badge text + aria-label |
| 4 | En orden badge | Find a row with adequate stock, assert badge |
| 5 | button navigates to /movements | Click "Registrar movimiento", assert URL |

**movement-form.spec**

| # | Test | MCP approach |
|---|------|-------------|
| 6 | loads dedicated movement page | Navigate `/movements`, snapshot — check heading |
| 7 | IN movement – submits and redirects | Fill form with real product, submit, assert redirect to `/` |
| 8 | valid OUT movement | Select "Salida", fill within stock, submit, assert redirect |
| 9 | invalid OUT – shows stock limit error | Exceed stock, submit, assert error message stays on `/movements` |

Key difference vs Playwright spec files: **no mocking** — tests run against the real backend.
Tests 3/4 depend on actual stock values in the DB; tests 7–9 create real movements.

---

## Prompt

```
Using the chrome devtools mcp: Test plan (9 tests total)

  product-list.spec.ts

  ┌─────┬──────────────────────────────────────┬───────────────────────────────────────────────────────────┐
  │  #  │                 Test                 │                       MCP approach                        │
  ├─────┼──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 1   │ shows heading and register control   │ Navigate /, snapshot — check "Tus productos" + button     │
  ├─────┼──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 2   │ renders a table row for each product │ Navigate /, snapshot — check real products from backend   │
  ├─────┼──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 3   │ M8 – Stock bajo badge                │ Find a row with low stock, assert badge text + aria-label │
  ├─────┼──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 4   │ En orden badge                       │ Find a row with adequate stock, assert badge              │
  ├─────┼──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
  │ 5   │ button navigates to /movements       │ Click "Registrar movimiento", assert URL                  │
  └─────┴──────────────────────────────────────┴───────────────────────────────────────────────────────────┘

  movement-form.spec.ts

  ┌─────┬───────────────────────────────────────┬────────────────────────────────────────────────────────────────┐
  │  #  │                 Test                  │                          MCP approach                          │
  ├─────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ 6   │ loads dedicated movement page         │ Navigate /movements, snapshot — check heading                  │
  ├─────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ 7   │ IN movement – submits and redirects   │ Fill form with real product, submit, assert redirect           │
  ├─────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ 8   │ valid OUT movement                    │ Select "Salida", fill within stock, submit, assert redirect    │
  ├─────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ 9   │ invalid OUT – shows stock limit error │ Exceed stock, submit, assert error message stays on /movements │
  └─────┴───────────────────────────────────────┴────────────────────────────────────────────────────────────────┘

  Key difference vs spec files: No page.route() mocking — tests run against real backend data. Tests 3/4 depend on actual stock values in the DB, and tests 7–9 will create real
  movements.
```

---

## Results (run 2026-05-12)

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | shows heading and register control | ✅ PASS | "Tus productos" + button uid confirmed via a11y snapshot |
| 2 | renders a table row for each product | ✅ PASS | Aceite de oliva + Lentejas rows present |
| 3 | M8 – Stock bajo badge | ✅ PASS | Lentejas: stock 30 < min 50, badge "Stock bajo", aria-label correct |
| 4 | En orden badge | ✅ PASS | Aceite de oliva: stock 52 > min 10, badge "En orden" |
| 5 | button navigates to /movements | ✅ PASS | URL changed to `/movements` after click |
| 6 | loads dedicated movement page | ✅ PASS | Heading + all form fields present |
| 7 | IN movement – submits and redirects | ✅ PASS | Stock 52 → 57 after IN +5 on Aceite de oliva |
| 8 | valid OUT movement | ✅ PASS | Stock 57 → 54 after OUT -3; toast "Listo: el movimiento quedó registrado." |
| 9 | invalid OUT – shows stock limit error | ✅ PASS | Quantity 99 > stock 30; error "Solo puedes sacar hasta 30 unidades"; stays on `/movements` |

### shadcn Select interaction note

The product and type selectors are shadcn `<Select>` components (not native `<select>`).
The correct interaction pattern with the Chrome DevTools MCP is:

1. `click` the combobox uid to open the listbox
2. Take a fresh snapshot to get the listbox option uids (they are assigned dynamically)
3. `click` the target option uid

Do **not** use `fill` on these comboboxes — it only works on native inputs and spinbuttons.
