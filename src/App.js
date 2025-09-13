import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';
import { InvestmentProvider } from './contexts/InvestmentContext';
import { EscrowProvider } from './contexts/EscrowContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
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
              <div className="flex flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/property/:id" element={<PropertyDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/search" element={<SearchResults />} />
                  
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
                      <div className="flex w-full">
                        <Sidebar />
                        <main className="flex-1 ml-64">
                          <AdminDashboard />
                        </main>
                      </div>
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
                </Routes>
              </div>
              <Footer />
            </div>
          </EscrowProvider>
        </InvestmentProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App; 