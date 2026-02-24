const CHANNEL = "pupoo_auth_events";

export function broadcastLogout() {
  window.localStorage.setItem(CHANNEL, String(Date.now()));
}

export function onLogout(listener) {
  const handler = (e) => {
    if (e.key === CHANNEL) listener();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
