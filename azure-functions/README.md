# Azure Function: generateUploadSas

Purpose: generate short‑lived SAS URLs so clients can upload directly to Azure Blob Storage.

Quick setup

1. Create an Azure Storage account and container (e.g. `uploads`).
2. Create an Azure Function App (Node 18) and set the following Application Settings:
   - `AZURE_STORAGE_ACCOUNT_NAME` = your storage account name
   - `AZURE_STORAGE_ACCOUNT_KEY` = your storage account key
   - `AZURE_BLOB_CONTAINER` = uploads
3. Get the **Publish profile** from the Function App (Azure Portal → Get publish profile) and add it to your GitHub repo secrets as `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`.
4. Add `AZURE_FUNCTION_APP_NAME` as a GitHub secret (the Function App name).
5. Push to `main` — the workflow `.github/workflows/deploy-azure-function.yml` will deploy the `azure-functions` folder.

Usage

- Endpoint: POST https://<your-function-app>.azurewebsites.net/api/generateUploadSas
- Body (JSON): { "filename": "user-123/avatar.png", "container": "uploads", "expiresInMinutes": 15 }
- Response: { uploadUrl, blobUrl, expiresOn }

Security

- Keep `AZURE_STORAGE_ACCOUNT_KEY` secret.
- For production, restrict access to the Function (use function key or App Service auth) and set CORS on the Function App.

Local dev

- Copy `azure-functions/local.settings.json.example` to `azure-functions/local.settings.json` and fill in your storage account details.
- Start with `func start` (requires Azure Functions Core Tools).
