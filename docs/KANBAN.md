# Project Kanban

## In Progress

| ID | Task | Notes |
| :--- | :--- | :--- |
| GL-02 | Header `#page-actions` Teleport slot | Framework support exists, awaiting use cases |
| SB-05 | Connect user data to real Auth Store (Pinia) | Ready for integration with auth state |

---

## Done

| ID | Task | Delivered in |
| :--- | :--- | :--- |
| GL-00 | Global layout shell (`GlobalLayout.vue` + `AppSidebar.vue`) | `layout` branch |
| GL-00 | Router setup with nested routes | `layout` branch |
| GL-04 | Navigation guard (auth redirect to login) | `layout` branch |
| GL-01 | Page subtitle support via router meta | `transactions` branch |
| GL-03 | Notification bell with unread badge (`NotificationBell.vue`) | `transactions` branch |
| SB-01 | Sidebar logo area with SVG icon + wordmark | `layout` branch |
| SB-02 | Nav items with Heroicons | `layout` branch |
| SB-03 | Active nav item left border indicator | `layout` branch |
| SB-04 | User menu popup (`UserMenuPopup.vue`) with click-outside | `layout` branch |
| LG-01 | LoginPage form UI with validation | `layout` branch |
| LG-02 | Auth Pinia store + JWT token storage | `layout` branch |
| DT-01 | Design tokens document (`docs/develop/design-tokens.md`) with financial semantics | `layout` branch |
| DB-01 | Summary cards (total balance, income, expenses, savings rate) | `dashboard` branch |
| DB-02 | Recent transactions list with category details | `dashboard` branch |
| DB-03 | Trend chart (30-day income/expense, Catmull-Rom curves) | `dashboard-chart` branch |
| DB-05 | Expense category pie chart (donut, multi-color) | `dashboard-chart` branch |
| DB-06 | Budget usage radar chart (5-axis spider) | `dashboard-chart` branch |
| TX-01 | Transaction list with pagination | `transactions` branch |
| TX-02 | Search and filter toolbar | `transactions` branch |
| AT-01 | `TransactionFormModal.vue` form UI & validation | `transactions` branch |
| AT-02 | Client-side form validation | `transactions` branch |
| AT-03 | Success / error feedback & post-submit redirect | `transactions` branch |
| AC-01 | Account list page (`AccountsPage.vue`) | `transactions` branch |
| AC-02 | Add / edit / delete account modal (`AccountFormModal.vue`) | `transactions` branch |
| BG-01 | Budget list with progress bars (`BudgetsPage.vue`) | `transactions` branch |
| BG-02 | Add / edit / delete budget modal (`BudgetFormModal.vue`) | `transactions` branch |
| AN-01 | Date range picker (preset + custom) | `transactions` branch |
| AN-02 | Income vs. expense trend chart | `transactions` branch |
| AN-03 | Category breakdown pie chart | `transactions` branch |
| ST-01 | Profile settings form | `transactions` branch |
| ST-02 | Preferences (currency, theme, language) | `transactions` branch |
| IN-01 | Backend API Reference drafting for implemented endpoints | `lint` branch |
| IN-01A | Route index and auth model section | `lint` branch |
| IN-01B | Accounts and categories contract section | `lint` branch |
| IN-01C | Transactions and summary contract section | `lint` branch |
| IN-01D | Known gaps and next revision checklist | `lint` branch |
| IN-01E | Auth method constraints for logout/me/change-password | `lint` branch |
| IN-02A | Frontend auth store switched from mock token to backend session APIs | `lint` branch |
| IN-02B | Router guard bootstraps auth state from `/api/auth/me/` | `lint` branch |
| IN-02 | Replace frontend mocks with real Auth/Accounts/Transactions APIs | `lint` branch |
| IN-02C | Accounts page and modal switched to backend APIs | `lint` branch |
| IN-02D | Transactions page and modal switched to backend APIs | `lint` branch |
| IN-02E | Reports and dashboard switched to backend API data sources | `lint` branch |
| BE-05 | Budgets CRUD backend endpoints implemented and exposed via `/api/budgets/` | `preferences-theme-language-frontend` branch |
| IN-03 | Connect Budgets/Categories/Dashboard aggregation APIs | `preferences-theme-language-frontend` branch |
| IN-05 | Integration test runbook for step-by-step validation (`docs/API_INTEGRATION_TEST_PLAN.md`) | `lint` branch |
| IN-06 | Integration seed data command and test data table (`seed_integration_data`, `docs/API_TEST_DATA_TABLE.md`) | `lint` branch |
| UI-06 | Lighthouse desktop optimization (contrast fixes, robots.txt validation, route-loading tuning) and before/after evidence capture (`docs/lighthouse-screenshots/`) | `frontend/ui-lighthouse-optimizations` branch |

---

## Backlog

### Global Layout

| ID | Task | Priority |
| :--- | :--- | :--- |
| GL-02 | Header `#page-actions` Teleport slot (currently in-progress, awaiting use cases) | P2 |

### Sidebar

| ID | Task | Priority |
| :--- | :--- | :--- |
| SB-05 | Connect user data to real Auth Store (currently in-progress) | P2 |

### Dashboard

| ID | Task | Priority |
| :--- | :--- | :--- |
| DB-04 | Skeleton loading state refinement | P2 |
| DB-07 | Chart interactions (tooltip / period switch) | P2 |
| DB-08 | Limit dashboard chart transaction query to 30-day range | P1 |

### Backend

| ID | Task | Priority |
| :--- | :--- | :--- |
| BE-01 | Django app scaffolding (users, transactions, categories) | P1 |
| BE-02 | REST API endpoints (DRF) | P1 |
| BE-03 | JWT authentication | P1 |
| BE-04 | Accounts CRUD endpoints | P1 |
| BE-06 | Transactions CRUD endpoints | P1 |
| BE-07 | Categories CRUD endpoints | P1 |

### Integration

| ID | Task | Priority |
| :--- | :--- | :--- |
| IN-04 | Joint smoke test and release hardening checklist | P1 |
| IN-07 | Frontend README should document bun and npm dev command options | P2 |

### Frontend Polish

| ID | Task | Priority |
| :--- | :--- | :--- |
| UI-01 | Dark mode theme implementation | P2 |
| UI-02 | Mobile responsive refinements | P2 |
| UI-03 | Loading state animations | P2 |
| UI-04 | Error boundary components | P2 |
| UI-05 | User Profile popup broken — cannot open, cannot change avatar | P1 |

### Transactions

| ID | Task | Priority |
| :--- | :--- | :--- |
| TX-03 | Transaction row click → edit/delete modal (inline actions) | P1 |
| TX-04 | Transaction list must sort newest-first; newly added items appear at top | P1 |
| TX-05 | "Failed to save transaction" — investigate create/update error path | P1 |
| TX-06 | Transactions page size per page not enforced / configurable | P2 |

### Settings

| ID | Task | Priority |
| :--- | :--- | :--- |
| ST-03 | Settings profile changes not persisted to backend | P1 |
| ST-04 | Settings cannot switch theme / language / font size | P2 |
| ST-05 | Settings page Description field is duplicated | P2 |
| ST-06 | Keep User Profile editing in a single place (sidebar modal OR settings page only) | P1 |
| ST-07 | Move "Manage your account and preferences" ownership to Global Layout route subtitle | P2 |
| ST-08 | Preferences effective scope incomplete (theme/language/currency do not affect runtime behavior) | P1 |

### Backend Gaps

| ID | Task | Priority |
| :--- | :--- | :--- |
| SEC-01 | Guard deterministic seed command in non-debug environments | P1 |
| SEC-02 | Enforce CSRF protection for cookie-based password change API | P1 |

### Frontend Architecture

| ID | Task | Priority |
| :--- | :--- | :--- |
| FA-01 | Move frontend domain types out of mock-data module | P2 |
