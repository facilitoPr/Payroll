export const EMAIL_TIMEOUT_MS = 20000; // 20s por correo (ajusta)
export const NOTIFY_TIMEOUT_MS = 15000; // 15s por notificación
export const EMAIL_CONCURRENCY = 5; // 3-8 recomendado
export const NOTIF_CONCURRENCY = 15; // depende de tu infra

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout: ${label} (${ms}ms)`)),
      ms,
    );
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

// Concurrencia sin librerías
export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, idx: number) => Promise<void>,
) {
  const queue = items.map((item, idx) => ({ item, idx }));
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) return;
      await worker(next.item, next.idx);
    }
  });
  await Promise.allSettled(runners);
}

// Para evitar “UnhandledPromiseRejection”
export function fireAndForget(fn: () => Promise<void>) {
  setImmediate(() => {
    fn().catch((e) => console.error("[closePeriod][bg] error:", e));
  });
}
