import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';
import { InvestmentProvider } from './contexts/InvestmentContext';
import { EscrowProvider } from './contexts/EscrowContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
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
import Contact from './pages/Contact';
import Escrow from './pages/Escrow';
import Investments from './pages/Investments';
import InvestmentDetail from './pages/InvestmentDetail';
import InvestorDashboard from './pages/InvestorDashboard';
import Mortgages from './pages/Mortgages';
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <InvestmentProvider>
          <EscrowProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/property/:id" element={<PropertyDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/search" element={<SearchResults />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/add-property" element={
                    <ProtectedRoute>
                      <AddProperty />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/escrow" element={
                    <ProtectedRoute>
                      <Escrow />
                    </ProtectedRoute>
                  } />
                  <Route path="/investments" element={
                    <ProtectedRoute>
                      <Investments />
                    </ProtectedRoute>
                  } />
                  <Route path="/investor-dashboard" element={
                    <ProtectedRoute>
                      <InvestorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/investment/:id" element={
                    <ProtectedRoute>
                      <InvestmentDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/mortgages" element={
                    <ProtectedRoute>
                      <Mortgages />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
          </EscrowProvider>
        </InvestmentProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App; 