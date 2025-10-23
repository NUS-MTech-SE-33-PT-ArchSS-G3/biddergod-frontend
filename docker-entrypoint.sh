#!/bin/sh
set -e

# Create runtime config file with environment variables
# This file will be served as /config.js and loaded by the app at runtime
cat > /usr/share/nginx/html/config.js << CONFIGEOF
window._env_ = {
  VITE_API_GATEWAY_URL: "${VITE_API_GATEWAY_URL:-http://kong.biddergod-dev.local:8000}"
};
CONFIGEOF

echo "Runtime configuration created with:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec "$@"
