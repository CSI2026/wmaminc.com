# WMAMinc Back Office Portal

Internal back-office portal for **Williams Marketing & Management Inc.** — a single-file web application for managing agents, inventory, payroll, calls, and operations across multiple lifeline carrier programs.

🌐 **Live:** [https://wmaminc.com](https://wmaminc.com)
📦 **Repo:** This repository
👤 **Owner:** Calvin Williams

---

## What it does

WMAMinc Portal is the central operations hub for a marketing & management company that runs lifeline phone, internet, and ACA enrollment campaigns through multiple carriers. The portal handles:

- **Agent management** — onboarding, profiles, role categories (Sales/IBO/Office), departments, permissions, market assignments
- **Inventory tracking** — every IMEI/SIM tracked from upload → MM assignment → agent assignment → activation, with expiry countdowns and triple-duplicate verification
- **Carrier integration** — separate inventory pipelines for Gen Mobile, Assurance, TruConnect, Excess, Chuzo, Astound, and ACA
- **Payroll** — owner-gated access with named whitelist, commission rates per carrier, custom comp overrides
- **Team calls** — Daily.co video integration with branded waiting rooms, hold music, and SMS notifications via Brevo
- **Markets/Teams** — Lifeline market organization with leaders, MMs, CMs, and member rosters
- **Onboarding** — hire paperwork queue, training schedule, document collection
- **HR functions** — agent roster, recent hires, profile editing, password resets
- **Communication** — channel-based chat, announcements, mass SMS via Brevo, in-portal notifications

---

## Architecture

### Single-file design

The entire application is contained in **one** `index.html` file (~20,700 lines, ~1.4 MB). All HTML, CSS, and JavaScript are inlined. There are no build steps, no module bundlers, no compilation.

Why: portability. The portal can be hosted on any static file host (GitHub Pages, S3, Netlify, even opened from disk) without any backend deployment.

### Backend services

External services the portal talks to from the browser:

| Service | Purpose |
|---|---|
| **Supabase** | PostgreSQL database for agents, teams, channel messages, app settings, inventory sync |
| **Daily.co** | Video call rooms (5 pre-created: National, Lifeline, Internet, ACA, Office) |
| **Brevo** (Sendinblue) | SMS notifications (call-live alerts, agent invites) |
| **Pixabay CDN** | Royalty-free hold music for waiting rooms |

### Hosting

Deployed via **GitHub Pages** with custom domain `wmaminc.com`.

---

## Tech stack

- **HTML5** — document structure, modals, forms
- **Vanilla CSS** — custom design system, no framework
- **Vanilla JS (ES5+)** — no React, no build tools
- **Supabase JS SDK** — loaded from CDN
- **Daily.co JS SDK** — loaded from CDN

---

## Roles & permissions

### Three-category role model

Every agent belongs to one of three categories:

1. **🎯 Sales** — Field Agent, Team Leader, Market Manager, Campaign Manager
2. **🏢 IBO** — Independent Business Owner with their own markets
3. **💼 Office** — HR, Inventory, Payroll, Onboarding, Office Manager

### Owner

`Calvin Williams (id=1)` — sees and controls everything. Owner is the only role that can:
- Change another agent's role/category/department
- Grant Payroll Access (separate whitelist managed in Owner Panel)
- Reset role data, force role changes, permanently delete agents
- Modify deptAccess grants
- Toggle Can-Host-Call
- Access Owner Panel and Owner Control settings

### HR (K-Anna's role)

- Sees the pink HR Department dashboard with roster stats and recent hires
- Can view and edit agent profiles (name, phone, email, address, password, links, markets)
- Can add new agents (and set their initial category at creation)
- Can deactivate agents
- **Cannot** change an existing agent's role/category, grant permissions, or access Payroll without explicit grant
- Sees: HR Dashboard, Onboarding Queue, View All Agents, Manage panel

### Inventory (Makenzie's role)

- Sees the cyan Inventory Department dashboard
- Sees **all markets globally** (not just markets they're a member of)
- Sees every IMEI/SIM/device across every campaign
- Default approver for inventory transfer requests from MMs and TLs
- Can upload, assign, transfer, and request deletion of devices
- Cannot grant permissions or access Payroll

### Payroll

- Owner-only by default; Owner whitelists specific agents by name
- Whitelist managed via Owner Panel → Payroll Access Control card
- Stores: `PAYROLL_ACCESS = [agentId, agentId, ...]`

### Onboarding

- Manages new-hire paperwork, document collection, signed contracts
- Can edit agent profiles (used during onboarding)

### Sales roles

- **Field Agent** — sees own scoreboard, own inventory, own market chat
- **Team Leader** — sees their team's scoreboard, can view agents under them
- **Market Manager** — sees their market's full performance, all carriers in scope
- **Campaign Manager** — sees their entire program, cross-market

### IBO

- Independent operator with their own markets list (`agent.iboMarkets`)
- Sees only their own markets and members

---

## Data stores

### Supabase tables

- `agents` — every user record (id, name, role, programs, carrier, channels, etc.)
- `lifeline_teams` — markets (Dallas TX A, Dallas TX B, Lafayette LA, etc.)
- `team_members` — many-to-many between agents and markets
- `channel_msgs` — community/team chat messages
- `app_settings` — key/value store for everything else (inventory, settings, call states, etc.)

### `app_settings` keys (partial list)

- `inv_devices` — legacy inventory device array
- `inv_batches` — upload batches
- `inv_transfers` — transfer history
- `inv_requests` — pending inventory requests
- `gm_inventory`, `gm_activations`, `gm_transfers` — Gen Mobile-specific
- `aw_inventory`, `tc_inventory`, `ex_inventory` — Assurance, TruConnect, Excess
- `inv_markets` — per-market inventory configuration
- `payroll_access` — whitelist of agentIds
- `impersonation_grants` — temporary "view-as" permissions
- `call_<channelId>` — current call live state
- `call_alert_<channelId>` — broadcast call notifications
- `waiters_<channelId>` — current waiting room participants
- `brevo_key` — Brevo SMS API key
- `company_logo` — base64 logo data
- `wmam_programs` — programs and campaigns config

### Local storage fallback

Every Supabase-synced store also writes to `localStorage` so the app degrades gracefully when Supabase is unreachable. On page load, the portal tries Supabase first and falls back to localStorage if the request fails.

---

## Deployment

### Update workflow

1. Edit `index.html` locally (or have Claude update it)
2. Push to this GitHub repo (replace existing `index.html`)
3. Wait ~30 seconds for GitHub Pages to rebuild
4. Hard refresh: `⌘+Shift+R` on Mac, `Ctrl+Shift+R` on Windows

### Custom domain

Custom domain `wmaminc.com` is configured via the `CNAME` file in the repo. DNS A/AAAA records point at GitHub Pages.

### First-time setup

If deploying to a new environment:

1. Create a Supabase project; note the project URL and anon key
2. Update the Supabase config block near the top of `index.html` (search for `supaUrl` and `supaKey`)
3. Create the required tables: `agents`, `lifeline_teams`, `team_members`, `channel_msgs`, `app_settings`
4. Add the Brevo SMS API key to `app_settings` row with `key='brevo_key'`
5. Deploy to GitHub Pages or any static host

---

## Console diagnostic commands

Open DevTools → Console and run any of these (Owner only):

```javascript
showAgent(4)                          // Print agent record by id
fixAgent(4, 'office', 'hr')          // Force-set category + role
hardDeleteAgent(99)                   // Permanently delete an agent
revokePayrollAccess(5)                // Strip from Payroll whitelist
DB.agents.find(a=>a.username==='kanna.williams')  // Lookup by username
```

URL parameter `?debug=1` shows a yellow diagnostic banner on the dashboard with role/category routing data.

Logs are prefixed for easy filtering: `[notifyCallLive]`, `[Daily]`, `[fixAgent]`, `[saveAgentToSupabase]`, `[backfill]`, `[load]`.

---

## Inventory pipeline (the most critical system)

Every device flows through this lifecycle:

1. **Upload** — IMEIs/SIMs scanned or pasted into Inventory Hub. Status: `uploaded`. holderId: null.
2. **MM assignment** — Inventory dept assigns the batch to a Market Manager. Status: `available`. holderId: MM's id. holderName: MM's name. expiryDate set to assignedDate + 30 days.
3. **Agent assignment** — MM transfers to a TL or Field Agent. Status: `assigned`. holderId/Name updates.
4. **Activation** — Device gets activated in carrier portal. Carrier-specific store records the activation.
5. **Expiry** — If unactivated by expiryDate, device shows red EXPIRED badge and counts toward expiry alerts.

### Sync model

Inventory writes to **both** localStorage AND Supabase `app_settings` keys. On page load, Supabase is the source of truth. If Supabase has no inventory data but the local browser does, a one-time backfill pushes local data up.

### Triple-check duplicate validator

Before any device is added, three layers verify uniqueness:

1. File-level — no IMEI/SIM appears twice within the upload itself
2. Cross-campaign — IMEI/SIM doesn't already exist in ANY campaign
3. Activation-level — IMEI/SIM isn't already marked activated anywhere

---

## Notable design decisions

### Why a single file?

Portability beats modularity for a small-team internal tool. The entire app is one file you can email, archive, or rehost anywhere. No npm install, no build step, no lockfile drift.

### Why no React?

React adds a build step and forces JSX/transpilation, which would break the single-file model. Vanilla JS panels render strings into a `boBody` div — fast enough, debuggable in any browser, no framework lock-in.

### Why Supabase + localStorage fallback?

Supabase gives us multi-user data sync without a backend server. localStorage means the app keeps working when offline or when Supabase is down. Every save writes both places; loads prefer Supabase when available.

### Why Daily.co over Jitsi?

Jitsi's moderator-gating broke our use case (people couldn't join their own market calls). Daily.co's pre-created rooms with open join behavior fit our model where the host's "go live" signal comes from our portal, not the video provider.

---

## License

Proprietary. All rights reserved by Williams Marketing & Management Inc.
