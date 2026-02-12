import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext-new';
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
import VendorLayout from './components/layout/VendorLayout';
import LoadingSpinner from './components/LoadingSpinner';
import PropertyArkAssistant from './components/PropertyArkAssistant';
import AITourGuide from './components/AITourGuide';
import ErrorBoundary from './components/ErrorBoundary';

// Eager imports
import Home from './pages/Home';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import SignInModal from './components/auth/SignInModal';
import GooglePopupCallback from './pages/auth/GooglePopupCallback';

// Lazy imports
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const AddProperty = lazy(() => import('./pages/AddProperty'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
// Blog pages removed — redirecting to properties instead
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
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorEarnings = lazy(() => import('./pages/VendorEarnings'));
const VendorTeam = lazy(() => import('./pages/VendorTeam'));
const VendorContracts = lazy(() => import('./pages/VendorContracts'));
const VendorProfile = lazy(() => import('./pages/VendorProfile'));
const VendorNotifications = lazy(() => import('./pages/VendorNotifications'));
const VendorHelp = lazy(() => import('./pages/VendorHelp'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));

const PageWithSidebar = ({ children, id }) => (
  <div className="flex w-full">
    <Sidebar />
    <main id={id} className="flex-1 ml-0 lg:ml-64" role={id ? 'main' : 'region'}>
      {children}
    </main>
  </div>
);

const VendorRoute = ({ children }) => (
  <VendorLayout>
    {children}
  </VendorLayout>
);

const AuthRoutes = () => (
  <Routes>
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/auth/register" element={<RegisterPage />} />
    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/auth/google-popup-callback" element={<GooglePopupCallback />} />
    <Route path="*" element={<Navigate to="/auth/login" replace />} />
  </Routes>
);

const MainRoutes = () => (
  <Routes>
    {/* Redirect old auth paths to new auth routes */}
    <Route path="/login" element={<Navigate to="/auth/login" replace />} />
    <Route path="/register" element={<Navigate to="/auth/register" replace />} />
    <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
    <Route path="/reset-password" element={<Navigate to="/auth/forgot-password" replace />} />
    
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/auth/login" element={<></>} />
    <Route path="/auth/register" element={<RegisterPage />} />
    <Route path="/blog" element={<Navigate to="/properties" replace />} />
    <Route path="/blog/:slug" element={<Navigate to="/properties" replace />} />
    <Route path="/professional-services/enquiry" element={<ProfessionalServicesEnquiry />} />
    <Route path="/mortgage-bank/register" element={<MortgageBankRegister />} />
    <Route path="/mortgage-bank/dashboard" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <MortgageBankDashboard />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/properties" element={
      <PageWithSidebar>
        <Properties />
      </PageWithSidebar>
    } />
    <Route path="/property/:id" element={
      <PageWithSidebar>
        <PropertyDetail />
      </PageWithSidebar>
    } />
    <Route path="/search" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <SearchResults />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/my-inspections" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <BuyerInspectionRequests />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/investment" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Investment />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/investment/:id" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <InvestmentDetail />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/investments" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Investments />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/investment-opportunities" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <InvestmentOpportunities />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/investment-company/dashboard" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <InvestmentCompanyDashboard />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/mortgage" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Mortgage />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/mortgages" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Mortgages />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/mortgages/applications" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <MortgageApplications />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/mortgages/applications/:id" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <MortgageApplicationDetail />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/escrow" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Escrow />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/escrow/transaction/:id" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <EscrowTransaction />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/escrow/payment-flow" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <EscrowPaymentFlow />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Dashboard />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/add-property" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <AddProperty />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/admin" element={
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Profile />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/messages" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <Messages />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/saved-properties" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <SavedProperties />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/my-inquiries" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <MyInquiries />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/alerts" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <PropertyAlerts />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/billing-payments" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <BillingPayments />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/help-support" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <HelpSupport />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/investor-dashboard" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <InvestorDashboard />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/payment/callback" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <PaymentCallback />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/vendor/dashboard" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorDashboard />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendor/earnings" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorEarnings />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendor/team" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorTeam />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendor/contracts" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorContracts />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendor/profile" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorProfile />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendor/notifications" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorNotifications />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendor/help" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorHelp />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendor/inspection-requests" element={
      <ProtectedRoute>
        <VendorRoute>
          <VendorInspectionRequests />
        </VendorRoute>
      </ProtectedRoute>
    } />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  const location = useLocation();
  // Show header on most pages. Keep Sign In as a modal so header/menu remains visible.
  // hide header for full-page auth routes (register, forgot password, callback).
  // Explicitly treat `/auth/login` as a modal route to avoid router fallback redirects.
  const hideHeaderPaths = ['/auth/forgot-password', '/auth/google-popup-callback'];
  const isSignInModalRoute = location.pathname === '/auth/login';
  const isAuthRoute = hideHeaderPaths.includes(location.pathname) && !isSignInModalRoute;

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
                      {isAuthRoute ? (
                        <div className="flex min-h-screen w-full justify-center">
                          <Suspense fallback={
                            <div className="flex items-center justify-center w-full h-screen">
                              <LoadingSpinner size="lg" />
                            </div>
                          }>
                            <AuthRoutes />
                          </Suspense>
                        </div>
                      ) : (
                        <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
                          <Header />
                          <div className="flex flex-grow w-full max-w-full overflow-x-hidden">
                            <ErrorBoundary>
                              <Suspense fallback={
                                <div className="flex items-center justify-center w-full h-screen">
                                  <LoadingSpinner size="lg" />
                                </div>
                              }>
                                <MainRoutes />
                              </Suspense>
                            </ErrorBoundary>
                          </div>
                          {/* Show Sign-in as modal when route is /auth/login */}
                          {isSignInModalRoute && (
                            <SignInModal onClose={() => window.history.length > 1 ? window.history.back() : window.location.replace('/')} />
                          )}
                          <PropertyArkAssistant />
                          <AITourGuide />
                        </div>
                      )}
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
