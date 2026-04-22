# Signed Uploads (Cloudinary)

This project supports direct, signed client uploads to Cloudinary for vendor KYC documents.

## How it works

- The client requests signed params from the backend: `GET /api/upload/vendor/kyc/signed`.
- The server returns a small payload: `{ api_key, cloud_name, timestamp, signature }`.
- The client posts each file directly to Cloudinary's upload endpoint using these params.
- If the backend does not provide signed params (service not configured), the client falls back to uploading files to the server at `POST /api/upload/vendor/kyc` which stores them in `uploads/temp`.

## Enabling Cloudinary

Set the following environment variables on the server:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

When these are present, the backend `GET /api/upload/vendor/kyc/signed` will return signed params.

## Developer commands

- Run the admin KYC smoke test (requires an admin token and local server):

```powershell
$env:ADMIN_TOKEN="<admin-token>"
$env:API_BASE="http://localhost:3000"
node backend/scripts/adminKycSmokeTest.js
```

- Cleanup temp uploads older than 24 hours:

```powershell
node backend/scripts/cleanupTempUploads.js 24
```

## Notes & Security

- Signed uploads rely on the server-side signature generation; verify your `CLOUDINARY_API_SECRET` is stored securely and not exposed to the client.
- Consider adding upload presets and stricter server-side validation of resulting uploaded resources (e.g., verify file types, public IDs, and that uploaded files belong to a user).
- For production, prefer using short-lived upload signatures or server-side upload proxies depending on security requirements.
