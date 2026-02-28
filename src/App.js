import VendorPropertiesContainer from './components/vendor/VendorPropertiesContainer';
import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import retryImport from './utils/retryImport';

// Eager imports
import Home from './pages/Home';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import SignInModal from './components/auth/SignInModal';
import GooglePopupCallback from './pages/auth/GooglePopupCallback';

// Lazy imports (wrapped with retryImport to mitigate transient chunk load failures)
const Dashboard = lazy(() => retryImport(() => import('./pages/Dashboard')));
const Properties = lazy(() => retryImport(() => import('./pages/Properties')));
const PropertyDetail = lazy(() => retryImport(() => import('./pages/PropertyDetail')));
const AddProperty = lazy(() => retryImport(() => import('./pages/AddProperty')));
const AdminDashboard = lazy(() => retryImport(() => import('./pages/AdminDashboard')));
const AdminKycReview = lazy(() => retryImport(() => import('./pages/admin/KycReview')));
const Profile = lazy(() => retryImport(() => import('./pages/Profile')));
const About = lazy(() => retryImport(() => import('./pages/About')));
const OnboardVendor = lazy(() => retryImport(() => import('./pages/OnboardVendor')));
// Blog pages removed — redirecting to properties instead
const ProfessionalServicesEnquiry = lazy(() => retryImport(() => import('./pages/ProfessionalServicesEnquiry')));
const Escrow = lazy(() => retryImport(() => import('./pages/Escrow')));
const Investments = lazy(() => retryImport(() => import('./pages/Investments')));
const InvestmentDetail = lazy(() => retryImport(() => import('./pages/InvestmentDetail')));
const InvestmentOpportunities = lazy(() => retryImport(() => import('./pages/InvestmentOpportunities')));
const InvestmentCompanyDashboard = lazy(() => retryImport(() => import('./pages/InvestmentCompanyDashboard')));
const EscrowTransaction = lazy(() => retryImport(() => import('./pages/EscrowTransaction')));
const InvestorDashboard = lazy(() => retryImport(() => import('./pages/InvestorDashboard')));
const Mortgages = lazy(() => retryImport(() => import('./pages/Mortgages')));
const SearchResults = lazy(() => retryImport(() => import('./pages/SearchResults')));
const SavedProperties = lazy(() => retryImport(() => import('./pages/SavedProperties')));
const MyInquiries = lazy(() => retryImport(() => import('./pages/MyInquiries')));
const PropertyAlerts = lazy(() => retryImport(() => import('./pages/PropertyAlerts')));
const Messages = lazy(() => retryImport(() => import('./pages/Messages')));
const Investment = lazy(() => retryImport(() => import('./pages/Investment')));
const Mortgage = lazy(() => retryImport(() => import('./pages/Mortgage')));
const MortgageApplications = lazy(() => retryImport(() => import('./pages/MortgageApplications')));
const MortgageApplicationDetail = lazy(() => retryImport(() => import('./pages/MortgageApplicationDetail')));
const HelpSupport = lazy(() => retryImport(() => import('./pages/HelpSupport')));
const BillingPayments = lazy(() => retryImport(() => import('./pages/BillingPayments')));
const EscrowPaymentFlow = lazy(() => retryImport(() => import('./components/EscrowPaymentFlow')));
const VendorInspectionRequests = lazy(() => retryImport(() => import('./pages/VendorInspectionRequests')));
const BuyerInspectionRequests = lazy(() => retryImport(() => import('./pages/BuyerInspectionRequests')));
const MortgageBankRegister = lazy(() => retryImport(() => import('./pages/MortgageBankRegister')));
const MortgageBankDashboard = lazy(() => retryImport(() => import('./pages/MortgageBankDashboard')));
const VendorDashboard = lazy(() => retryImport(() => import('./pages/VendorDashboard')));
const VendorEarnings = lazy(() => retryImport(() => import('./pages/VendorEarnings')));
const VendorTeam = lazy(() => retryImport(() => import('./pages/VendorTeam')));
const VendorContracts = lazy(() => retryImport(() => import('./pages/VendorContracts')));
const VendorProfile = lazy(() => retryImport(() => import('./pages/VendorProfile')));
const VendorNotifications = lazy(() => retryImport(() => import('./pages/VendorNotifications')));
const VendorHelp = lazy(() => retryImport(() => import('./pages/VendorHelp')));
const PaymentCallback = lazy(() => retryImport(() => import('./pages/PaymentCallback')));
const VendorSubscription = lazy(() => retryImport(() => import('./pages/VendorSubscription')));
// VendorOnboardingDashboard removed
const VendorRenewSubscription = lazy(() => retryImport(() => import('./pages/VendorRenewSubscription')));

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

const MainRoutes = ({ locationOverride }) => (
  <Routes location={locationOverride}>
    {/* Redirect old auth paths to new auth routes */}
    <Route path="/login" element={<Navigate to="/auth/login" replace />} />
    <Route path="/register" element={<Navigate to="/auth/register" replace />} />
    <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
    <Route path="/reset-password" element={<Navigate to="/auth/forgot-password" replace />} />
    
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/auth/register" element={<RegisterPage />} />
    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/blog" element={<Navigate to="/properties" replace />} />
    <Route path="/blog/:slug" element={<Navigate to="/properties" replace />} />
    <Route path="/professional-services/enquiry" element={<ProfessionalServicesEnquiry />} />
    {/* Public vendor onboarding route */}
    <Route path="/onboard-vendor" element={
      <React.Suspense fallback={<div className="flex items-center justify-center w-full h-screen"><LoadingSpinner size="lg" /></div>}>
        <OnboardVendor />
      </React.Suspense>
    } />

    {/* Short redirects for legacy vendor routes expected by E2E tests */}
      {/* Short redirects / legacy vendor routes expected by E2E tests */}
      {/* Ensure /vendor/properties resolves to the vendor properties page (legacy links point here). */}
      <Route path="/vendor/properties" element={<VendorRoute><VendorPropertiesContainer /></VendorRoute>} />
    {/* Ensure legacy /vendor/earnings loads the VendorEarnings page directly */}
    <Route path="/vendor/earnings" element={<VendorRoute><VendorEarnings /></VendorRoute>} />
    <Route path="/vendor/register" element={
      <React.Suspense fallback={<div className="flex items-center justify-center w-full h-screen"><LoadingSpinner size="lg" /></div>}>
        <OnboardVendor />
      </React.Suspense>
    } />
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
      <PageWithSidebar>
        <Investment />
      </PageWithSidebar>
    } />
    <Route path="/investment/:id" element={
      <ProtectedRoute>
        <PageWithSidebar>
          <InvestmentDetail />
        </PageWithSidebar>
      </ProtectedRoute>
    } />
    <Route path="/investments" element={
      <PageWithSidebar>
        <Investments />
      </PageWithSidebar>
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
      <PageWithSidebar>
        <Mortgage />
      </PageWithSidebar>
    } />
    <Route path="/mortgages" element={
      <PageWithSidebar>
        <Mortgages />
      </PageWithSidebar>
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
    <Route path="/admin/vendors/kyc" element={
      <ProtectedRoute>
        <AdminKycReview />
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
    <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorRoute><VendorDashboard /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/earnings" element={<ProtectedRoute><VendorRoute><VendorEarnings /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/team" element={<ProtectedRoute><VendorRoute><VendorTeam /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/contracts" element={<ProtectedRoute><VendorRoute><VendorContracts /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/profile" element={<ProtectedRoute><VendorRoute><VendorProfile /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/notifications" element={<ProtectedRoute><VendorRoute><VendorNotifications /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/help" element={<ProtectedRoute><VendorRoute><VendorHelp /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/inspection-requests" element={<ProtectedRoute><VendorRoute><VendorInspectionRequests /></VendorRoute></ProtectedRoute>} />
    <Route path="/vendor/subscription" element={<ProtectedRoute><VendorRoute><VendorSubscription /></VendorRoute></ProtectedRoute>} />
    {/* VendorOnboardingDashboard route removed */}
    <Route path="/vendor/renew-subscription" element={<ProtectedRoute><VendorRoute><VendorRenewSubscription /></VendorRoute></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const DEFAULT_BACKGROUND_LOCATION = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

const cloneLocation = (loc = DEFAULT_BACKGROUND_LOCATION) => ({
  pathname: loc.pathname,
  search: loc.search,
  hash: loc.hash,
  state: loc.state,
  key: loc.key || `bg-${Date.now()}`
});

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideHeaderPaths = ['/auth/register', '/auth/forgot-password', '/auth/google-popup-callback'];
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSignInModalRoute = location.pathname === '/auth/login';
  const shouldHideHeader = (hideHeaderPaths.includes(location.pathname) && !isSignInModalRoute) || isAdminRoute;
  const previousLocationRef = useRef(
    isSignInModalRoute || hideHeaderPaths.includes(location.pathname)
      ? cloneLocation(DEFAULT_BACKGROUND_LOCATION)
      : cloneLocation(location)
  );
  useEffect(() => {
    const isBackgroundEligible = !isSignInModalRoute && !hideHeaderPaths.includes(location.pathname);
    if (isBackgroundEligible) {
      previousLocationRef.current = cloneLocation(location);
    }
  }, [isSignInModalRoute, location]);

  const handleSignInModalClose = (options = {}) => {
    if (options?.type === 'navigate') return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/', { replace: true });
    }
  };

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
                      {shouldHideHeader ? (
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
                          <div className={`flex flex-grow w-full max-w-full overflow-x-hidden ${isSignInModalRoute ? '' : 'pt-16'}`}>
                            <ErrorBoundary>
                              <Suspense fallback={
                                <div className="flex items-center justify-center w-full h-screen">
                                  <LoadingSpinner size="lg" />
                                </div>
                              }>
                                <MainRoutes locationOverride={isSignInModalRoute ? (previousLocationRef.current || DEFAULT_BACKGROUND_LOCATION) : location} />
                              </Suspense>
                            </ErrorBoundary>
                          </div>
                          {/* Show Sign-in as modal when route is /auth/login */}
                          {isSignInModalRoute && (
                            <SignInModal onClose={handleSignInModalClose} />
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
