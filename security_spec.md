# Security Specification — DENZZMODZ Firestore Rules

## 1. Data Invariants
1. Public visitors may only `get` the singleton `/settings/site` document (`allow list` is denied).
2. Only verified authenticated admins (`request.auth.token.email_verified == true` and either bootstrapped admin email `dezzzzzz2007@gmail.com` or an existing `/admins/{uid}` document) can create, update, or delete `/settings/site` or `/admins/{adminUid}`.
3. Every URL written to `/settings/site` (`download.primaryUrl`, `sociabuzz.url`, `channel.url`) must match `^https?://.+` and adhere to strict character length bounds.
4. `updatedBy` must equal `request.auth.uid`, and `updatedAt` must equal `request.time`.
5. No shadow/extra top-level or nested keys are allowed (`keys().hasOnly(...)`).

## 2. Dirty Dozen Adversarial Payloads
1. Unauthenticated `setDoc` on `/settings/site` -> `PERMISSION_DENIED`.
2. Signed-in non-admin Google account `setDoc` on `/settings/site` -> `PERMISSION_DENIED`.
3. Signed-in user with `email_verified: false` spoofing admin email -> `PERMISSION_DENIED`.
4. Non-admin attempting `setDoc` on `/admins/{ownUid}` to escalate privilege -> `PERMISSION_DENIED`.
5. Admin attempting `list` on `/admins` or `/settings` without permission -> `PERMISSION_DENIED`.
6. Write with `javascript:alert(1)` in `download.primaryUrl` -> `PERMISSION_DENIED`.
7. Write with `data:text/html,...` in `sociabuzz.url` -> `PERMISSION_DENIED`.
8. Write with `channel.url` missing `http://`/`https://` -> `PERMISSION_DENIED`.
9. Shadow field injection `{ ...valid, isAdmin: true }` in `/settings/site` -> `PERMISSION_DENIED`.
10. Oversized `brandName` (> 60 chars) or `items` list (> 20 items) -> `PERMISSION_DENIED`.
11. Forged `updatedBy` UID not matching `request.auth.uid` -> `PERMISSION_DENIED`.
12. Forged client `updatedAt` timestamp not equal to `request.time` -> `PERMISSION_DENIED`.
