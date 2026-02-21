export async function uploadToCloudinaryDirect(file, signedParams) {
  const { cloud_name, api_key, timestamp, signature } = signedParams;
  if (!cloud_name || !api_key || !timestamp || !signature) throw new Error('Missing signed params');

  const url = `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', api_key);
  fd.append('timestamp', timestamp);
  fd.append('signature', signature);

  const resp = await fetch(url, { method: 'POST', body: fd });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => null);
    throw new Error(`Cloudinary upload failed: ${resp.status} ${txt || ''}`);
  }
  const json = await resp.json();
  return {
    url: json.secure_url || json.url,
    name: json.original_filename || file.name,
    publicId: json.public_id,
    raw: json
  };
}

export default uploadToCloudinaryDirect;
