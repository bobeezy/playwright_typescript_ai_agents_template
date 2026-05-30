---
description: Generate a Playwright page object for this repo — provide a page name, URL path, and HTML snippet or element descriptions.
mode: agent
tools:
  - codebase
  - editFiles
---

You are working in a **Playwright Test + JavaScript** project. Generate a page object class that matches the conventions of `pages/LoginPage.js`.

## What to produce

A single JavaScript file saved to `pages/<Name>Page.js`.

## Conventions to follow

Match `pages/LoginPage.js` exactly:

- No imports needed for page objects — locators are assigned in the constructor via the `page` argument
- Class name: `<Name>Page`
- Fields: assign `this.page = page` + one `this.<fieldName> = page.locator(...)` per interactive or assertable element in the constructor
- Constructor: `constructor(page)` — assign all locators via `page.locator(...)` or semantic locators
- Include a `getPath()` method returning the URL path
- Include an `async goto()` method calling `this.page.goto(this.getPath())`
- Include user-facing action methods (e.g. `login`, `search`, `submit`) — hide selector details inside them
- Include a `get<Text/Value>()` async helper for any visible feedback element the spec needs to assert on
- No `require('... test ...')` or `expect` in page objects — assertions stay in specs
- No hardcoded credentials or test data — those belong in `data/web/*.json` and env vars
- Export with `module.exports = { <Name>Page };` at the bottom of the file

## Locator priority

1. `page.locator('#id')` — when the app uses stable IDs (as Herokuapp does)
2. `page.getByRole(...)` — for semantic elements (buttons, links, headings)
3. `page.getByLabel(...)` — for labelled form inputs
4. `page.getByText(...)` — for readable text content
5. Stable attribute selectors (`[data-testid="..."]`, `[type="submit"]`) — when above are unavailable
6. Avoid generated class names, layout selectors, and brittle XPath

## Reference — `pages/LoginPage.js`

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

## Inputs needed from the user

- **Page name** — e.g. `Dashboard`, `Checkout`, `UserProfile`
- **URL path** — e.g. `/dashboard`, `/checkout`
- **Elements** — HTML snippet, screenshot description, or list of interactions and assertions the spec will need

## After generating

1. Confirm the file was written to `pages/<Name>Page.js`
2. Show the full class
3. List the locators chosen and why (especially if stable IDs were not available)
4. Do **not** run tests — the spec author will wire up the page object and run `npm run test:web`
