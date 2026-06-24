import { type FormEvent, useState } from "react";
import { WaitingList } from "../domain/WaitingList";

function parseCount(value: string): number {
  const parsed = Number(value);
  if (value.trim() === "" || Number.isNaN(parsed)) {
    throw new Error("Enter a valid number");
  }
  return parsed;
}

export function WaitingListView() {
  const [capacityInput, setCapacityInput] = useState("10");
  const [waitingList, setWaitingList] = useState<WaitingList | null>(null);
  const [addInput, setAddInput] = useState("");
  const [takeInput, setTakeInput] = useState("");
  const [lastTaken, setLastTaken] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = () => setVersion((current) => current + 1);

  const handleCreate = (event?: FormEvent) => {
    event?.preventDefault();
    try {
      const capacity = parseCount(capacityInput);
      setWaitingList(new WaitingList(capacity));
      setLastTaken(null);
      setError(null);
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid capacity");
    }
  };

  const handleAdd = (event?: FormEvent) => {
    event?.preventDefault();
    if (!waitingList) {
      setError("Create a waiting list first");
      return;
    }

    try {
      const count = parseCount(addInput);
      waitingList.add(count);
      setAddInput("");
      setLastTaken(null);
      setError(null);
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid add count");
    }
  };

  const handleTake = (event?: FormEvent) => {
    event?.preventDefault();
    if (!waitingList) {
      setError("Create a waiting list first");
      return;
    }

    try {
      const count = parseCount(takeInput);
      const taken = waitingList.take(count);
      setTakeInput("");
      setLastTaken(taken);
      setError(null);
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid take count");
    }
  };

  const handleClear = () => {
    setWaitingList(null);
    setCapacityInput("10");
    setAddInput("");
    setTakeInput("");
    setLastTaken(null);
    setError(null);
    refresh();
  };

  const cohorts = waitingList?.getCohorts() ?? [];
  const total = waitingList?.total() ?? 0;
  const capacity = waitingList?.getCapacity();
  void version;

  return (
    <main className="app">
      <header className="header">
        <div className="header-row">
          <div>
            <span className="header-badge">Creator onboarding</span>
            <h1>Waiting List</h1>
          </div>
          {waitingList && (
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
            >
              Clear & start over
            </button>
          )}
        </div>
        <p className="subtitle">
          Manage fixed-capacity cohorts. Newest on the left, oldest on the
          right — creators are served FIFO from the right.
        </p>
      </header>

      <section className="panel">
        <h2>Setup</h2>
        <form className="row" onSubmit={handleCreate}>
          <label htmlFor="capacity">Cohort capacity</label>
          <input
            id="capacity"
            type="number"
            min="1"
            step="1"
            value={capacityInput}
            onChange={(event) => setCapacityInput(event.target.value)}
            disabled={waitingList !== null}
            placeholder="10"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={waitingList !== null}
          >
            {waitingList ? "List created" : "Create waiting list"}
          </button>
        </form>
      </section>

      {waitingList && (
        <>
          <section className="panel panel--highlight">
            <h2>Current state</h2>

            <div className="stats">
              <div className="stat">
                <span className="stat-label">Capacity</span>
                <span className="stat-value">{capacity}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total waiting</span>
                <span className="stat-value stat-value--accent">{total}</span>
              </div>
              {lastTaken !== null && (
                <div className="stat">
                  <span className="stat-label">Last take</span>
                  <span className="stat-value stat-value--success">
                    {lastTaken}
                  </span>
                </div>
              )}
            </div>

            <div className="cohorts">
              <div className="cohorts-header">
                <span className="cohorts-label">Cohorts</span>
                <span className="flow-hint">
                  <span className="flow-arrow">←</span>
                  newest
                  <span className="flow-arrow">·</span>
                  oldest
                  <span className="flow-arrow">→</span>
                  FIFO
                </span>
              </div>

              {cohorts.length === 0 ? (
                <div className="empty-state">No creators waiting yet</div>
              ) : (
                <div className="cohort-track">
                  {cohorts.map((count, index) => {
                    const isOldest = index === cohorts.length - 1;
                    const fillPercent = Math.round((count / capacity!) * 100);

                    return (
                      <div
                        key={`${index}-${count}-${version}`}
                        className={`cohort${isOldest ? " cohort--oldest" : ""}`}
                      >
                        <span className="cohort-index">
                          {isOldest ? "Next out" : `Cohort ${index + 1}`}
                        </span>
                        <span className="cohort-count">{count}</span>
                        <span className="cohort-capacity">of {capacity}</span>
                        <div className="cohort-bar" aria-hidden="true">
                          <div
                            className="cohort-bar-fill"
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <div className="actions">
            <section className="panel action-panel">
              <h2>Add creators</h2>
              <form className="row" onSubmit={handleAdd}>
                <label htmlFor="add-count">Number to add</label>
                <input
                  id="add-count"
                  type="number"
                  min="0"
                  step="1"
                  value={addInput}
                  onChange={(event) => setAddInput(event.target.value)}
                  placeholder="0"
                />
                <button type="submit" className="btn-primary">
                  Add to list
                </button>
              </form>
            </section>

            <section className="panel action-panel">
              <h2>Take creators</h2>
              <form className="row" onSubmit={handleTake}>
                <label htmlFor="take-count">Number to take (FIFO)</label>
                <input
                  id="take-count"
                  type="number"
                  min="0"
                  step="1"
                  value={takeInput}
                  onChange={(event) => setTakeInput(event.target.value)}
                  placeholder="0"
                />
                <button type="submit" className="btn-success">
                  Take from list
                </button>
              </form>
            </section>
          </div>
        </>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon" aria-hidden="true">
            !
          </span>
          <span>{error}</span>
        </div>
      )}
    </main>
  );
}
