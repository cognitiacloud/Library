/**
 * BUDGET WHEELS DEALEROS — traffic-desk/assignment (BUILD PACKET, V1)
 *
 * STATUS: INTERNAL — REFERENCE SCAFFOLD. NOT PRODUCTION READY.
 * No live calls, no secrets, mock-only.
 *
 * Module 4 — TMS traffic desk: deterministic round-robin lead assignment.
 * One default pool plus optional per-source override pools (e.g. phone-ups
 * go to the phone team). Each pool keeps its own cursor, so cycling is
 * deterministic and independently inspectable in tests. `skip(userId)`
 * removes a user from every pool (off shift, at lunch, etc.).
 *
 * Deliberately in-memory and synchronous: persistence, shift schedules, and
 * skill-based routing are deferred to the dedicated DealerOS repo.
 */

import type { TrafficSourceKind, UserId } from '../schemas/core';

const DEFAULT_POOL_KEY = '__default__';

interface Pool {
  userIds: UserId[];
  /** Index of the NEXT user to be assigned from this pool. */
  cursor: number;
}

/** Read-only snapshot of assigner state, for tests and manager dashboards. */
export interface RoundRobinState {
  pools: Record<string, { userIds: UserId[]; cursor: number }>;
}

export class RoundRobinAssigner {
  private readonly pools = new Map<string, Pool>();

  constructor(
    userIds: UserId[],
    perSourceOverrides?: Partial<Record<TrafficSourceKind, UserId[]>>,
  ) {
    this.pools.set(DEFAULT_POOL_KEY, { userIds: [...userIds], cursor: 0 });
    if (perSourceOverrides) {
      for (const [source, poolUserIds] of Object.entries(perSourceOverrides)) {
        if (poolUserIds) {
          this.pools.set(source, { userIds: [...poolUserIds], cursor: 0 });
        }
      }
    }
  }

  /**
   * Next assignee for a traffic event from `source`. Uses the per-source
   * override pool when one was configured, otherwise the default pool.
   * Throws when the resolved pool has no assignable users left.
   */
  next(source: TrafficSourceKind): UserId {
    const pool = this.pools.get(source) ?? this.pools.get(DEFAULT_POOL_KEY)!;
    if (pool.userIds.length === 0) {
      throw new Error(
        `assignment: no assignable users for source "${source}" — pool is empty (everyone skipped?)`,
      );
    }
    const userId = pool.userIds[pool.cursor % pool.userIds.length]!;
    pool.cursor = (pool.cursor + 1) % pool.userIds.length;
    return userId;
  }

  /**
   * Remove a user from every pool (e.g. off shift). Cursors are adjusted so
   * the remaining rotation order is preserved. No-op for unknown users.
   */
  skip(userId: UserId): void {
    for (const pool of this.pools.values()) {
      const idx = pool.userIds.indexOf(userId);
      if (idx === -1) continue;
      pool.userIds.splice(idx, 1);
      if (idx < pool.cursor) pool.cursor -= 1;
      pool.cursor = pool.userIds.length === 0 ? 0 : pool.cursor % pool.userIds.length;
    }
  }

  /** Deep-copied state snapshot; mutating it cannot affect the assigner. */
  getState(): RoundRobinState {
    const pools: RoundRobinState['pools'] = {};
    for (const [key, pool] of this.pools.entries()) {
      pools[key] = { userIds: [...pool.userIds], cursor: pool.cursor };
    }
    return { pools };
  }
}
