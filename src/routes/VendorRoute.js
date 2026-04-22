import React from 'react';
import VendorLayout from '../components/layout/VendorLayout';
import ProtectedVendorRoute from '../routes/ProtectedVendorRoute';

export default function VendorRoute({ children }) {
  return (
    <ProtectedVendorRoute>
      <VendorLayout>{children}</VendorLayout>
    </ProtectedVendorRoute>
  );
}
