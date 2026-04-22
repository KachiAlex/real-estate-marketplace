const { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  context.log('generateUploadSas invoked');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      }
    };
    return;
  }

  try {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    if (!accountName || !accountKey) {
      context.res = { status: 500, body: { error: 'Azure storage account not configured' } };
      return;
    }

    const { filename, container = process.env.AZURE_BLOB_CONTAINER || 'uploads', expiresInMinutes = 15 } = req.body || {};
    if (!filename) {
      context.res = { status: 400, body: { error: 'filename is required' } };
      return;
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + Number(expiresInMinutes) * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters({
      containerName: container,
      blobName: filename,
      expiresOn,
      permissions: BlobSASPermissions.parse('cw')
    }, sharedKeyCredential).toString();

    const blobUrl = `https://${accountName}.blob.core.windows.net/${container}/${filename}`;
    const uploadUrl = `${blobUrl}?${sasToken}`;

    context.res = {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { uploadUrl, blobUrl, expiresOn: expiresOn.toISOString() }
    };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, body: { error: err.message } };
  }
};
