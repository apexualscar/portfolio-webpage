import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async headers() {
    return [
      // COOP/COEP required for Unity SharedArrayBuffer (threads)
      {
        source: '/unity-builds/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      // Gzip-compressed Unity build files — match any public path
      {
        source: '/:path*.js.gz',
        headers: [
          { key: 'Content-Encoding', value: 'gzip' },
          { key: 'Content-Type', value: 'application/javascript' },
        ],
      },
      {
        source: '/:path*.wasm.gz',
        headers: [
          { key: 'Content-Encoding', value: 'gzip' },
          { key: 'Content-Type', value: 'application/wasm' },
        ],
      },
      {
        source: '/:path*.data.gz',
        headers: [
          { key: 'Content-Encoding', value: 'gzip' },
          { key: 'Content-Type', value: 'application/octet-stream' },
        ],
      },
      {
        source: '/:path*.symbols.json.gz',
        headers: [
          { key: 'Content-Encoding', value: 'gzip' },
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
      // Brotli-compressed Unity build files
      {
        source: '/:path*.js.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: 'application/javascript' },
        ],
      },
      {
        source: '/:path*.wasm.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: 'application/wasm' },
        ],
      },
      {
        source: '/:path*.data.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: 'application/octet-stream' },
        ],
      },
      {
        source: '/:path*.symbols.json.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withMDX(nextConfig);
