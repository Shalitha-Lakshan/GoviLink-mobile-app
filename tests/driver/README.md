# Driver module unit tests

Run from the project root:

```powershell
npm run test:driver
```

Requires the project's dependencies (`npm install`) and Node.js 22.13 or newer.
Uses Node's built-in test runner and the Babel tooling already installed with
Expo; no new dependencies or changes to application code are required.

## Scope

- Driver-only Firebase functions: vehicle registration/editing/deletion,
  independent dispatch selections, and assignment acceptance/rejection.
- Driver dashboard: own assignments, route priority, completed filtering,
  navigation, and vehicle subscription cleanup.
- Vehicle screens: required fields, edit payloads, dispatch controls, confirmation
  before deletion, and error feedback.
- Driver view of the shared tracking screen: acceptance/rejection confirmation,
  pickup restrictions, self-contact controls, and profile photo selection.
- District labels: legacy strings, translated records and missing values.

The tests load the actual application source. Firebase, image uploads and native
APIs are mocked at import boundaries; they cannot reach real accounts, production
data, a network, or device hardware. Each test has its own state.

The component harness inspects returned React elements and invokes their handlers,
with isolated state/effect hooks. These are component-logic unit tests, not native
rendering, accessibility, security-rules or end-to-end tests. They do not verify
real Firestore transaction contention, image uploads, layout, or device permissions.
Use Expo Go/device checks separately for those behaviours.

Only this folder and the `test:driver` command in `package.json` are added by this
test setup. Existing administrator and produce tests are not run or modified.
