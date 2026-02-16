import React, { useState } from 'react';
import { FaHome, FaEnvelope, FaCalendar, FaMoneyBillWave, FaUsers, FaFileContract, FaBell, FaUser } from 'react-icons/fa';

const sections = [
  { id: 'overview', label: 'Overview', icon: FaHome },
  { id: 'properties', label: 'Properties', icon: FaHome },
  { id: 'inquiries', label: 'Inquiries', icon: FaEnvelope },
  { id: 'inspections', label: 'Inspections', icon: FaCalendar },
  { id: 'earnings', label: 'Earnings', icon: FaMoneyBillWave },
  { id: 'team', label: 'Team', icon: FaUsers },
  { id: 'contracts', label: 'Contracts', icon: FaFileContract },
  { id: 'notifications', label: 'Notifications', icon: FaBell },
  { id: 'profile', label: 'Profile', icon: FaUser }
];

const VendorDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-blue">Vendor Dashboard</h2>
          <div>
            <h1 className="text-2xl font-bold mb-4">Contracts</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Contracts: <span className="font-mono bg-gray-100 px-2 py-1 rounded">2</span></span>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => {/* upload contract logic */}}>Upload Contract</button>
            <div>
              <h1 className="text-2xl font-bold mb-4">Profile</h1>
              <div className="mb-6 flex items-center">
                <img src="https://via.placeholder.com/64" alt="Profile" className="w-16 h-16 rounded-full mr-4 border" />
                <div>
                  <div className="text-gray-600 text-sm mb-1">Vendor ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">VND-123456</span></div>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-blue-700 transition text-xs" onClick={() => {/* upload picture logic */}}>Upload Picture</button>
                </div>
              </div>
              <form className="bg-white rounded-xl shadow border border-gray-200 p-6 max-w-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Aisha" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Mohammed" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="aisha.mohammed@propertyowner.com" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+2348012345678" />
                </div>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">Save Changes</button>
              </form>
              <div className="mt-4 text-xs text-gray-400">Edit your profile information and upload a profile picture.</div>
            </div>
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Example contract rows, replace with dynamic data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Lease Agreement - Ikoyi Apartment</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Active</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><a href="#" className="text-blue-600 hover:underline">View PDF</a></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-gray-600 hover:underline mr-2" onClick={() => {/* edit logic */}}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* delete logic */}}>Delete</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Sales Contract - Medical Apartment</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Completed</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><a href="#" className="text-blue-600 hover:underline">View PDF</a></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-gray-600 hover:underline mr-2" onClick={() => {/* edit logic */}}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* delete logic */}}>Delete</button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Upload, view, edit, and delete contracts. Document management enabled.</div>
          </div>
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2 ${activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <section.icon className="h-5 w-5" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {activeSection === 'overview' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-blue-600">12</div>
                <div className="text-xs text-gray-500 mt-1">Properties</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-green-600">₦2,500,000</div>
                <div className="text-xs text-gray-500 mt-1">Earnings</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-yellow-600">5</div>
                <div className="text-xs text-gray-500 mt-1">Inquiries</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-gray-600">3</div>
                <div className="text-xs text-gray-500 mt-1">Inspection Requests</div>
              </div>
            </div>
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <ul className="space-y-3">
                <li className="text-sm text-gray-700">Property "Luxury Apartment in Ikoyi" approved.</li>
                <li className="text-sm text-gray-700">Inspection scheduled for "Medical Professional Apartment".</li>
                <li className="text-sm text-gray-700">New inquiry from Oluwaseun Akoma.</li>
                <li className="text-sm text-gray-700">Earnings payout requested.</li>
              </ul>
            </div>
            {/* Quick Actions */}
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* add property logic */}}>Add Property</button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => {/* request payout logic */}}>Request Payout</button>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition" onClick={() => {/* view notifications logic */}}>View Notifications</button>
            </div>
            <div className="mt-4 text-xs text-gray-400">Quick stats, recent activity, and shortcuts to key actions.</div>
          </div>
        )}
        {activeSection === 'properties' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Properties</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Vendor ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">VND-123456</span></span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* refresh logic */}}>Refresh</button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => {/* open add property modal */}}>Add Property</button>
            </div>
            {/* Property Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-blue-600">12</div>
                <div className="text-xs text-gray-500 mt-1">Total Properties</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-green-600">7</div>
                <div className="text-xs text-gray-500 mt-1">For Sale</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-yellow-600">4</div>
                <div className="text-xs text-gray-500 mt-1">For Rent</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-gray-600">1</div>
                <div className="text-xs text-gray-500 mt-1">For Lease</div>
              </div>
            </div>
            {/* Property Listing Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Example property rows, replace with dynamic data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Luxury Apartment in Ikoyi</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">For Sale</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">₦420,000,000</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => {/* edit logic */}}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* delete logic */}}>Delete</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Medical Professional Apartment</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">For Rent</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">₦750,000/month</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => {/* edit logic */}}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* delete logic */}}>Delete</button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Local storage fallback enabled for offline property management.</div>
          </div>
        )}
        {activeSection === 'inquiries' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Inquiries</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Inquiries: <span className="font-mono bg-gray-100 px-2 py-1 rounded">5</span></span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* refresh logic */}}>Refresh</button>
            </div>
            {/* Inquiry List Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Example inquiry rows, replace with dynamic data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Luxury Apartment in Ikoyi</td>
                    <td className="px-6 py-4 whitespace-nowrap">Oluwaseun Akoma</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">New</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-green-600 hover:underline mr-2" onClick={() => {/* reply logic */}}>Reply</button>
                      <button className="text-gray-600 hover:underline" onClick={() => {/* mark as read logic */}}>Mark as Read</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Medical Professional Apartment</td>
                    <td className="px-6 py-4 whitespace-nowrap">Fatima Ibrahim</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Read</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-green-600 hover:underline mr-2" onClick={() => {/* reply logic */}}>Reply</button>
                      <button className="text-gray-600 hover:underline" onClick={() => {/* mark as unread logic */}}>Mark as Unread</button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Quick reply and status management enabled for buyer inquiries.</div>
          </div>
        )}
        {activeSection === 'inspections' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Inspection Requests</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Requests: <span className="font-mono bg-gray-100 px-2 py-1 rounded">3</span></span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* refresh logic */}}>Refresh</button>
            </div>
            {/* Inspection Requests Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Example inspection rows, replace with dynamic data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Luxury Apartment in Ikoyi</td>
                    <td className="px-6 py-4 whitespace-nowrap">Oluwaseun Akoma</td>
                    <td className="px-6 py-4 whitespace-nowrap">2026-02-18</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Pending</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-green-600 hover:underline mr-2" onClick={() => {/* approve logic */}}>Approve</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* reject logic */}}>Reject</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Medical Professional Apartment</td>
                    <td className="px-6 py-4 whitespace-nowrap">Fatima Ibrahim</td>
                    <td className="px-6 py-4 whitespace-nowrap">2026-02-19</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Approved</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-gray-600 hover:underline mr-2" onClick={() => {/* view logic */}}>View</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* reject logic */}}>Reject</button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
            {/* Inspection Analytics */}
            <div className="mt-4 text-xs text-gray-400">Analytics and status management enabled for inspection requests.</div>
          </div>
        )}
        {activeSection === 'earnings' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Earnings</h1>
            {/* Earnings Summary */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Earnings: <span className="font-mono bg-green-100 px-2 py-1 rounded">₦2,500,000</span></span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* payout logic */}}>Request Payout</button>
            </div>
            {/* Earnings Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-green-600">₦1,200,000</div>
                <div className="text-xs text-gray-500 mt-1">Paid Out</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-blue-600">₦1,300,000</div>
                <div className="text-xs text-gray-500 mt-1">Pending</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="text-lg font-bold text-gray-600">₦0</div>
                <div className="text-xs text-gray-500 mt-1">Failed</div>
              </div>
            </div>
            {/* Transaction History Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Example transaction rows, replace with dynamic data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">2026-02-10</td>
                    <td className="px-6 py-4 whitespace-nowrap">₦500,000</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Paid Out</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-gray-600 hover:underline" onClick={() => {/* view logic */}}>View</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">2026-02-14</td>
                    <td className="px-6 py-4 whitespace-nowrap">₦1,000,000</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Pending</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-gray-600 hover:underline" onClick={() => {/* view logic */}}>View</button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Earnings summary, payout actions, and transaction history available.</div>
          </div>
        )}
        {activeSection === 'team' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Team</h1>
            <p className="text-gray-700">Manage your team members and roles.</p>
          <div>
            <h1 className="text-2xl font-bold mb-4">Team Management</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Members: <span className="font-mono bg-gray-100 px-2 py-1 rounded">4</span></span>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => {/* add member logic */}}>Add Member</button>
            </div>
            {/* Team Member List Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Example team member rows, replace with dynamic data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Emeka Okafor</td>
                    <td className="px-6 py-4 whitespace-nowrap">Agent</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => {/* edit logic */}}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* remove logic */}}>Remove</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Fatima Ibrahim</td>
                    <td className="px-6 py-4 whitespace-nowrap">Manager</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Pending</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => {/* edit logic */}}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* remove logic */}}>Remove</button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Add, edit, and remove team members. Manage roles and permissions.</div>
          </div>
            <h1 className="text-2xl font-bold mb-4">Contracts</h1>
            <p className="text-gray-700">View and manage contracts.</p>
          </div>
        )}
        {activeSection === 'notifications' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            <p className="text-gray-700">See your notifications and alerts.</p>
          <div>
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Notifications: <span className="font-mono bg-gray-100 px-2 py-1 rounded">6</span></span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* refresh logic */}}>Refresh</button>
            </div>
            {/* Notification List Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Example notification rows, replace with dynamic data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Property Approved</td>
                    <td className="px-6 py-4 whitespace-nowrap">Your property has been approved!</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Read</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-gray-600 hover:underline mr-2" onClick={() => {/* mark as unread logic */}}>Mark as Unread</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* delete logic */}}>Delete</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Inspection Scheduled</td>
                    <td className="px-6 py-4 whitespace-nowrap">Inspection for Medical Apartment is scheduled.</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Unread</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-green-600 hover:underline mr-2" onClick={() => {/* mark as read logic */}}>Mark as Read</button>
                      <button className="text-red-600 hover:underline" onClick={() => {/* delete logic */}}>Delete</button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Real-time updates and status management enabled for notifications.</div>
          </div>
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <p className="text-gray-700">Edit your vendor profile and settings.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;
