import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                PropertyArk ("we", "us", or "our") operates the website <a href="https://www.propertyark.africa" className="text-amber-600 hover:underline">https://www.propertyark.africa</a> and related services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform to buy, sell, rent, and invest in real estate properties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Account information: name, email address, phone number, password</li>
                <li>Profile information: avatar, role (buyer, seller, vendor, investor)</li>
                <li>Property listings: photos, descriptions, locations, pricing</li>
                <li>Communication: messages between users, inquiries about properties</li>
                <li>Verification documents: KYC documents, identification</li>
              </ul>
              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Device and browser information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, clicks, interactions)</li>
                <li>Cookies and similar technologies</li>
              </ul>
              <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">2.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Google: When you sign in with Google, we receive your name, email, and profile picture</li>
                <li>Payment providers: Transaction metadata (we do not store card details)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>To create and manage your account</li>
                <li>To facilitate property transactions, escrow services, and investments</li>
                <li>To communicate with you about your account, transactions, and platform updates</li>
                <li>To verify your identity and prevent fraud</li>
                <li>To provide customer support</li>
                <li>To improve our services and develop new features</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Other users: Property listing details and contact information as needed for transactions</li>
                <li>Service providers: Payment processors, cloud storage, email services</li>
                <li>Legal authorities: When required by law or to protect our rights</li>
                <li>Business transfers: In connection with a merger or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures including encryption, secure socket layer (SSL) technology, and access controls. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Access and review your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-2">
                To exercise these rights, contact us at <a href="mailto:support@propertyark.africa" className="text-amber-600 hover:underline">support@propertyark.africa</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies for authentication, session management, and analytics. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed">
                Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the updated policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy, contact us at:
              </p>
              <p className="text-gray-700">
                Email: <a href="mailto:support@propertyark.africa" className="text-amber-600 hover:underline">support@propertyark.africa</a><br />
                Website: <a href="https://www.propertyark.africa" className="text-amber-600 hover:underline">https://www.propertyark.africa</a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link to="/" className="text-amber-600 hover:underline">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
