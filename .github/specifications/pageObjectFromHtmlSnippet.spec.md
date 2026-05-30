# Spec: Page object from HTML snippet

**Used by:** `.github/prompts/generate-page-object.prompt.md`

## Goal

Given a page name, URL path, and HTML snippet (or element descriptions), produce a `pages/<Name>Page.js` file that matches the conventions of `pages/LoginPage.js`.

## Inputs

| Input | Description | Example |
|-------|-------------|---------|
| Page name | PascalCase name for the class | `Dashboard` |
| URL path | Relative path the page lives at | `/dashboard` |
| HTML / elements | Snippet, screenshot description, or list of elements to interact with or assert on | `<input id="search">`, `<button type="submit">Save</button>` |

## Output

A single file at `pages/<Name>Page.js` containing:

1. Class — `class <Name>Page`
2. Constructor — `constructor(page)` that assigns `this.page = page` and all locators
3. Fields — `this.<name> = page.locator(...)` per interactive or assertable element
4. `getPath()` — returns the URL path
5. `async goto()` — navigates to `getPath()`
6. Action methods — user-facing (e.g. `fillSearch`, `clickSave`); no raw locators exposed to specs
7. Feedback helpers — `async get<Text>()` for visible text the spec needs to assert on
8. Export — `module.exports = { <Name>Page };` at the bottom

## Locator rules

1. `page.locator('#id')` — stable unique ID first (as Herokuapp uses `#username`, `#password`, `#flash`)
2. `page.getByRole(role, { name })` — ARIA role + accessible name for buttons, links, headings
3. `page.getByLabel(text)` — label-associated form inputs
4. `page.getByPlaceholder(text)` — input placeholder when no label
5. `page.getByText(text)` — non-interactive readable content
6. `page.getByTestId(value)` — `data-testid` attribute
7. Stable attribute selector — `[type="submit"]`, `[data-cy="..."]` — fallback only
8. No generated or hashed class names, layout-only CSS selectors, or XPath

## Constraints

- No `require` of `test` or `expect` — assertions stay in specs, not page objects
- No credentials, passwords, or test data literals
- No `page.waitForTimeout()` calls
- No logic that belongs in a fixture or hook
- New sensitive input fields (password, token) must be added to `credentialSelectors` in `hooks/WebHooks.js`

## Acceptance criteria

- [ ] File saved at `pages/<Name>Page.js`
- [ ] Constructor assigns `this.page` and all locator fields
- [ ] No `page.locator(...)` calls inside action methods — all locators are constructor fields
- [ ] `goto()` calls `this.page.goto(this.getPath())`
- [ ] Action methods hide locator detail from specs
- [ ] No `expect` or `test` require in the page object
- [ ] `module.exports` at the bottom of the file
- [ ] Locator choices explained in the generation summary (especially when stable IDs are absent)
- [ ] `npm run lint` passes on the generated file
