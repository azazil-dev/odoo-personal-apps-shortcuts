# Product Requirements Document: Personal Apps Shortcuts

**Technical name:** `personal_apps_shortcuts`\
**Platform:** Odoo 17.0 (Community and Enterprise)\
**License:** OPL-1 (Odoo Proprietary License v1.0)\
**Price:** USD 10.00 (one-time, per Odoo Apps Store listing)\
**Version:** 17.0.1.0.0\
**Status:** Draft v1.0

---

## 1. Document Control

| Item | Detail |
| --- | --- |
| Product | Personal Apps Shortcuts |
| Category | Productivity / Extra Tools |
| Target Odoo versions | 17.0 CE and 17.0 EE |
| Dependencies | `web` (CE). EE is detected at runtime; no manifest dependency on `web_enterprise` |
| Languages (UI) | English (base) and Indonesian (id); .pot template and id.po provided |
| Author / Maintainer | To be filled in |
| Last updated | October 2026 |

---

## 2. Product Overview

### 2.1 Summary

Personal Apps Shortcuts lets every Odoo user build a private set of shortcuts (name, URL, optional icon) that appears at the top of the Odoo apps menu, visually separated from the standard apps by a divider line. Shortcuts can point to external websites or to internal Odoo pages (specific records, reports, dashboards, filtered list views). Each user manages only their own shortcuts; no one else can see or change them.

### 2.2 Problem Statement

Odoo users frequently work with a handful of recurring destinations: a specific pivot report, a saved filter, a vendor portal, a Google Sheet, a company wiki. Today they rely on browser bookmarks, which are not tied to the Odoo account, are not available across devices unless the browser is synced, and cannot appear inside the Odoo navigation. Shared shortcut solutions create clutter because every employee sees everyone else's links.

### 2.3 Value Proposition

- **Private by design:** every user sees only their own links.
- **Native look and feel:** shortcuts use the same tile width, spacing, and column grid as the standard Odoo app menu.
- **Zero configuration:** installs and works immediately; no admin setup required.
- **Works on both editions:** consistent behavior in Community and Enterprise.
- **Mobile ready:** touch-friendly edit and delete controls.

### 2.4 Goals

1. Allow any internal user to create, edit, delete, and reorder personal shortcuts.
2. Support external URLs and internal Odoo URLs, with an optional custom icon.
3. Render shortcuts at the top of the apps menu, above a separator line, matching the native grid.
4. Guarantee data isolation per user at both ORM (record rule) and controller level.
5. Provide a smooth drag-and-drop reorder on desktop and a usable layout on phones and tablets.

### 2.5 Non-Goals (v1.0)

- Shared or team-level shortcuts, or admin-pushed shortcuts.
- Shortcut folders or groups.
- Import/export of shortcuts.
- Browser extension or "add current page" bookmarklet (candidate for v1.1).
- Portal or public user support.
- Multi-company-specific shortcuts (shortcuts belong to the user, not the company).

---

## 3. Target Users and Personas

| Persona | Description | Key need |
| --- | --- | --- |
| Office employee | Uses 3–5 Odoo apps daily | Quick access to a saved report or filtered list |
| Manager | Reviews dashboards and external BI tools | Links to Odoo dashboards and external tools in one place |
| Sales rep (mobile) | Uses Odoo on phone/tablet | Large tappable tiles, easy edit/delete without a mouse |
| Administrator | Installs and maintains the system | No configuration, no privacy risk, clean uninstall |

---

## 4. Edition Scope: Community (CE) vs Enterprise (EE)

The two editions have different navigation shells in Odoo 17, so the placement differs while the feature set is identical.

| Aspect | Community (CE) | Enterprise (EE) |
| --- | --- | --- |
| Native apps navigation | Dropdown apps menu in the top navbar | Full-screen Home Menu (app grid) |
| Shortcut placement | Top section of the apps dropdown, above a divider line, then standard apps | Top section of the Home Menu grid, above a divider line, then the standard app grid |
| Layout matching | Uses the dropdown's item style (icon + label) | Uses the same tile width, gap, and column count as the Home Menu app grid |
| Technical hook | Patch of the CE `AppsMenu` / navbar component | Patch of the EE `HomeMenu` component |
| Delivery | Single module `personal_apps_shortcuts` | `Same module; the Enterprise patch is lazy-loaded at runtime only when web_enterprise is installed` |

**Packaging note:** The module ships as a single package and detects Enterprise at runtime. The Enterprise Home Menu patch is lazy-loaded only when `web_enterprise` is installed, using a guarded lookup in the module loader instead of a static import, so CE databases never fail on a missing file and no second module is needed.

---

## 5. Functional Requirements

Priority: **M** = Must, **S** = Should, **C** = Could.

### 5.1 Shortcut Management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | A user can create a shortcut with: Name (required), URL (required), Icon image (optional). | M |
| FR-02 | A user can edit the name, URL, and icon of an existing shortcut they own. | M |
| FR-03 | A user can delete a shortcut they own, after a confirmation prompt. | M |
| FR-04 | A user can remove or replace the icon image of a shortcut. | M |
| FR-05 | Each user can have a maximum number of shortcuts (default 40, configurable only through system parameter `personal_apps_shortcuts.max_per_user`). Exceeding the limit shows a clear error. | S |
| FR-06 | A "Open in new tab" option per shortcut (default: ON for external URLs, OFF for internal Odoo URLs). | S |
| FR-07 | Shortcuts are available through the "Add shortcut" tile and the edit/delete controls rendered in the apps menu itself; no backend menu entry is required for normal use. | M |
| FR-08 | A technical backend list/form view (Settings > Technical > Personal Shortcuts) is available to administrators for debugging only, still restricted by the record rule (see Section 8). | C |

### 5.2 URL Handling

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-10 | Accepted URL types: absolute `http://` and `https://` URLs; relative internal paths starting with `/` (for example `/web#action=123&model=sale.order&view_type=list`, `/odoo/...`, `/shop`). | M |
| FR-11 | If the user types a URL without a scheme (for example `example.com`), the system prepends `https://`. | S |
| FR-12 | Dangerous schemes (`javascript:`, `data:`, `vbscript:`, `file:`) are rejected on the server with a validation error. | M |
| FR-13 | Internal URLs are opened in the same tab using the Odoo router (no full page reload when possible). External URLs open with `rel="noopener noreferrer"`. | M |
| FR-14 | A user can paste the current Odoo browser URL as an internal shortcut (the full origin is stripped if it matches the current database host and stored as a relative path, so shortcuts survive domain changes). | S |

### 5.3 Icons

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-20 | Icon upload accepts PNG, JPG, SVG, WEBP, max 1 MB. | M |
| FR-21 | Uploaded raster images are resized server-side to a maximum of 128×128 px (using Odoo's `image_process`) and stored as attachments. | M |
| FR-22 | If no icon is provided, a generated fallback tile is displayed: the first letter of the name on a colored background (color derived from a hash of the name, so it is stable). | M |
| FR-23 | The icon is displayed in a rounded-square tile consistent with Odoo app icons. | M |

### 5.4 Ordering (Drag and Drop)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-30 | On desktop, shortcuts can be reordered by drag and drop within the shortcut section. | M |
| FR-31 | The new order is persisted immediately through a single reorder call (array of IDs) and survives reload and re-login. | M |
| FR-32 | A visual placeholder and drag ghost indicate the drop position. | S |
| FR-33 | On touch devices, drag and drop is optional; ordering can also be changed through "Move earlier / Move later" actions in the edit dialog. | S |
| FR-34 | Reorder only affects the current user's records; IDs not owned by the user are ignored and logged. | M |

### 5.5 Display and Layout

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-40 | Shortcuts are displayed at the very top of the apps menu / Home Menu. | M |
| FR-41 | A horizontal divider line separates the shortcut section from the standard apps below. | M |
| FR-42 | If the user has no shortcuts, the divider is hidden and only a discreet "+ Add shortcut" tile is shown (no empty-state clutter). | M |
| FR-43 | A "+" tile is shown as the last item of the shortcut section unless Minimal mode is on (FR-49) to add a new shortcut. | M |
| FR-44 | In EE, tile width, gap, icon size, label font, and column count are identical to the native Home Menu grid, including responsive breakpoints. | M |
| FR-45 | In CE, shortcut entries use the same visual style as native dropdown entries (icon + label), with the same hover/active states. | M |
| FR-46 | Long names are truncated with ellipsis and show the full name as a tooltip (desktop). | S |
| FR-47 | Dark mode (Odoo 17 EE dark theme) must be legible: divider and tile colors use Odoo CSS variables. | S |
| FR-48 | RTL languages are supported (mirrored layout). | S |
| FR-49 | Minimal mode: a per-user preference (My Preferences) that gives a minimalist dashboard. When on, the "+" tile and the hover edit/delete controls are hidden, and the shortcut section (including its divider) is hidden entirely if the user has no shortcuts. Shortcuts remain managed through a "Manage shortcuts" entry in the user menu. | S |

### 5.6 Mobile and Tablet

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-50 | On phones and tablets, shortcuts follow the app grid columns (for example 3–4 columns on phone in EE). | M |
| FR-51 | Edit and delete are reachable by touch: a long-press on a tile, or a visible "Edit" toggle in the shortcut section header, reveals pencil and trash buttons overlaid on each tile. | M |
| FR-52 | Touch targets for edit/delete are at least 44×44 px. | M |
| FR-53 | Tapping a tile (outside edit mode) opens the link; edit mode prevents accidental navigation. | M |
| FR-54 | The add/edit dialog is full-screen friendly on small viewports. | S |

### 5.7 Add / Edit Dialog

| Field | Type | Rules |
| --- | --- | --- |
| Name | Char | Required, 1–60 characters |
| URL | Char | Required, validated per FR-10 to FR-12 |
| Icon | Image | Optional, per FR-20 to FR-22 |
| Open in new tab | Boolean | Default per FR-06 |

Buttons: **Save**, **Cancel**, and **Delete** (edit mode only). Inline validation messages are shown under each field. Save is disabled while the form is invalid.

---

## 6. User Stories and Acceptance Criteria

**US-01 – Create a shortcut**\
As a user, I want to add a shortcut so I can reach a page quickly.\
*Acceptance:* Given I click "+", when I enter a name and a valid URL and click Save, then a new tile appears at the end of my shortcut section immediately, without a page reload.

**US-02 – Privacy**\
As a user, I want my shortcuts to be invisible to others.\
*Acceptance:* Given users A and B, when B opens the apps menu, then none of A's shortcuts appear. When B calls the controller with an ID owned by A, then the request is rejected with an access error. This also holds for users with Administrator rights.

**US-03 – Custom icon**\
As a user, I want an icon for a shortcut so I can recognize it quickly.\
*Acceptance:* Given I upload a 2000×2000 PNG, then the stored image is 128×128 max and the tile displays it. Given I upload no icon, then a colored letter tile is shown.

**US-04 – Reorder**\
As a desktop user, I want to drag tiles to reorder.\
*Acceptance:* Given three shortcuts A, B, C, when I drag C before A, then the order becomes C, A, B, and after reload the order is still C, A, B.

**US-05 – Mobile editing**\
As a phone user, I want to edit or delete a shortcut with touch.\
*Acceptance:* Given edit mode is on, then each tile shows edit and delete buttons of at least 44 px, and tapping a tile does not navigate.

**US-06 – Internal link**\
As a user, I want to save an Odoo list view with filters as a shortcut.\
*Acceptance:* Given I paste `/web#action=...&view_type=list` , when I click the tile, then Odoo opens that view in the same tab without leaving the application.

**US-07 – Safe URLs**\
As an administrator, I want malicious URLs blocked.\
*Acceptance:* Given a URL starting with `javascript:`, when saving, then a validation error is shown and nothing is stored.

**US-08 – Visual consistency**\
As a user on Enterprise, I want shortcuts to look like native apps.\
*Acceptance:* Given the Home Menu, then shortcut tiles have identical width, gap, and column alignment to the standard app tiles below the divider.

---

## 7. UI / UX Specification

### 7.1 Layout (Enterprise Home Menu)

```
+--------------------------------------------------------------+
|  [Search apps…]                                              |
|                                                              |
|  [Shortcut 1] [Shortcut 2] [Shortcut 3] [ + ]                |
|  ------------------------------------------------------------|
|  [Discuss]  [Sales]  [Inventory]  [Accounting]  [Settings]   |
|  [ ... standard Odoo app grid ... ]                          |
+--------------------------------------------------------------+
```

### 7.2 Layout (Community Apps Dropdown)

```
+---------------------------+
| [icon] Shortcut 1         |
| [icon] Shortcut 2         |
| [ + ]  Add shortcut       |
| ------------------------- |
| [icon] Discuss            |
| [icon] Sales              |
| [icon] Settings           |
+---------------------------+
```

### 7.3 Interaction Details

- **Hover (desktop):** a small pencil and trash icon appear in the tile's top-right corner.
- **Edit mode (touch):** toggled by long-press or an "Edit" link in the section header; buttons are always visible while active; tapping outside exits edit mode.
- **Delete:** confirmation dialog "Delete this shortcut?".
- **Drag:** uses Odoo's native sortable utility; a dashed placeholder marks the drop slot.
- **Search integration (EE Home Menu):** typing in the Home Menu search also filters shortcuts by name (Should).
- **Keyboard:** tiles are focusable, Enter opens, and the edit dialog is reachable with Tab; ARIA labels on buttons.

### 7.4 Styling Rules

- Use SCSS with Odoo variables (`$o-...`) and CSS custom properties; no hard-coded colors except the generated fallback tile palette.
- The divider uses `border-top: 1px solid var(--border-color)` with vertical margins equal to the grid gap.
- Class prefix: `o_pas_` to avoid collisions.

---

## 8. Security Requirements

| ID | Requirement |
| --- | --- |
| SEC-01 | Model `personal.app.shortcut` has ACL for `base.group_user` with read/write/create/unlink. No access for portal or public. |
| SEC-02 | Record rule (global, applies to `base.group_user`): domain `[('user_id', '=', user.id)]` for all operations. Administrators are not exempted from the rule (superuser/sudo internal calls aside). |
| SEC-03 | Controllers re-check ownership explicitly and never trust IDs sent by the client; `user_id` is always forced to `request.env.user` on create and is not writable afterwards. |
| SEC-04 | All controller routes use `auth='user'`, `type='json'`, and CSRF protection default. |
| SEC-05 | URL validation on the server (whitelist: `http`, `https`, relative paths starting with `/` and not `//`). |
| SEC-06 | Name is stored as plain text and rendered through OWL escaping; no `t-raw`/`markup` for user content. |
| SEC-07 | Icon uploads: MIME/type verification, size limit, SVG sanitization (strip scripts) or SVG converted to PNG. |
| SEC-08 | External links carry `rel="noopener noreferrer"`. |
| SEC-09 | Rate/limit protection: maximum shortcuts per user (FR-05). |
| SEC-10 | When a user is deleted or archived, their shortcuts are deleted (`ondelete='cascade'`). |

---

## 9. Technical Design

### 9.1 Module Structure

```
personal_apps_shortcuts/
├── __init__.py
├── __manifest__.py
├── LICENSE                      # OPL-1 text
├── controllers/
│   ├── __init__.py
│   └── main.py
├── models/
│   ├── __init__.py
│   ├── personal_app_shortcut.py
│   └── res_users.py              # minimal-mode preference
├── security/
│   ├── ir.model.access.csv
│   └── security.xml
├── views/
│   ├── personal_app_shortcut_views.xml   # technical admin view (optional)
│   └── res_users_views.xml
├── static/
│   ├── description/
│   │   ├── icon.png
│   │   ├── index.html
│   │   └── banner.png
│   └── src/
│       ├── js/
│       │   ├── shortcut_service.js
│       │   ├── shortcut_section.js
│       │   ├── shortcut_dialog.js
│       │   ├── apps_menu_patch.js      # CE patch
│       │   └── home_menu_patch.js      # EE patch, lazy-loaded
│       ├── xml/
│       │   ├── shortcut_section.xml
│       │   └── shortcut_dialog.xml
│       └── scss/
│           └── shortcuts.scss
├── i18n/
│   ├── personal_apps_shortcuts.pot
│   └── id.po
└── tests/
    ├── test_security.py
    ├── test_url_validation.py
    └── test_tours.js
```

### 9.2 Manifest (core module)

```python
{
    'name': 'Personal Apps Shortcuts',
    'version': '17.0.1.0.0',
    'category': 'Productivity',
    'summary': 'Private, per-user shortcuts with icons and drag & drop on the Odoo apps menu',
    'description': 'Every user manages their own shortcuts to external sites or internal Odoo pages.',
    'author': 'Your Company',
    'website': 'https://your-website.example',
    'license': 'OPL-1',
    'price': 10.00,
    'currency': 'USD',
    'depends': ['web'],
    'data': [
        'security/ir.model.access.csv',
        'security/security.xml',
        'views/personal_app_shortcut_views.xml',
        'views/res_users_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'personal_apps_shortcuts/static/src/scss/shortcuts.scss',
            'personal_apps_shortcuts/static/src/js/**/*.js',
            'personal_apps_shortcuts/static/src/xml/**/*.xml',
        ],
    },
    'images': ['static/description/banner.png'],
    'application': False,
    'installable': True,
    'auto_install': False,
}
```

### 9.3 Data Model: `personal.app.shortcut`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | Char, required | 1–60 chars |
| `url` | Char, required | Validated by `@api.constrains` |
| `icon` | Image (`fields.Image`, `max_width=128`, `max_height=128`, attachment=True) | Optional |
| `sequence` | Integer, default 10 | Ordering; model `_order = 'sequence, id'` |
| `user_id` | Many2one `res.users`, required, `ondelete='cascade'`, index=True, default current user, `readonly` after creation | Owner |
| `new_tab` | Boolean | Open in new tab |
| `active` | Boolean, default True | Reserved for future archive |

SQL constraints: none required. Python constraints: URL scheme validation, per-user maximum count.

**User preference:** boolean field `pas_minimal_mode` on `res.users` (default False), self-writable and shown in My Preferences. It drives FR-49.

### 9.4 Controller Endpoints (JSON, `auth='user'`)

| Route | Purpose | Checks |
| --- | --- | --- |
| `/personal_apps_shortcuts/list` | Return the current user's shortcuts (id, name, url, new\_tab, icon URL or flag, sequence) | Domain forced to current user |
| `/personal_apps_shortcuts/create` | Create a shortcut | Validate payload, force `user_id`, enforce limit |
| `/personal_apps_shortcuts/write` | Update a shortcut | Ownership check, field whitelist |
| `/personal_apps_shortcuts/delete` | Delete a shortcut | Ownership check |
| `/personal_apps_shortcuts/reorder` | Persist new order (list of IDs) | Ignore IDs not owned |

Icons are served through the standard `/web/image/personal.app.shortcut/<id>/icon` route; access is restricted by the same record rule.

### 9.5 Frontend Architecture (OWL 2)

- **`shortcut_service`**: registered in the `services` registry; loads shortcuts once per session, exposes `list`, `create`, `update`, `remove`, `reorder`, with reactive state.
- **`ShortcutSection` component**: renders tiles, divider, and the "+" tile; handles edit mode and drag and drop via `useSortable` (`@web/core/utils/sortable_owl`).
- **`ShortcutDialog` component**: add/edit dialog based on the Odoo `Dialog` component.
- **CE patch:** patches the navbar `AppsMenu` dropdown template to inject `ShortcutSection` above the app list.
- **EE patch (lazy-loaded):** patches `HomeMenu` to inject `ShortcutSection` above the app grid, reusing the grid's CSS classes and column logic. It is applied only when the Enterprise Home Menu exists at runtime, so CE databases never fail on a missing module.
- Mobile detection through `ui.isSmall` from the UI service.

### 9.6 Compatibility

- Odoo 17.0 latest stable build (CE and EE), PostgreSQL 12+, Python 3.10+.
- Browsers: latest Chrome, Edge, Firefox, Safari (desktop and iOS), Chrome Android.
- Coexists with other web client customizations; patches use `patch()` with `super` calls and avoid replacing templates wholesale (use `t-inherit` with XPath).
- Odoo.sh, on-premise, and Odoo Online are supported. Note that Odoo Online does not allow custom modules; the module targets Odoo.sh and on-premise.

---

## 10. Non-Functional Requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-01 | Performance | Shortcut list loads in a single RPC at web client start (< 100 ms server time for 40 items) and does not block the menu rendering. |
| NFR-02 | Performance | Icons use cache-friendly image URLs with a `unique` checksum parameter. |
| NFR-03 | Reliability | Failed RPC calls show a notification and roll back the optimistic UI update. |
| NFR-04 | Accessibility | Keyboard accessible, ARIA labels, sufficient color contrast (WCAG AA). |
| NFR-05 | Localization | All strings translatable via `_t` / `_()`; RTL supported; English and Indonesian (id) translations shipped. |
| NFR-06 | Maintainability | PEP8 / OCA-style Python, ESLint-clean JS, docstrings on public methods. |
| NFR-07 | Upgrade safety | No overridden core methods (one added preference field on res.users); data is isolated in its own table; uninstall removes the table cleanly. |
| NFR-08 | Privacy | No external calls, no telemetry, no third-party libraries. |

---

## 11. Testing Plan

| Area | Tests |
| --- | --- |
| Security (Python `TransactionCase`) | User A cannot read, write, or delete B's shortcut, including via controller methods; admin is also restricted; `user_id` cannot be changed. |
| URL validation | Accept `https://a.com`, `/web#...`; reject `javascript:alert(1)`, `//evil.com`, `data:text/html,...`. |
| Limits | Creating the 41st shortcut raises a validation error. |
| Tours (Odoo JS tours) | Create, edit, delete, and reorder a shortcut in CE and in EE. |
| Visual QA (manual) | Alignment against native grid at breakpoints: ≥1200, 992, 768, 576, 375 px; dark mode; RTL. |
| Devices | iPhone Safari, Android Chrome, iPad, desktop Chrome/Firefox/Edge. |
| Install/uninstall | Fresh install, upgrade, uninstall with and without data; CE database and EE database. |

**Definition of Done:** all Must requirements implemented, test suite green on both editions, no console errors, OPL-1 license file included, translation template generated, Apps Store assets prepared.

---

## 12. Licensing, Pricing, and Distribution

### 12.1 License: OPL-1

- The manifest declares `'license': 'OPL-1'` and the package includes the full OPL-1 text in a `LICENSE` file.
- OPL-1 permits use by the purchasing customer and requires a license per Odoo database/company as defined in the OPL-1 terms; redistribution and resale are not permitted. Final legal wording of the Apps Store listing should be reviewed by the publisher.
- Each source file header should carry a short notice, for example: `# Part of <Your Company>. See LICENSE file for full copyright and licensing details.`

### 12.2 Pricing

- **List price:** USD 10.00, one-time purchase, with no guaranteed update period: updates are planned, but they are neither a priority nor an obligation of the developer.
- The price covers both CE and EE support in a single module (single listing).
- Odoo Apps Store takes a revenue commission; net revenue per sale should be calculated before final pricing is confirmed.

### 12.3 Distribution and Support

- Channel: Odoo Apps Store (apps.odoo.com), with optional direct sale.
- Listing assets: icon, banner (1:3 ratio recommended), 4–6 screenshots (CE dropdown, EE Home Menu, edit dialog, drag and drop, mobile), and a short demo GIF.
- Support: best-effort support via email/Apps Store contact, with no guaranteed response time; custom work is billed separately.
- Listing copy follows the feature headings: Shortcuts for Every User, Custom Icons & URLs, Drag & Drop Reordering, Mobile Responsive, Native Dashboard Layout, Secure by Default.

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Odoo 17 minor updates change `AppsMenu` or `HomeMenu` templates | Shortcut section breaks or misaligns | Use narrow XPath/patch points; automated tour in CI; pin tested build in the listing |
| Conflict with other modules patching the same components | Visual or functional issues | Use `patch()` with `super`; unique class names; compatibility notes in documentation |
| EE theme differences (dark mode, custom branding) | Poor contrast | Use Odoo CSS variables only |
| Malicious SVG or URL input | XSS | Server validation, SVG sanitization, OWL escaping |
| Low price point vs. support load | Poor margin | Self-explanatory UI, concise documentation, FAQ in listing |

---

## 14. Roadmap

| Version | Scope |
| --- | --- |
| 17.0.1.0.0 | All Must and Should items in this document |
| 17.0.1.1.0 | "Add current page as shortcut" button in the navbar, import/export (JSON), shortcut search in CE dropdown |
| 17.0.2.0.0 (candidate) | Optional admin-pushed default shortcuts per group, shortcut groups/folders |

---

## 15. Decisions

1. **Max shortcuts per user:** stays a system parameter only (`personal_apps_shortcuts.max_per_user`, default 40) and is not exposed in Settings.
2. **Enterprise support:** no separate bridge module. The core module detects Enterprise at runtime and lazy-loads the Home Menu patch (Sections 4 and 9.5).
3. **Updates:** no one-year commitment. Updates are intended but are neither a priority nor an obligation of the developer; the Apps Store listing must say so clearly (Section 12.2).
4. **"+ Add shortcut" tile:** can be hidden through a per-user Minimal mode preference that gives a minimalist dashboard (FR-49).
5. **Translations:** English (base) and Indonesian (id).

---

## 16. Glossary

| Term | Meaning |
| --- | --- |
| CE | Odoo Community Edition |
| EE | Odoo Enterprise Edition |
| Home Menu | Enterprise full-screen app grid |
| Apps Menu | Community dropdown menu in the navbar |
| OPL-1 | Odoo Proprietary License v1.0 |
| OWL | Odoo Web Library, the JS framework used by the Odoo 17 web client |
| Record rule | Odoo record-level access restriction (`ir.rule`) |
