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
import { TourProvider } from './contexts/TourContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import VendorSidebar from './components/layout/VendorSidebar';
import VendorLayout from './components/layout/VendorLayout';
import LoadingSpinner from './components/LoadingSpinner';
import PropertyArkAssistant from './components/PropertyArkAssistant';
import AITourGuide from './components/AITourGuide';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly load critical pages (shown immediately on load)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Lazy load all other pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const AddProperty = lazy(() => import('./pages/AddProperty'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const ProfessionalServicesEnquiry = lazy(() => import('./pages/ProfessionalServicesEnquiry'));
const Escrow = lazy(() => import('./pages/Escrow'));
const Investments = lazy(() => import('./pages/Investments'));
const InvestmentDetail = lazy(() => import('./pages/InvestmentDetail'));
const InvestmentOpportunities = lazy(() => import('./pages/InvestmentOpportunities'));
const InvestmentCompanyDashboard = lazy(() => import('./pages/InvestmentCompanyDashboard'));
const EscrowTransaction = lazy(() => import('./pages/EscrowTransaction'));
const InvestorDashboard = lazy(() => import('./pages/InvestorDashboard'));
const Mortgages = lazy(() => import('./pages/Mortgages'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const SavedProperties = lazy(() => import('./pages/SavedProperties'));
const MyInquiries = lazy(() => import('./pages/MyInquiries'));
const PropertyAlerts = lazy(() => import('./pages/PropertyAlerts'));
const Messages = lazy(() => import('./pages/Messages'));
const Investment = lazy(() => import('./pages/Investment'));
const Mortgage = lazy(() => import('./pages/Mortgage'));
const MortgageApplications = lazy(() => import('./pages/MortgageApplications'));
const MortgageApplicationDetail = lazy(() => import('./pages/MortgageApplicationDetail'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const BillingPayments = lazy(() => import('./pages/BillingPayments'));
const EscrowPaymentFlow = lazy(() => import('./components/EscrowPaymentFlow'));
const VendorInspectionRequests = lazy(() => import('./pages/VendorInspectionRequests'));
const BuyerInspectionRequests = lazy(() => import('./pages/BuyerInspectionRequests'));
const MortgageBankRegister = lazy(() => import('./pages/MortgageBankRegister'));
const MortgageBankDashboard = lazy(() => import('./pages/MortgageBankDashboard'));

// Lazy load vendor pages
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorEarnings = lazy(() => import('./pages/VendorEarnings'));
const VendorTeam = lazy(() => import('./pages/VendorTeam'));
const VendorContracts = lazy(() => import('./pages/VendorContracts'));
const VendorProfile = lazy(() => import('./pages/VendorProfile'));
const VendorNotifications = lazy(() => import('./pages/VendorNotifications'));
const VendorHelp = lazy(() => import('./pages/VendorHelp'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));

function App() {
  return (
    <TourProvider>
      <AuthProvider>
        <NotificationProvider>
          <VendorProvider>
            <PropertyProvider>
              <InvestmentProvider>
                <EscrowProvider>
                  <MortgageProvider>
                    <SidebarProvider>
            <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
              <Header />
              <div className="flex flex-grow w-full max-w-full overflow-x-hidden">
                <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center w-full h-screen">
                    <LoadingSpinner size="lg" />
                  </div>
                }>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/mortgage-bank/register" element={<MortgageBankRegister />} />
                  <Route path="/properties" element={
                    <div className="flex w-full">
                      <Sidebar />
                      <main id="main-content" className="flex-1 ml-0 lg:ml-64" role="main">
                        <Properties />
                      </main>
                    </div>
                  } />
                  <Route path="/my-inspections" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <BuyerInspectionRequests />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investment" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Investment />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgage" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Mortgage />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgages" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Mortgages />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgages/applications" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <MortgageApplications />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgages/applications/:id" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <MortgageApplicationDetail />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/property/:id" element={
                    <div className="flex w-full">
                      <Sidebar />
                      <main className="flex-1 ml-0 lg:ml-64">
                        <PropertyDetail />
                      </main>
                    </div>
                  } />
                  <Route path="/about" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogDetail />} />
                  <Route path="/professional-services/enquiry" element={<ProfessionalServicesEnquiry />} />
                  <Route path="/search" element={
                    <ProtectedRoute>
                    <div className="flex w-full">
                      <Sidebar />
                      <main className="flex-1 ml-0 lg:ml-64">
                        <SearchResults />
                      </main>
                    </div>
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected Routes with Permanent Sidebar */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main id="main-content" className="flex-1 ml-0 lg:ml-64" role="main">
                          <Dashboard />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/add-property" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
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
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Profile />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/escrow" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Escrow />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investments" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Investments />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investment-opportunities" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <InvestmentOpportunities />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investor-dashboard" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <InvestorDashboard />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/investment/:id" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <InvestmentDetail />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/escrow/:id" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <EscrowTransaction />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/escrow/create" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <EscrowPaymentFlow />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgages" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Mortgages />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgage-bank/dashboard" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <MortgageBankDashboard />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/saved-properties" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <SavedProperties />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/inquiries" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <MyInquiries />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/alerts" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <PropertyAlerts />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <Messages />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/help" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
                          <HelpSupport />
                        </main>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/billing" element={
                    <ProtectedRoute>
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-0 lg:ml-64">
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
                        <main className="flex-1 ml-0 lg:ml-64">
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
                  {/* Redirect old add-property route to properties page */}
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
                </Suspense>
                </ErrorBoundary>
              </div>
              
                                {/* PropertyArk Assistant (Kiki) */}
                                <PropertyArkAssistant />
                                
                                {/* AI Tour Guide */}
                                <AITourGuide />
            </div>
                    </SidebarProvider>
                  </MortgageProvider>
                </EscrowProvider>
              </InvestmentProvider>
            </PropertyProvider>
          </VendorProvider>
        </NotificationProvider>
      </AuthProvider>
    </TourProvider>
  );
}

export default App; 