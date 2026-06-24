const DEFAULT_CAPACITY = 10;

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  assertInteger(value, label);
  if (value <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  assertInteger(value, label);
  if (value < 0) {
    throw new Error(`${label} must be greater than or equal to 0`);
  }
}

function formatCohorts(cohorts: readonly number[]): string {
  return JSON.stringify(cohorts);
}

function logState(action: string, cohorts: readonly number[]): void {
  const total = cohorts.reduce((sum, count) => sum + count, 0);
  console.log(
    `[WaitingList] ${action} → ${formatCohorts(cohorts)} (total: ${total})`,
  );
}

// Waiting list for onboarding course creators into fixed-capacity cohorts
export class WaitingList {
  private readonly capacity: number;
  private cohorts: number[] = [];

  constructor(capacity: number = DEFAULT_CAPACITY) {
    assertPositiveInteger(capacity, "capacity");
    this.capacity = capacity;
    logState(`created (capacity: ${capacity})`, this.cohorts);
  }

  // Add creators to the waiting list
  add(count: number): void {
    assertNonNegativeInteger(count, "count");
    if (count === 0) {
      return;
    }

    let remaining = count;

    // Fill the newest non-full cohort first
    if (this.cohorts.length > 0 && this.cohorts[0] < this.capacity) {
      const space = this.capacity - this.cohorts[0];
      const toAdd = Math.min(space, remaining);
      this.cohorts[0] += toAdd;
      remaining -= toAdd;
    }

    // Create new cohorts on the left when needed
    while (remaining > 0) {
      const toAdd = Math.min(this.capacity, remaining);
      this.cohorts.unshift(toAdd);
      remaining -= toAdd;
    }

    logState(`add(${count})`, this.cohorts);
  }

  // Remove creators FIFO from the oldest cohorts
  take(count: number): number {
    assertNonNegativeInteger(count, "count");
    if (count === 0) {
      return 0;
    }

    let remaining = count;
    let taken = 0;

    while (remaining > 0 && this.cohorts.length > 0) {
      const lastIndex = this.cohorts.length - 1;
      const oldestCount = this.cohorts[lastIndex];
      const toTake = Math.min(remaining, oldestCount);

      taken += toTake;
      remaining -= toTake;

      const newCount = oldestCount - toTake;
      if (newCount === 0) {
        this.cohorts.pop();
      } else {
        this.cohorts[lastIndex] = newCount;
      }
    }

    logState(`take(${count}), removed ${taken}`, this.cohorts);
    return taken;
  }

  // Total number of creators currently waiting
  total(): number {
    return this.cohorts.reduce((sum, count) => sum + count, 0);
  }

  // Current cohort snapshot
  getCohorts(): readonly number[] {
    return [...this.cohorts];
  }

  getCapacity(): number {
    return this.capacity;
  }
}
