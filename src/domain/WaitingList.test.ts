import { describe, expect, it } from "vitest";
import { WaitingList } from "./WaitingList";

function assertInvariants(list: WaitingList): void {
  const capacity = list.getCapacity();
  const cohorts = list.getCohorts();

  expect(cohorts.every((c) => c > 0 && c <= capacity)).toBe(true);
  expect(list.total()).toBe(cohorts.reduce((sum, c) => sum + c, 0));
}

describe("WaitingList", () => {
  describe("constructor", () => {
    it("defaults capacity to 10 when omitted", () => {
      const list = new WaitingList();
      expect(list.getCapacity()).toBe(10);
      expect(list.getCohorts()).toEqual([]);
      expect(list.total()).toBe(0);
    });

    it("accepts capacity of 1", () => {
      const list = new WaitingList(1);
      expect(list.getCapacity()).toBe(1);
      list.add(3);
      expect(list.getCohorts()).toEqual([1, 1, 1]);
      assertInvariants(list);
    });

    it("rejects capacity of 0", () => {
      expect(() => new WaitingList(0)).toThrow("capacity must be greater than 0");
    });

    it("rejects negative capacity", () => {
      expect(() => new WaitingList(-1)).toThrow("capacity must be greater than 0");
    });

    it("rejects decimal capacity", () => {
      expect(() => new WaitingList(1.5)).toThrow("capacity must be an integer");
    });

    it("rejects Infinity capacity", () => {
      expect(() => new WaitingList(Infinity)).toThrow("capacity must be an integer");
    });

    it("rejects NaN capacity", () => {
      expect(() => new WaitingList(NaN)).toThrow("capacity must be an integer");
    });
  });

  describe("add", () => {
    it("is a no-op for add(0)", () => {
      const list = new WaitingList();
      list.add(5);
      list.add(0);
      expect(list.getCohorts()).toEqual([5]);
      assertInvariants(list);
    });

    it("rejects negative add", () => {
      const list = new WaitingList();
      expect(() => list.add(-1)).toThrow("count must be greater than or equal to 0");
    });

    it("rejects decimal add", () => {
      const list = new WaitingList();
      expect(() => list.add(1.5)).toThrow("count must be an integer");
    });

    it("rejects NaN add", () => {
      const list = new WaitingList();
      expect(() => list.add(NaN)).toThrow("count must be an integer");
    });

    it("rejects Infinity add", () => {
      const list = new WaitingList();
      expect(() => list.add(Infinity)).toThrow("count must be an integer");
    });

    it("adds exactly capacity into a single cohort", () => {
      const list = new WaitingList(10);
      list.add(10);
      expect(list.getCohorts()).toEqual([10]);
      assertInvariants(list);
    });

    it("creates multiple cohorts when adding more than capacity", () => {
      const list = new WaitingList(10);
      list.add(25);
      expect(list.getCohorts()).toEqual([5, 10, 10]);
      expect(list.total()).toBe(25);
      assertInvariants(list);
    });

    it("fills the newest partial cohort before creating new ones", () => {
      const list = new WaitingList(10);
      list.add(7);
      list.add(2);
      expect(list.getCohorts()).toEqual([9]);
      assertInvariants(list);
    });

    it("creates a new cohort when the newest is already full", () => {
      const list = new WaitingList(10);
      list.add(10);
      list.add(5);
      expect(list.getCohorts()).toEqual([5, 10]);
      assertInvariants(list);
    });

    it("handles very large add counts without stack issues", () => {
      const list = new WaitingList(10);
      list.add(100_000);
      expect(list.total()).toBe(100_000);
      expect(list.getCohorts().length).toBe(10_000);
      assertInvariants(list);
    });
  });

  describe("take", () => {
    it("returns 0 and is a no-op for take(0)", () => {
      const list = new WaitingList();
      list.add(5);
      const taken = list.take(0);
      expect(taken).toBe(0);
      expect(list.getCohorts()).toEqual([5]);
      assertInvariants(list);
    });

    it("rejects negative take", () => {
      const list = new WaitingList();
      expect(() => list.take(-1)).toThrow("count must be greater than or equal to 0");
    });

    it("rejects decimal take", () => {
      const list = new WaitingList();
      expect(() => list.take(2.5)).toThrow("count must be an integer");
    });

    it("rejects NaN take", () => {
      const list = new WaitingList();
      expect(() => list.take(NaN)).toThrow("count must be an integer");
    });

    it("rejects Infinity take", () => {
      const list = new WaitingList();
      expect(() => list.take(Infinity)).toThrow("count must be an integer");
    });

    it("returns 0 from an empty list", () => {
      const list = new WaitingList();
      expect(list.take(5)).toBe(0);
      expect(list.getCohorts()).toEqual([]);
      assertInvariants(list);
    });

    it("removes exactly total and empties the list", () => {
      const list = new WaitingList(10);
      list.add(17);
      const taken = list.take(17);
      expect(taken).toBe(17);
      expect(list.getCohorts()).toEqual([]);
      expect(list.total()).toBe(0);
      assertInvariants(list);
    });

    it("removes all creators when taking more than total", () => {
      const list = new WaitingList(10);
      list.add(7);
      const taken = list.take(20);
      expect(taken).toBe(7);
      expect(list.getCohorts()).toEqual([]);
      expect(list.total()).toBe(0);
      assertInvariants(list);
    });

    it("removes a partial amount from the oldest cohort", () => {
      const list = new WaitingList(10);
      list.add(34);
      list.take(4);
      expect(list.getCohorts()).toEqual([4, 10, 10, 6]);
      assertInvariants(list);
    });

    it("removes multiple full cohorts from the right", () => {
      const list = new WaitingList(10);
      list.add(34);
      const taken = list.take(15);
      expect(taken).toBe(15);
      expect(list.getCohorts()).toEqual([4, 10, 5]);
      assertInvariants(list);
    });

    it("removes empty cohorts and never leaves zeros", () => {
      const list = new WaitingList(10);
      list.add(20);
      list.take(10);
      expect(list.getCohorts()).toEqual([10]);
      expect(list.getCohorts()).not.toContain(0);
      assertInvariants(list);
    });

    it("preserves FIFO across several add/take cycles", () => {
      const list = new WaitingList(10);
      list.add(15);
      list.take(5);
      list.add(8);
      list.take(12);

      expect(list.getCohorts()).toEqual([3, 3]);
      expect(list.total()).toBe(6);
      assertInvariants(list);

      const taken = list.take(3);
      expect(taken).toBe(3);
      expect(list.getCohorts()).toEqual([3]);
      assertInvariants(list);
    });
  });

  describe("state and safety", () => {
    it("returns a copy from getCohorts()", () => {
      const list = new WaitingList(10);
      list.add(12);
      const snapshot = list.getCohorts();
      expect(snapshot).toEqual([2, 10]);
      expect(snapshot).not.toBe(list.getCohorts());
    });

    it("prevents external mutation of internal cohorts", () => {
      const list = new WaitingList(10);
      list.add(12);
      const snapshot = list.getCohorts() as number[];
      snapshot[0] = 999;
      snapshot.push(888);

      expect(list.getCohorts()).toEqual([2, 10]);
      assertInvariants(list);
    });

    it("keeps total() in sync with cohort sums after every operation", () => {
      const list = new WaitingList(10);
      assertInvariants(list);

      list.add(3);
      assertInvariants(list);

      list.add(13);
      assertInvariants(list);

      list.take(4);
      assertInvariants(list);

      list.take(20);
      assertInvariants(list);
    });

    it("never allows a cohort to exceed capacity", () => {
      const list = new WaitingList(5);
      for (let i = 0; i < 20; i++) {
        list.add(i % 7);
        assertInvariants(list);
      }
    });

    it("never stores a cohort with count <= 0", () => {
      const list = new WaitingList(10);
      list.add(50);
      for (let taken = 1; taken <= 50; taken++) {
        list.take(1);
        assertInvariants(list);
      }
      expect(list.getCohorts()).toEqual([]);
    });
  });

  describe("full prompt example", () => {
    it("follows the complete add/take scenario from the spec", () => {
      const list = new WaitingList(10);

      expect(list.getCohorts()).toEqual([]);

      list.add(3);
      expect(list.getCohorts()).toEqual([3]);
      assertInvariants(list);

      list.add(13);
      expect(list.getCohorts()).toEqual([6, 10]);
      assertInvariants(list);

      list.add(22);
      expect(list.getCohorts()).toEqual([8, 10, 10, 10]);
      assertInvariants(list);

      list.take(4);
      expect(list.getCohorts()).toEqual([8, 10, 10, 6]);
      assertInvariants(list);

      list.take(7);
      expect(list.getCohorts()).toEqual([8, 10, 9]);
      assertInvariants(list);

      expect(list.total()).toBe(27);

      list.take(20);
      expect(list.getCohorts()).toEqual([7]);
      assertInvariants(list);

      expect(list.total()).toBe(7);
    });
  });
});
