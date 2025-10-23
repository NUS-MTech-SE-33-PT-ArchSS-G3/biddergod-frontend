// Runtime configuration
// This file is overwritten by docker-entrypoint.sh in container deployments
// For local development, this stub file allows the app to load without errors
window._env_ = {
  VITE_API_GATEWAY_URL: undefined // Will fallback to import.meta.env or localhost
};
