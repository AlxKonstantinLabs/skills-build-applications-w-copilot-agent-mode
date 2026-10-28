# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep UI behavior thin and route-based: each feature page reads from the shared API client, renders loading/empty/success/error states, and uses Bootstrap markup plus accessible roles so test expectations match user-facing behavior.
- Logic tier decision: Centralize request validation and business rules in Express service functions invoked by `/api` routes. Convert Mongoose cast/validation problems into deliberate 4xx responses instead of unhandled 500s, with a single error-handling middleware for consistent API failures.
- Data tier decision: Use Mongoose schemas for user, team, activity, and workout models with required fields, typed references, and defaults (for example, an empty `members` array on teams). Seed data should be idempotent and reconcile demo-user team membership when a seeded fixture moves between teams.
- Activity tracking approach: Validate `userId`, `teamId`, `type`, and `minutes` before creating records; reject bad IDs with 4xx; store the original refs plus computed `points` and `occurredAt` fields to satisfy the contract.
- Team management approach: Require a non-empty team name and mascot on create, accept an optional member list, and keep team memberships in the array as Mongoose ObjectIds while exposing them through the API as normalized IDs.
- Leaderboard approach: Aggregate activity points by team, sort descending by total points, and assign a 1-based rank to each row as part of the leaderboard response.
- Workout suggestions approach: Look up the user by email, inspect recent activity patterns or the user's fitness goal, choose the highest-match workout focus, and return a reason string that explains the recommendation while still returning a clean 4xx for missing users.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - This checks the schema and seed contract: if it fails, the issue is usually in the Mongoose models or idempotent seed logic, not the API routes.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - This checks route behavior and service logic: failures usually mean bad validation, incorrect status codes, missing leaderboard aggregation, or workout suggestion matching.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - This checks the user-facing app behavior: failures typically mean missing loading states, empty-state messaging, accessible alerts, or incorrect fetch usage in route components.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - This validates TypeScript compilation for the Node/Express backend; a failure suggests a type mismatch or missing exports in the service/model layer.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - This validates the React/Vite app compiles cleanly; a failure points to type or JSX issues after implementing the route and component logic.
