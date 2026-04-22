import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Persistent, dismissible banner that appears when app is running in local/offline mode
export default function LocalModeBanner() {
  const { accessToken } = useAuth();
  const [visible, setVisible] = useState(false);
  const [reasons, setReasons] = useState([]);

  useEffect(() => {
    // Do not show if user dismissed for this session
    const dismissed = sessionStorage.getItem('dismissLocalModeBannerV1');
    if (dismissed) return;

    const detected = [];

    try {
      const fallbackUploads = JSON.parse(localStorage.getItem('vendorKycFallbackUploads') || 'null');
      if (fallbackUploads && Array.isArray(fallbackUploads) && fallbackUploads.length > 0) {
        detected.push('KYC uploads stored locally because the upload service is unavailable');
      }
    } catch (e) {
      // ignore
    }

    try {
      const onboarded = JSON.parse(localStorage.getItem('onboardedVendor') || 'null');
      if (onboarded && onboarded.contactInfo && onboarded.contactInfo.email) {
        detected.push('Vendor profile saved locally (no backend session)');
      }
    } catch (e) {
      // ignore
    }

    // Detect mock/local session (dev/offline)
    if (accessToken && String(accessToken).startsWith('mock')) {
      detected.push('Signed in locally (temporary session)');
    }

    if (detected.length > 0) {
      setReasons(detected);
      setVisible(true);
    }
  }, [accessToken]);

  if (!visible) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('dismissLocalModeBannerV1', '1');
    setVisible(false);
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-2 text-sm flex items-start justify-between" role="status" aria-live="polite">
      <div className="flex-1 pr-4">
        <div className="font-semibold">Offline / Local mode active</div>
        <ul className="mt-1 list-disc list-inside space-y-0.5">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <div className="mt-1 text-xs text-gray-600">Data saved locally — it will be synced when the service is restored. Contact support if this persists.</div>
      </div>
      <div className="flex-shrink-0 pl-4">
        <button className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded" onClick={handleDismiss}>Dismiss</button>
      </div>
    </div>
  );
}
