

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

## Console Output

Every operation logs the current cohort array to the browser DevTools console. The array matches the internal data structure: **newest cohort on the left**, **oldest on the right**.

Open DevTools while using the app (`F12` or `Cmd+Option+I` on macOS) and watch the **Console** tab.

Example session (capacity `10`, full prompt scenario):

```text
[WaitingList] created (capacity: 10) → [] (total: 0)
[WaitingList] add(3) → [3] (total: 3)
[WaitingList] add(13) → [6, 10] (total: 16)
[WaitingList] add(22) → [8, 10, 10, 10] (total: 38)
[WaitingList] take(4), removed 4 → [8, 10, 10, 6] (total: 34)
[WaitingList] take(7), removed 7 → [8, 10, 9] (total: 27)
[WaitingList] take(20), removed 20 → [7] (total: 7)
[WaitingList] cleared → [] (total: 0)
```

Reading `[8, 10, 10, 6]`:

- `8` — newest cohort (left)
- `6` — oldest cohort (right); creators are taken from here first (FIFO)

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
