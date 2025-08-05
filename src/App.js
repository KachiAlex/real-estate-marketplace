import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';
import { EscrowProvider } from './contexts/EscrowContext';
import { InvestmentProvider } from './contexts/InvestmentContext';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import AddProperty from './pages/AddProperty';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Escrow from './pages/Escrow';
import Investments from './pages/Investments';
import InvestmentDetail from './pages/InvestmentDetail';
import Mortgages from './pages/Mortgages';
import SearchResults from './pages/SearchResults';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <EscrowProvider>
          <InvestmentProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/properties/:id" element={<PropertyDetail />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/add-property" element={
                    <ProtectedRoute>
                      <AddProperty />
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
                  <Route path="/investments/:id" element={
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
          </InvestmentProvider>
        </EscrowProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App; 