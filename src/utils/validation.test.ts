import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSiteConfig } from './siteDefaults';
import {
  formatFirebaseAuthError,
  formatFirestoreSaveError,
  isSafeHttpUrl,
  splitWordsForReveal,
  validateSiteConfigUpdate,
} from './validation';

test('isSafeHttpUrl accepts valid http and https links only', () => {
  assert.equal(isSafeHttpUrl('https://sociabuzz.com/rilishub/tribe'), true);
  assert.equal(isSafeHttpUrl('Https://sociabuzz.com/rilishub/tribe'), true);
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

test('validateSiteConfigUpdate accepts valid updates, normalizes capitalized schemes, and rejects unsafe URLs', () => {
  const base = createDefaultSiteConfig();

  const valid = validateSiteConfigUpdate(
    {
      ...base,
      isOnline: false,
      maintenanceMessage: 'Sedang update paket terbaru.',
      download: {
        ...base.download,
        primaryUrl: 'HTTPS://cdn.example.com/app-v3.zip',
        items: [
          {
            ...base.download.items[0],
            url: 'Https://github.com/denzzmodz/app.apk',
          },
        ],
      },
      sociabuzz: {
        ...base.sociabuzz,
        url: 'Https://sociabuzz.com/creator/donate',
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
    assert.equal(valid.data.download.items[0]?.url, 'https://github.com/denzzmodz/app.apk');
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

test('formatFirestoreSaveError parses FirestoreErrorInfo JSON into actionable Indonesian messages', () => {
  const permErr = new Error(
    JSON.stringify({
      error: 'Missing or insufficient permissions.',
      operationType: 'write',
      path: 'settings/site',
      authInfo: { email: 'dezzzzzz2007@gmail.com' },
    })
  );
  const permMsg = formatFirestoreSaveError(permErr);
  assert.match(permMsg, /dezzzzzz2007@gmail\.com/);
  assert.match(permMsg, /permission-denied/);

  const quotaErr = new Error(
    JSON.stringify({
      error: "Quota exceeded for quota metric 'Free daily read units per project'.",
      operationType: 'write',
      path: 'settings/site',
    })
  );
  assert.match(formatFirestoreSaveError(quotaErr), /Kuota baca\/tulis harian gratis Firebase/);

  const offlineErr = new Error('Failed to get document because the client is offline.');
  assert.match(formatFirestoreSaveError(offlineErr), /Koneksi ke Firebase terputus/);
});
