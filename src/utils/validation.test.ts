import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSiteConfig } from './siteDefaults';
import {
  formatFirebaseAuthError,
  isSafeHttpUrl,
  splitWordsForReveal,
  validateSiteConfigUpdate,
} from './validation';

test('isSafeHttpUrl accepts valid http and https links only', () => {
  assert.equal(isSafeHttpUrl('https://sociabuzz.com/rilishub/tribe'), true);
  assert.equal(isSafeHttpUrl('http://localhost:3000/file.zip'), true);
  assert.equal(isSafeHttpUrl('  https://t.me/rilishub_official  '), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeHttpUrl('ftp://example.com/file.zip'), false);
  assert.equal(isSafeHttpUrl(''), false);
  assert.equal(isSafeHttpUrl('not-a-url'), false);
});

test('splitWordsForReveal splits headlines cleanly without empty tokens', () => {
  assert.deepEqual(splitWordsForReveal('  Unduh   Rilis Resmi  Terbaru '), [
    'Unduh',
    'Rilis',
    'Resmi',
    'Terbaru',
  ]);
  assert.deepEqual(splitWordsForReveal(''), []);
});

test('validateSiteConfigUpdate accepts valid updates including online/offline toggle and rejects unsafe URLs', () => {
  const base = createDefaultSiteConfig();

  const valid = validateSiteConfigUpdate(
    {
      ...base,
      isOnline: false,
      maintenanceMessage: 'Sedang update paket terbaru.',
      download: {
        ...base.download,
        primaryUrl: 'https://cdn.example.com/app-v3.zip',
      },
      sociabuzz: {
        ...base.sociabuzz,
        url: 'https://sociabuzz.com/creator/donate',
      },
      channel: {
        ...base.channel,
        url: 'https://whatsapp.com/channel/0029VaExample',
      },
    },
    base
  );

  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.isOnline, false);
    assert.equal(valid.data.maintenanceMessage, 'Sedang update paket terbaru.');
    assert.equal(valid.data.download.primaryUrl, 'https://cdn.example.com/app-v3.zip');
    assert.equal(valid.data.sociabuzz.url, 'https://sociabuzz.com/creator/donate');
    assert.equal(valid.data.channel.url, 'https://whatsapp.com/channel/0029VaExample');
  }

  const invalid = validateSiteConfigUpdate(
    {
      ...base,
      maintenanceMessage: '   ',
      sociabuzz: {
        ...base.sociabuzz,
        url: 'javascript:void(0)',
      },
      channel: {
        ...base.channel,
        url: 'invalid-link',
      },
    },
    base
  );

  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.ok(invalid.errors['maintenanceMessage']);
    assert.ok(invalid.errors['sociabuzz.url']);
    assert.ok(invalid.errors['channel.url']);
  }
});

test('formatFirebaseAuthError returns clear Indonesian diagnostic for unauthorized-domain and popup errors', () => {
  const unauthMsg = formatFirebaseAuthError(
    { code: 'auth/unauthorized-domain', message: 'Firebase: Error (auth/unauthorized-domain).' },
    'denzzmodz.vercel.app'
  );
  assert.match(unauthMsg, /denzzmodz\.vercel\.app/);
  assert.match(unauthMsg, /Authorized domains/);

  assert.match(
    formatFirebaseAuthError({ code: 'auth/popup-closed-by-user' }),
    /ditutup sebelum selesai/
  );
  assert.match(
    formatFirebaseAuthError(new Error('Firebase: Error (auth/popup-blocked).')),
    /diblokir oleh browser/
  );
});
