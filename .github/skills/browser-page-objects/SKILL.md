---
name: browser-page-objects
description: Create or update Playwright page objects in this repo. Use when a web scenario needs a new pages/*Page.js file, a locator update, or a UI interaction refactor.
---

# 🌐 Skill: Browser page objects

## Use when

- A web scenario needs a new `pages/*Page.js` class
- An existing page object has a broken, brittle, or missing locator
- UI interaction logic has crept into a spec and needs moving to the page object layer
- A page object is growing too large and repeated UI regions should be extracted

## Workflow

1. **Read the existing page object** (if it exists) and the spec that uses it before making changes
2. **Check the HTML or element description** — use the `find-locator` prompt (`../../prompts/find-locator.prompt.md`) to choose the best locator before writing code
3. **Add or update the page object** following the `LoginPage.js` pattern (see below)
4. **Expose user-facing methods** — hide locator details inside the page object; specs call methods like `login()`, not `usernameInput.fill()`
5. **Keep locator fields** accessible to specs that need to assert on them directly (e.g. `loginPage.flashMessage`)
6. **Validate** — run `npm run test:web` or a targeted `npx playwright test tests/web/<file>.web.spec.js`; report pass/fail

## Page object pattern

Match `pages/LoginPage.js` exactly:

```js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.flashMessage = page.locator('#flash');
    this.logoutButton = page.locator('a.button.secondary.radius');
  }

  getLoginPath() {
    return '/login';
  }

  async goto() {
    await this.page.goto(this.getLoginPath());
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getFlashMessage() {
    return (await this.flashMessage.textContent())?.trim() ?? '';
  }
}

module.exports = { LoginPage };
```

## Rules

| Rule | Detail |
|------|--------|
| File location | `pages/<Name>Page.js` |
| No framework imports | No `require` of `test` or `expect` in page objects |
| Fields | `this.page = page` + one `this.<name> = page.locator(...)` per interactive or assertable element |
| Constructor | Assign all locators via `page.locator(...)` or semantic locators |
| Path helper | `getPath()` returning the relative URL |
| Navigation | `async goto()` calling `this.page.goto(this.getPath())` |
| Action methods | User-facing (e.g. `login`, `search`, `submit`) — no raw selectors exposed to specs |
| Feedback helpers | `async get<Text>()` for visible text the spec needs to assert on |
| No assertions | Never call `expect(...)` inside a page object — assertions stay in specs |
| No `waitForTimeout` | Use Playwright's auto-waiting; never add arbitrary delays |
| Export | `module.exports = { <Name>Page };` at the bottom of the file |

## Locator priority

1. `page.locator('#id')` — stable unique ID (as Herokuapp uses `#username`, `#password`, `#flash`)
2. `page.getByRole(role, { name })` — ARIA role + accessible name
3. `page.getByLabel(text)` — label-associated form input
4. `page.getByPlaceholder(text)` — input placeholder when no label
5. `page.getByText(text)` — non-interactive readable content
6. `page.getByTestId(value)` — `data-testid` attribute
7. Stable attribute selector — `[type="submit"]`, `[data-cy="..."]`
8. Avoid: generated class names, layout-only CSS, XPath

## Security

- No credentials or test data in page objects — those belong in `utils/env.js` / `data/web/*.json`
- When adding a new sensitive input field (password, token), extend `credentialSelectors` in `hooks/WebHooks.js` so `redactCredentialFields()` clears it before screenshots

## References

- `../../specifications/pageObjectFromHtmlSnippet.spec.md` — formal spec for page object generation
- `../../prompts/find-locator.prompt.md` — locator recommendation prompt
- `../../prompts/generate-page-object.prompt.md` — full page object generation prompt

## Done when

- [ ] File saved at `pages/<Name>Page.js`
- [ ] All locator fields assigned in constructor
- [ ] `goto()` calls `this.page.goto(this.getPath())`
- [ ] Action methods hide selector detail from specs
- [ ] No `expect` or `test` require in the page object
- [ ] Sensitive input selectors added to `WebHooks.js` `credentialSelectors` if applicable
- [ ] `module.exports` at the bottom of the file
- [ ] `npm run lint` passes
- [ ] `npm run test:web` (or targeted file) passes and results reported
