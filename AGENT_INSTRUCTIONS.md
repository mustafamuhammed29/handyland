# HandyLand — AI Agent Engineering Instructions & Rules

> **Target Audience**: Future AI Coding Agents & Automated PR Systems  
> **Authority**: Mandatory policy for all code modifications, refactors, and test executions.  
> **Zero Assumption Rule**: Never assume implementation details from previous markdown documents. Verify every fact against the codebase first.

---

## 1. Security Red Flags (Known Hazards to Watch)

### Red Flag 1: Permissive CORS Subdomain Matching
- **Source Location**: `[backend/config/security.js:85]`, `[backend/utils/socket.js:28]`
- **Implementation**:
  ```javascript
  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
  }
  ```
- **Security Assessment**: Wildcard subdomain matching expands the set of credentialed cross-origin origins to any domain under `*.vercel.app` and `*.onrender.com`. Exploitability depends on the configured authentication transport, cookie attributes, and credentials behavior:
  - **Frontend User Session (`accessToken`)**: Issued with `sameSite: 'none'`, `secure: true`, `httpOnly: true` in production `[backend/controllers/authController.js:18]`. Because `credentials: true` is allowed for all `*.vercel.app` origins, an application hosted on an arbitrary `.vercel.app` subdomain could make credentialed preflighted requests with custom headers (`x-app-type: frontend`) and access protected user endpoints.
  - **Admin Session (`adminToken`)**: Issued with `sameSite: 'strict'` in production `[backend/controllers/authController.js:18]`. Browsers do not attach `sameSite: 'strict'` cookies to cross-origin requests, protecting the admin session cookie from cross-subdomain ambient leakage.
- **Agent Rule**: Do not expand this wildcard match. Future modifications should narrow CORS to explicit allowed origins defined in `process.env.ALLOWED_ORIGINS`.

---

### Red Flag 2: CSRF Route Bypasses
- **Source Location**: `[backend/middleware/csrf.js:16]`
- **Bypassed Routes**:
  - `/api/payment/webhook` (Stripe webhook)
  - `/api/translations/missing` (Missing translation key auto-collection)
- **Security Assessment**:
  - `/api/payment/webhook`: Exempt from CSRF checks. Safe against cross-site forgery because it requires cryptographic verification via `stripe.webhooks.constructEvent(req.body, sig, webhookSecret)` `[backend/controllers/paymentController.js:59]`. Requests without a valid HMAC signature are rejected with HTTP 400.
  - `/api/translations/missing`: Exempt from CSRF checks and unauthenticated. Only appends missing translation keys to the dictionary.
- **Agent Rule**: Never add additional route bypasses to `csrfProtection` without cryptographic signature verification.

---

### Red Flag 3: Custom Header Trust Model for CSRF
- **Source Location**: `[backend/middleware/csrf.js:35-47]`
- **Trust Model Implementation**:
  ```javascript
  const hasTrustedCustomHeader = 
      (appTypeHeader && (appTypeHeader === 'frontend' || appTypeHeader === 'admin')) ||
      (requestedWith && requestedWith.toLowerCase() === 'xmlhttprequest') ||
      (authHeader && authHeader.startsWith('Bearer ')) ||
      (cookieToken && headerToken && cookieToken === headerToken);
  ```
- **Security Assessment**: Traditional double-submit cookie verification was supplemented with custom header checking due to third-party cookie restrictions across separate hosting domains. Simple HTML form submissions cannot attach custom headers (`x-app-type`, `x-requested-with`) without CORS preflight. However, because CORS permits any `*.vercel.app` origin with credentials, preflighted JavaScript `fetch` requests from rogue Vercel subdomains can set `x-app-type: frontend` and pass CSRF checks.
- **Agent Rule**: When designing new authenticated state-changing actions, prefer explicit Authorization Bearer tokens over ambient cookie credentials.

---

## 2. Core Operational Rules for AI Agents

### Rule A: Guard Background Services Against Test Environments
- **Source Reference**: `[backend/server.js:137-141]`, `[backend/services/cronService.js:135-146]`
- **Mandate**: Never invoke Socket.IO server initialization or cron scheduling unconditionally in module load scope.
- **Required Implementation**:
  ```javascript
  if (process.env.NODE_ENV !== 'test') {
      initSocket(server);
      initCronJobs();
  }
  ```
- **Teardown Requirement**: Any service managing timers (`node-cron`, `setInterval`), child processes, or network sockets must export a clean termination function (e.g., `stopCronJobs()`, `closeSocket()`) hooked into `[backend/tests/setup.js:66-101]` in an `afterAll()` block.

---

### Rule B: Mandatory Local Test Execution with Handle Detection
- **Source Reference**: `[backend/package.json:9]`
- **Mandate**: Run the test suite before submitting any code changes:
  ```bash
  npm test -- --detectOpenHandles
  ```
  *(run within the `backend/` directory)*
- **Acceptance Criteria**:
  - Exit code `0` (all test suites pass).
  - Clean termination in under 15 seconds.
  - Zero open handle warnings reported by Jest.
  - Do NOT rely on `--forceExit` alone; real lingering handles must be identified and resolved.

---

### Rule C: Codebase & CI Logs Are Ground Truth (Zero Markdown Trust)
- **Mandate**: Do not treat `.md` files as factual documentation without verifying against actual source code and line numbers.
- **Verification Protocol**:
  1. **Endpoints**: Check `[backend/routes/*.js]` and matching controller implementations in `[backend/controllers/*.js]`.
  2. **Dependencies**: Grep the codebase to verify imports before documenting packages as active `[backend/package.json:22-57]`.
  3. **Coverage Metrics**: Run `npx jest --coverage` to extract verified numbers from `[backend/coverage/coverage-final.json]`.
  4. Any assertion lacking a source code citation must be explicitly labeled `UNVERIFIED — NEEDS CONFIRMATION`.

---

### Rule D: Security Changes Require Written Justification
- **Scope**: Modifications to `[backend/config/security.js]`, `[backend/middleware/csrf.js]`, `[backend/middleware/auth.js]`, or `[supabase/migrations]`.
- **Mandate**: Provide a security rationale in the commit message and PR description explaining how cross-origin credential leakage, privilege escalation, and CSRF vulnerabilities are prevented.

---

### Rule E: Immediate Synchronization of API Documentation
- **Mandate**: Every endpoint added, modified, or removed in `[backend/routes/]` must be updated in `[API_DOCUMENTATION.md]` within the same commit.
- **Required Format**:
  `| HTTP Method | Endpoint | Auth Middleware Applied | Purpose (Controller Verified) |`

---

### Rule F: Falsifiable Terminology Only (No Marketing Fluff)
- **Mandate**: Avoid vague adjectives like "production-ready", "enterprise-grade", "bulletproof", or "fully tested" unless backed by a specific metric (e.g. `[Jest test run: 6/6 suites passed in 4.431s, 2026-08-26]`).
