import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(root, 'client', 'public');

describe('aset PWA Faktur', () => {
  it('menyediakan manifest instalasi dengan ikon Android dan start URL root', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.webmanifest'), 'utf8'));

    expect(manifest).toMatchObject({
      name: 'Faktur — Invoice Manager',
      start_url: '/',
      display: 'standalone',
      theme_color: '#0C2B63',
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/faktur-icon-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/faktur-icon-512.png', sizes: '512x512' }),
      ]),
    );
  });

  it('tidak mencache API atau permintaan autentikasi pada service worker', () => {
    const serviceWorker = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf8');
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")');
    expect(serviceWorker).toContain('request.method !== "GET"');
    expect(serviceWorker).toContain('faktur-shell-v1');
  });

  it('mendaftarkan service worker hanya pada build produksi', () => {
    const bootstrap = fs.readFileSync(path.join(root, 'client', 'src', 'main.tsx'), 'utf8');
    const registration = fs.readFileSync(path.join(root, 'client', 'src', 'pwa.ts'), 'utf8');
    expect(bootstrap).toContain("registerPwaServiceWorker");
    expect(registration).toContain("window.isSecureContext");
    expect(registration).not.toContain("import.meta.env.PROD");
  });

  it('menerbitkan Digital Asset Links untuk APK Faktur yang ditandatangani', () => {
    const assetLinks = JSON.parse(
      fs.readFileSync(path.join(publicDir, '.well-known', 'assetlinks.json'), 'utf8'),
    );
    const headers = fs.readFileSync(path.join(publicDir, '_headers'), 'utf8');

    expect(assetLinks).toEqual([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'id.biz.sabanachips.faktur.twa',
          sha256_cert_fingerprints: [
            'FA:F7:B1:D2:49:9A:EB:E8:2A:E1:35:DD:2C:B2:19:4C:4C:3D:90:17:9C:D1:05:ED:CA:7B:7C:AE:A7:B7:36:EE',
          ],
        },
      },
    ]);
    expect(headers).toContain('/.well-known/assetlinks.json');
    expect(headers).toContain('Cache-Control: no-cache, no-store, must-revalidate');
  });
});
