export const warmupBackend = () => {
    // Ping the backend silently on app load
    fetch(`/api/health`, {
      method: 'GET',
      cache: 'no-store',
    }).catch(() => {}); // ignore errors — this is just a warmup
  };
