# 🤖 Copilot customisation layer

This folder contains the GitHub Copilot customisation layer for the **Playwright + TypeScript** automation framework. It shapes how Copilot Chat, Copilot agent mode, and GitHub's cloud agent behave whenever anyone works in this repository.

Think of it as a team handbook that AI reads so you don't have to repeat your standards in every prompt.

For the full repository (tests, tooling, CI-style verify scripts), see the root [`README.md`](../README.md).

---

## What was built and why

Without this layer, every AI chat starts from zero: wrong fixture imports, secrets in specs, or tests that ignore your folder layout. **`.github/` teaches the AI the same standards the root README teaches humans.**

| Built | Why |
|-------|-----|
| **`copilot-instructions.md`** | Always-on baseline: TestPilot persona, POM rules, fixture imports, `getRequiredEnv()`, lint/test commands. Copilot loads it automatically — you do not invoke it manually. |
| **`agents/ai-test-engineer.agent.md`** | Specialist agent for test work: routes web vs API vs `.github/` tasks and points to the right skill. |
| **`prompts/`** | Repeatable workflows (Jira → specs, HTML → page object, locator help, refactor) so prompts stay consistent across the team. |
| **`skills/`** | Deep playbooks (API tests, page objects, E2E delivery, security review, maintenance) the agent can follow for multi-step work. |
| **`specifications/`** | Acceptance criteria for prompt outputs — update with prompts when expected results change. |
| **`guardrails/`** | Active security contract + reference doc; keeps AI-generated code aligned with no-secrets-in-source policy. |
| **`rules/`** + **`pull_request_template.md`** | Consistent commit messages, issue titles, and PR descriptions without retyping templates. |

### How this fits the rest of the repo

```text
Root repo (../)                    .github/ (this folder)
─────────────────                  ─────────────────────
Playwright tests          ←──rules──  copilot-instructions.md
pages/, clients/          ←──skills── api-test-development, browser-page-objects, …
fixtures/, hooks/         ←──agent──  ai-test-engineer
.env.credentials (gitignored) ←──guardrails── security-guardrails.md
```

**Typical flow:** Jira ticket → `jira-to-feature` prompt (with Playwright MCP) → scenarios → `@ai-test-engineer` implements using skills → `npm run test:verify` before merge.

---

## 📁 Folder structure

```text
.github/
├── README.md                              ← this file
├── copilot-instructions.md                ← always-on baseline (auto-loaded)
├── pull_request_template.md               ← PR form (auto-loaded by GitHub)
│
├── agents/
│   └── ai-test-engineer.agent.md          ← custom Copilot agent
│
├── guardrails/
│   ├── security-guardrails.md             ← active security contract
│   └── security-guardrail-reference.md    ← rationale + review aid
│
├── prompts/
│   ├── generate-page-object.prompt.md     ← HTML → page object
│   ├── find-locator.prompt.md             ← element → best locator
│   ├── refactor.prompt.md                 ← refactor a file
│   └── jira-to-feature.md                 ← Jira ticket → specs
│
├── rules/
│   ├── .copilot-commit-message-instructions.md
│   ├── .copilot-issue-title-instructions.md
│   └── .copilot-pull-request-description-instructions.md
│
├── skills/
│   ├── api-test-development/SKILL.md
│   ├── browser-page-objects/SKILL.md
│   ├── end-to-end-test-delivery/SKILL.md
│   ├── feature-authoring/SKILL.md
│   ├── mobile-test-development/SKILL.md
│   ├── security-review-and-audit/SKILL.md
│   └── test-maintenance-and-quality/SKILL.md
│
└── specifications/
    ├── findLocator.spec.md
    ├── jira2Feature.spec.md
    ├── pageObjectFromHtmlSnippet.spec.md
    └── refactor.spec.md
```

---

## 1. What each file type does

### `copilot-instructions.md` — always-on baseline

Automatically injected into every Copilot Chat session in this repo. Answers: *what is this project, what stack, what are the rules, who is the AI?*

Contains:
- **TestPilot** persona (`Hi, TestPilot here. How can I help you?`)
- Security guardrails (no secrets in source, `getRequiredEnv()` usage, Gitleaks)
- Repository layout (`tests/web/`, `tests/api/`, `pages/`, `clients/`, `fixtures/`)
- Playwright locator priority, POM conventions, fixture import rules
- Commands (`npm run test:web`, `test:api`, `test:verify`, lint)

> **You never call this file.** Copilot loads it automatically on every session.

---

### `agents/ai-test-engineer.agent.md` — custom AI agent

A specialist Copilot agent called **AI Test Engineer**. Inherits the baseline from `copilot-instructions.md` and adds:
- Task routing (web vs API vs shared vs `.github/`)
- Which skill to invoke for each task type
- Implementation rules (fixture imports, client patterns, data file locations)
- A "done when" checklist

> **How to trigger:** Copilot Chat → Agent mode → `@ai-test-engineer <task>`

---

### `skills/**/SKILL.md` — reusable playbooks

Seven self-contained procedures loaded on demand by the agent. Each has a `name`, `description`, workflow, rules, and done checklist.

| Skill | Purpose |
|-------|---------|
| `feature-authoring` | Ticket → scenario table with approval gate before any code is written |
| `api-test-development` | Add or maintain `tests/api/` specs and `clients/*ApiClient.js` |
| `browser-page-objects` | Create or update `pages/*Page.js` following `LoginPage.js` conventions |
| `mobile-test-development` | Playwright `devices[...]` project setup for responsive coverage |
| `end-to-end-test-delivery` | Orchestrate the above for cross-layer (web + API) requirements |
| `test-maintenance-and-quality` | Fix flakes, repair locators, remove duplication and code smell |
| `security-review-and-audit` | Self-scan checklist before editing `.github/` control-plane files |

> **How to trigger:** The agent routes to skills automatically, or you can be explicit:
> ```
> Use the browser-page-objects skill to fix the logout locator in LoginPage
> Use the test-maintenance-and-quality skill to fix the flaky checkout test
> ```

---

### `prompts/*.prompt.md` — slash commands

Four on-demand prompts you run yourself in Copilot Chat. Each has `mode: agent` frontmatter and links to a spec document for formal acceptance criteria.

| Prompt | What you provide | What you get |
|--------|-----------------|--------------|
| `generate-page-object` | Page name, URL path, HTML snippet or element list | A complete `pages/<Name>Page.js` matching `LoginPage.js` conventions |
| `find-locator` | HTML snippet or element description | Best Playwright locator + locator field declaration + red flags |
| `refactor` | File path(s) + optional focus area | Refactored file, change summary, lint notes |
| `jira-to-feature` | Jira ticket URL or key | Scenario table (Positive/Negative/Edge), then implementation of approved ones |

> **How to trigger:** three options — see [Triggering prompts](#triggering-prompts) below.

---

### `rules/` — auto-injected formatting standards

Loaded automatically by Copilot when generating the corresponding artefact. You never call these directly.

| File | Applied when Copilot generates |
|------|-------------------------------|
| `.copilot-commit-message-instructions.md` | A commit message (`feat(web): ...` conventional format) |
| `.copilot-issue-title-instructions.md` | A GitHub issue title (`Bug:`, `Feature:`, `Refactor:` …) |
| `.copilot-pull-request-description-instructions.md` | A PR description (maps diff to the 8-section PR template) |

---

### `guardrails/` — security contract and review aid

| File | Purpose |
|------|---------|
| `security-guardrails.md` | Active behavioural rules — what agents must and must not do (no secrets, `getRequiredEnv()`, `WebHooks` redaction, safe targets) |
| `security-guardrail-reference.md` | Rationale, green patterns, red flags, self-scan questions for PR review of `.github/` files |

> These are referenced by the agent and `security-review-and-audit` skill. Not invoked directly.

---

### `specifications/` — formal specs backing each prompt

Each prompt links to a specification that defines inputs, outputs, rules, and acceptance criteria precisely.

| Spec | Backs |
|------|-------|
| `pageObjectFromHtmlSnippet.spec.md` | `generate-page-object.prompt.md` |
| `findLocator.spec.md` | `find-locator.prompt.md` |
| `refactor.spec.md` | `refactor.prompt.md` |
| `jira2Feature.spec.md` | `jira-to-feature.md` |

> These are included via `#file:` in prompt frontmatter. Not invoked directly.

---

### `pull_request_template.md` — PR form

GitHub loads this automatically when anyone opens a new PR. Contains:
- Pre-submit checklist (secrets, fixture imports, lint, Gitleaks, test runs)
- Summary, motivation, dependencies
- Ticket / issue link
- Type of change and areas touched (emoji checkboxes)
- Test evidence code block
- Screenshots / reports section
- Notes for reviewers

> **Automatic** — no action needed to activate.

---

## 2. How it all connects

```
Every Copilot session
        │
        ▼
copilot-instructions.md  ←── always loaded, sets the baseline
        │
        ├── Copilot Chat (Ask / Edit mode)
        │       Suggestions follow POM conventions, locator priority,
        │       fixture imports, and security guardrails silently.
        │
        ├── Agent mode  (@ai-test-engineer)
        │       Loads agents/ai-test-engineer.agent.md
        │       │
        │       ├── Reads task → routes to skill
        │       ├── Skill loaded on demand → does the work
        │       └── Reports done checklist
        │
        ├── Prompt commands
        │       Prompt loaded + specification #file: included as context
        │       Runs as agent task (mode: agent)
        │       User provides inputs → agent produces output
        │
        └── Commit / PR / Issue generation
                rules/ files auto-injected
                Output follows conventional commit format and PR template
```

---

## 3. How to trigger everything

### Always-on (no action needed)

| What | Activates automatically |
|------|------------------------|
| `copilot-instructions.md` | Every Copilot Chat session |
| `rules/*.md` | Copilot generates commit message, issue title, or PR description |
| `pull_request_template.md` | Opening a new PR on GitHub |

---

### Custom agent

Switch Copilot Chat to **Agent mode** (dropdown in the chat input bar), then:

```
@ai-test-engineer Add positive and negative API tests for the checkout endpoint
@ai-test-engineer Fix the flaky logout test in login.web.spec.js
@ai-test-engineer Use the browser-page-objects skill to add a CheckoutPage
```

---

### Triggering prompts

**Option 1 — Prompt picker (VS Code)**

Copilot Chat → click the **📎 attach** icon → select **Prompt** → pick from the list.

**Option 2 — `#file:` reference in chat**

```
#file:.github/prompts/generate-page-object.prompt.md

Page name: Checkout
URL path: /checkout
HTML: <input id="email" type="email"> <button type="submit">Pay now</button>
```

```
#file:.github/prompts/find-locator.prompt.md

<a class="button secondary radius" href="/logout">Logout</a>
```

```
#file:.github/prompts/refactor.prompt.md

tests/web/login.web.spec.js — steps are missing test.step wrappers
```

**Option 3 — Jira prompt (requires MCP server)**

Start the MCP server first, then use the prompt:

```bash
npm run mcp:playwright
```

```
#file:.github/prompts/jira-to-feature.md
https://your-workspace.atlassian.net/browse/TE-456
```

---

### Explicitly invoking a skill

The agent picks skills automatically. You can also name one directly in any Copilot agent-mode message:

```
Use the feature-authoring skill — I need to plan coverage for TE-789 before writing any code
Use the api-test-development skill to add a PATCH /users/{id} test
Use the security-review-and-audit skill before I edit copilot-instructions.md
Use the end-to-end-test-delivery skill for the full checkout flow
```

---

## 4. Quick reference

| Goal | What to use | How |
|------|-------------|-----|
| AI always follows Playwright/POM rules | `copilot-instructions.md` | Automatic |
| Generate a new page object | `generate-page-object` prompt | `#file:` or prompt picker |
| Find the best locator for an element | `find-locator` prompt | `#file:` or prompt picker |
| Refactor a spec or page object | `refactor` prompt | `#file:` or prompt picker |
| Turn a Jira ticket into specs | `jira-to-feature` prompt | `#file:` + MCP running |
| Add web or API test coverage | `@ai-test-engineer` | Agent mode |
| Fix a failing or flaky test | `@ai-test-engineer` + `test-maintenance-and-quality` skill | Agent mode |
| Review `.github/` changes safely | `security-review-and-audit` skill | Explicit skill invoke |
| Consistent commit messages | `rules/.copilot-commit-message-instructions.md` | Automatic |
| Pre-filled PR description | `pull_request_template.md` + `rules/.copilot-pull-request-description-instructions.md` | Automatic |

---

## 5. Keeping this layer healthy

- **`copilot-instructions.md`** is the source of truth — update it when project conventions change
- **`security-guardrails.md`** and `copilot-instructions.md` security section must stay consistent; update both together
- **Before editing any `.github/` file** — run the `security-review-and-audit` skill self-scan
- **Skills and prompts** are independent; update them when workflows change without touching the baseline
- **Specifications** back prompts; update both together when acceptance criteria change
