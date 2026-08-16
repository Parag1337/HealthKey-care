# Cloudinary Migration — Medical Record Storage

## What changed

Medical-record documents are no longer stored on the backend's local filesystem.
They are stored in **Cloudinary** (media delivery service), while MongoDB remains
the system-of-record for metadata (title, category, hash, audit, blockchain anchor).

The backend is the **only** component that talks to Cloudinary. The browser never
receives Cloudinary credentials or permanent public URLs.

## Two modes

### 1. Simulation mode (default, zero-config)

If `CLOUDINARY_CLOUD_NAME` is empty (or `CLOUDINARY_SIMULATION=true`), the backend
runs a fully local simulation:

- Files "upload" into `healthkey-backend/.cloudinary-sim/` using the same opaque
  layout Cloudinary would use: `healthkey/medical-records/{patientId}/{uuid}.{ext}`.
- Authorized file delivery runs through the same signing logic
  (HMAC-signed, expiring) that the real mode uses, via `GET /api/records/asset`.
- Set `CLOUDINARY_SIM_FAIL_UPLOADS=true` to simulate an upstream outage (every
  upload returns 502 and no record is created). Used by the test suite.

### 2. Real Cloudinary mode

Set the three credentials in `healthkey-backend/.env`:

```
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
```

Then delete/ignore `CLOUDINARY_SIMULATION` (or set it to false). The official
`cloudinary` SDK performs **signed, server-authorized uploads** (`type: authenticated`,
never client-side SDK) and **signed, expiring (`expires_at`) asset URLs** for every
fetch. Authenticated assets are NOT publicly reachable by their URL — every access
is authorized by HealthKey first, so medical documents are never exposed without our
consent/ownership checks.

## Security properties

| Concern | Handling |
| --- | --- |
| Upload | Signed server-side SDK uploads only (`type: authenticated`, i.e. private assets); API secret never leaves the backend |
| Delivery | Every fetch is authorized by `requireRecordAccess`, then streamed via a short-lived (`expires_at`) signed URL or equivalent HMAC reference |
| Path structure | Opaque `healthkey/medical-records/{patientId}/{uuid}.{ext}` — no PII in keys |
| Response leakage | `storedFilename` and any `cloudinarySecureUrl` are stripped from all API responses |
| Deletion | Ownership verified → Cloudinary asset destroyed → Mongo metadata removed. If Cloudinary delete fails, the record is kept (503) rather than claiming success |
| Integrity | sha256 hash of the stored bytes is anchored on-chain; tampering is detected by `/records/:id/digest` and `POST /blockchain/verify/:id` |
| Audit | `document_uploaded`, `document_viewed`, `document_downloaded`, `document_deleted` events recorded |

## File types & limits

- Allowed: PDF, PNG, JPEG/JPG (WEBP accepted for backward compatibility).
  Verified by magic bytes, not just the declared MIME type.
- Limit: 10 MB (`MAX_UPLOAD_BYTES`). Oversize → `413 This file is larger than the 10 MB limit.`

## API surface (unchanged contract + additions)

- `POST /api/records/upload` — multipart; 201 with the serialized record
  (Cloudinary metadata present, secrets stripped).
- `GET /api/records/:id/file` — stream, honor `?download=1` for attachment.
- `GET /api/records/:id/digest` — recomputed hash vs stored/on-chain hash.
- `DELETE /api/records/:id` — owner-only; destroys the asset then the record.
- `POST /api/blockchain/verify/:id` — tamper detection on stored bytes.
- `GET /api/records/asset` — simulation-mode signed reference resolver.

## Testing

- `cloudinary` suite (57 checks): `bash /tmp/opencode/test-cloudinary.sh`
- Regression: `bash /tmp/opencode/test-backend.sh` (121) and
  `bash /tmp/opencode/test-new-features.sh` (88).
- The failure-injection check boots a second backend on port 5001 with
  `CLOUDINARY_SIM_FAIL_UPLOADS=true` and asserts no record/orphan file is left.

## Going live checklist

1. Set the three `CLOUDINARY_*` vars in `healthkey-backend/.env`.
2. Remove `CLOUDINARY_SIMULATION` (or set `false`).
3. Restart the backend; confirm `GET /api/health` still 200.
4. Re-run the cloudinary suite (real mode should pass all 57 checks).
5. Optionally delete `healthkey-backend/.cloudinary-sim/` after confirming parity.