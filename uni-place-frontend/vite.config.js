import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.FRONTEND_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [
      react({
        include: /\.[jt]sx?$/,
      }),
    ],
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      'process.env.REACT_APP_BACKEND_BASE_URL': JSON.stringify(
        env.VITE_BACKEND_BASE_URL ?? env.REACT_APP_BACKEND_BASE_URL ?? '/api'
      ),
      'process.env.REACT_APP_GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY ?? env.REACT_APP_GEMINI_API_KEY ?? ''
      ),
      'process.env.REACT_APP_KAKAO_MAP_KEY': JSON.stringify(
        env.VITE_KAKAO_MAP_KEY ?? env.REACT_APP_KAKAO_MAP_KEY ?? ''
      ),
      'process.env.REACT_APP_KMA_KEY': JSON.stringify(
        env.VITE_KMA_KEY ?? env.REACT_APP_KMA_KEY ?? ''
      ),
    },
    server: {
      port: Number(env.FRONTEND_PORT || 3000),
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port: Number(env.FRONTEND_PREVIEW_PORT || 4173),
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    },
  };
});
