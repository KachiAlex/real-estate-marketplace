import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';
import { InvestmentProvider } from './contexts/InvestmentContext';
import { EscrowProvider } from './contexts/EscrowContext';
import { VendorProvider } from './contexts/VendorContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MortgageProvider } from './contexts/MortgageContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import VendorSidebar from './components/layout/VendorSidebar';
import VendorLayout from './components/layout/VendorLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import AddProperty from './pages/AddProperty';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Escrow from './pages/Escrow';
import Investments from './pages/Investments';
import InvestmentDetail from './pages/InvestmentDetail';
import InvestmentOpportunities from './pages/InvestmentOpportunities';
import InvestmentCompanyDashboard from './pages/InvestmentCompanyDashboard';
import EscrowTransaction from './pages/EscrowTransaction';
import InvestorDashboard from './pages/InvestorDashboard';
import Mortgages from './pages/Mortgages';
import SearchResults from './pages/SearchResults';
import SavedProperties from './pages/SavedProperties';
import MyInquiries from './pages/MyInquiries';
import PropertyAlerts from './pages/PropertyAlerts';
import Messages from './pages/Messages';
import Investment from './pages/Investment';
import Mortgage from './pages/Mortgage';
import HelpSupport from './pages/HelpSupport';
import BillingPayments from './pages/BillingPayments';
import EscrowPaymentFlow from './components/EscrowPaymentFlow';
import VendorInspectionRequests from './pages/VendorInspectionRequests';
import BuyerInspectionRequests from './pages/BuyerInspectionRequests';
import LoadingSpinner from './components/LoadingSpinner';
import KIKI from './components/KIKI';

// Lazy load vendor pages for better performance
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorEarnings = lazy(() => import('./pages/VendorEarnings'));
const VendorTeam = lazy(() => import('./pages/VendorTeam'));
const VendorContracts = lazy(() => import('./pages/VendorContracts'));
const VendorProfile = lazy(() => import('./pages/VendorProfile'));
const VendorNotifications = lazy(() => import('./pages/VendorNotifications'));
const VendorHelp = lazy(() => import('./pages/VendorHelp'));

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <VendorProvider>
          <PropertyProvider>
            <InvestmentProvider>
              <EscrowProvider>
                <MortgageProvider>
                  <SidebarProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex flex-grow w-full">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/properties" element={
                    <div className="flex w-full">
                      <Sidebar />
                      <main className="flex-1 ml-64">
                        <Properties />
                      </main>
                    </div>
                  } />
                  <Route path="/my-inspections" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <BuyerInspectionRequests />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investment" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Investment />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgage" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Mortgage />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgages" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Mortgages />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/property/:id" element={
                    <div className="flex w-full">
                      <Sidebar />
                      <main className="flex-1 ml-64">
                        <PropertyDetail />
                      </main>
                    </div>
                  } />
                  <Route path="/about" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogDetail />} />
                  <Route path="/search" element={
                    <div className="flex w-full">
                      <Sidebar />
                      <main className="flex-1 ml-64">
                        <SearchResults />
                      </main>
                    </div>
                  } />
                  
                  {/* Protected Routes with Permanent Sidebar */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Dashboard />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/add-property" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <AddProperty />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Profile />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/escrow" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Escrow />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investments" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Investments />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investment-opportunities" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <InvestmentOpportunities />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investor-dashboard" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <InvestorDashboard />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investment/:id" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <InvestmentDetail />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/escrow/:id" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <EscrowTransaction />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/escrow/create" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <EscrowPaymentFlow />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgages" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Mortgages />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/saved-properties" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <SavedProperties />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/inquiries" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <MyInquiries />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/alerts" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <PropertyAlerts />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <Messages />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/help" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <HelpSupport />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/billing" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <BillingPayments />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  
                  {/* Investment Company Routes */}
                  <Route path="/investment-company/dashboard" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <VendorSidebar />
                        <main className="flex-1 ml-64">
                          <InvestmentCompanyDashboard />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  
                  {/* Vendor Routes with Vendor Sidebar */}
                  <Route path="/vendor/dashboard" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorDashboard />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/properties" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorDashboard />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/add-property" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <AddProperty />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/earnings" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorEarnings />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/team" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorTeam />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/contracts" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorContracts />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/inspection-requests" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorInspectionRequests />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/profile" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorProfile />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/notifications" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorNotifications />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/vendor/help" element={
                    <ProtectedRoute>
                      <VendorLayout>
                        <Suspense fallback={<LoadingSpinner size="lg" className="h-64" />}>
                          <VendorHelp />
                        </Suspense>
                      </VendorLayout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
              
              {/* Global KIKI Assistant */}
              <KIKI />
            </div>
                  </SidebarProvider>
                </MortgageProvider>
              </EscrowProvider>
            </InvestmentProvider>
          </PropertyProvider>
        </VendorProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App; 