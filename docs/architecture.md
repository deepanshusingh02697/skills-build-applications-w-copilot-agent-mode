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

- Presentation tier decision: Keep each capability in its own React page, use the shared API client with relative `/api` paths, and show loading, data, empty, and accessible error states.
- Logic tier decision: Keep HTTP handling in Express routes and validation/business rules in the OctoFit service. Return deliberate 4xx responses for invalid inputs and unknown users.
- Data tier decision: Use Mongoose schemas with required contract fields and defaults; keep the existing upsert-based seed behavior non-destructive and idempotent.
- Activity tracking approach: Validate activity input and ObjectIds, verify the referenced user and team exist, and store the activity with points derived from minutes and the current timestamp.
- Team management approach: Validate team name and mascot, validate supplied member IDs and references, store members on the new team, and set each assigned user's team reference.
- Leaderboard approach: Aggregate activity points by team, sort totals descending, and assign ranks starting at 1.
- Workout suggestions approach: Find the user by email, consider their fitness goal and most recent activity when matching workout focus, include a recommendation reason, and return 404 for an unknown user.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — passed (5 tests); validates schemas and seed compatibility/idempotency.
- API command: `npm run test:api --prefix octofit-tracker/backend` — passed (4 tests); validates activity/team operations, leaderboard, and workout suggestions.
- Backend suite: `npm test --prefix octofit-tracker/backend` — passed (9 tests across 2 files).
- Frontend command: `npm test --prefix octofit-tracker/frontend` — passed (15 tests); validates page data rendering and loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — passed (`tsc --noEmit`).
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — passed (TypeScript check and Vite production build).
