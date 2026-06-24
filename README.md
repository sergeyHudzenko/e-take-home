

https://github.com/user-attachments/assets/51a0baa6-a2ff-4017-9460-013d3bbfbbcc

# Elective Waiting List

A front-end waiting-list system for onboarding course creators into fixed-capacity cohorts. Business rules live in a domain class; the React UI is a thin layer for viewing and interacting with the list.

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (typically `http://localhost:5173`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run preview` | Preview the production build |

## Architecture

```
src/
  domain/
    WaitingList.ts       # Core business logic
    WaitingList.test.ts  # Domain tests
  components/
    WaitingListView.tsx  # UI only — no business rules
  App.tsx
```

The `WaitingList` class is the single source of truth for cohort behavior:

- **Add** — fill the newest non-full cohort first, then create new cohorts on the left
- **Take** — remove creators FIFO from the right (oldest cohorts)
- **Total** — sum of all cohort counts
- **Cohorts** — stored as `number[]`, newest on the left

Creators are represented by the number `1`; counts are always non-negative integers.

## Performance Considerations

Cohorts are stored as a simple array because it directly matches the business model described in the requirements. Each `add` may call `unshift` on the left, and each `take` removes from the right — both are O(n) in the number of cohorts.

For extremely large waiting lists, a deque or ring-buffer approach could reduce the cost of operations on the left side. Simplicity was prioritized here because the requirements do not indicate large-scale constraints.

## AI Usage

AI was used for brainstorming edge cases and reviewing implementation decisions. Core domain logic and UI implementation were written manually. AI suggestions were reviewed and not accepted blindly. Simplicity was preferred over unnecessary abstractions.

## Testing

Domain tests cover:

- Creating a waiting list (default and custom capacity)
- Adding creators, filling cohorts, and creating new cohorts
- FIFO take behavior (partial cohort, multiple cohorts, take more than total)
- Edge cases: `add(0)`, `take(0)`, capacity of 1, empty cohort cleanup
- Validation: invalid capacity, negative counts, decimal values

Run tests with:

```bash
npm run test
```
