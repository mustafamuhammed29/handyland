export const warmupBackend = () => {
    // Ping the backend silently on app load
    // so Render wakes up before the user actually needs data
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/health`, {
      method: 'GET',
      cache: 'no-store',
    }).catch(() => {}); // ignore errors — this is just a warmup
  };
