// Lightweight helper to retry dynamic imports which can fail with transient ChunkLoadError
export default async function retryImport(importFn, retries = 2, delay = 300) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const mod = await importFn();
      return mod;
    } catch (err) {
      // Normalize non-Error rejections so ErrorBoundary receives a proper Error
      let normalized = err;
      if (!(err instanceof Error)) {
        try {
          const json = typeof err === 'object' ? JSON.stringify(err) : String(err);
          normalized = new Error(`Dynamic import failed: ${json}`);
        } catch (e) {
          normalized = new Error('Dynamic import failed with non-Error rejection');
        }
      }

      // If not a ChunkLoadError, rethrow immediately (after normalization)
      const msg = normalized && normalized.message && String(normalized.message);
      const isChunkError = msg && (msg.includes('Loading chunk') || msg.includes('ChunkLoadError'));
      attempt += 1;
      if (!isChunkError || attempt > retries) {
        console.error('retryImport: giving up dynamic import after attempts', { attempt, err: normalized });
        throw normalized;
      }
      // Wait a bit before retrying
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, delay));
    }
  }
}
