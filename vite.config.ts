import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: true,
        port: 5173,
        watch: {
            usePolling: true,
        },
        proxy: {
            '/api': {
                target: 'http://biddergod-dev-alb-486785394.ap-southeast-1.elb.amazonaws.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    },
    plugins: [react(),tailwindcss()],
    define: {
        global: 'globalThis',
    },
    build: {
        rollupOptions: {
            onwarn(warning, warn) {
                if (warning.code === 'UNRESOLVED_IMPORT') return
                warn(warning)
            }
        }
    }
})
