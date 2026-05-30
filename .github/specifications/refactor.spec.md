# Spec: Playwright refactor

**Used by:** `.github/prompts/refactor.prompt.md`

## Goal

Improve readability, remove duplication, fix layering violations, and strengthen locators in Playwright specs, page objects, and API clients — without changing test behaviour or scenario coverage.

## Inputs

| Input | Description | Example |
|-------|-------------|---------|
| File path(s) | One or more files to refactor | `tests/web/login.web.spec.js`, `pages/LoginPage.js` |
| Focus area (optional) | Specific smell or concern | `"steps are missing"`, `"locators look fragile"`, `"data is hardcoded"` |

## Output

For each file:

1. **Issues found** — list of specific smells with file + line references where possible
2. **Refactored file** — full updated file content
3. **Change summary** — what changed and why (one line per change)
4. **Lint note** — any patterns likely to be flagged by `eslint-plugin-playwright` or ESLint

## Rules by file type

### Specs (`tests/web/*.web.spec.js`, `tests/api/*.api.spec.js`)

| Rule | Check |
|------|-------|
| Fixture import | `test` / `expect` via `require('fixtures/webTest')` or `require('fixtures/apiTest')` |
| `expect.hasAssertions()` | Present at the start of web tests |
| `test.step` | Multi-step web flows wrapped with business-readable step titles |
| Repeated navigation | Extracted to a local helper inside `test.describe` |
| Hardcoded test data | Moved to `data/web/*.json` or `data/api/*.json` |
| Shared mutable state | Used only in `test.describe.serial` with clear justification |

### Page objects (`pages/*Page.js`)

| Rule | Check |
|------|-------|
| Field assignment | All locators assigned as `this.<name>` in constructor |
| Locator stability | Uses priority order: `#id` → role → label → placeholder → text → attribute |
| Assertions | No `expect(...)` calls — those belong in specs |
| Inline `page.locator(...)` | Inside methods, replaced with named constructor fields |
| Export | `module.exports = { <Name>Page };` at bottom |

### API clients (`clients/*ApiClient.js`)

| Rule | Check |
|------|-------|
| `callApiWithReport` | All HTTP calls go through `utils/apiReporter.js` |
| Inline request calls | No `request.post` / `request.get` bypassing the client |
| Duplication | Shared request-building logic extracted to a helper method |
| Export | `module.exports = { <Name>ApiClient };` at bottom |

## Constraints

- Do not change test titles, scenario coverage, or expected outcomes
- Do not add or remove scenarios
- Do not modify `hooks/WebHooks.js` credential redaction unless explicitly asked
- Do not modify `playwright.config.js` unless explicitly asked
- Do not run tests — output is code only; user validates with `npm run test:web`, `npm run test:api`, or targeted `npx playwright test`

## Acceptance criteria

- [ ] No fixture imports from `@playwright/test` directly in spec files
- [ ] Web specs have `expect.hasAssertions()` and `test.step` on multi-step flows
- [ ] Hardcoded negative/edge values live in `data/web/*.json` or `data/api/*.json`
- [ ] Page object locator fields are constructor-assigned, stable, and free of assertions
- [ ] API client methods all use `callApiWithReport`
- [ ] Change summary provided for every modified file
- [ ] `npm run lint` passes on touched files (user confirms)
