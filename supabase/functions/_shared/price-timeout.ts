/**
 * SHARED TIMEOUT UTILITY
 * Wraps any promise with a timeout race.
 */

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), ms),
    ),
  ]);
}
