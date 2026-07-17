import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using PropertyArk (the "Service") at <a href="https://www.propertyark.africa" className="text-amber-600 hover:underline">https://www.propertyark.africa</a>, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                PropertyArk is an online platform that enables users to buy, sell, rent, and invest in real estate properties. The Service includes property listings, escrow services, messaging, investment opportunities, and mortgage facilitation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You may register using email/password or Google OAuth</li>
                <li>One person or entity may not maintain multiple accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Conduct</h2>
              <p className="text-gray-700 leading-relaxed">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Post false, misleading, or fraudulent property listings</li>
                <li>Harass, abuse, or threaten other users</li>
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to access unauthorized data or systems</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Use automated scripts or bots without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Property Listings</h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>You are responsible for the accuracy of your listings</li>
                <li>PropertyArk reserves the right to remove any listing that violates these terms</li>
                <li>Listings are subject to verification and review</li>
                <li>You grant PropertyArk a license to display your listing content on the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Escrow Services</h2>
              <p className="text-gray-700 leading-relaxed">
                PropertyArk facilitates escrow services for property transactions. Funds held in escrow are managed according to the terms agreed upon by the parties. PropertyArk acts as a neutral third party and does not provide legal advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Fees</h2>
              <p className="text-gray-700 leading-relaxed">
                PropertyArk may charge fees for certain services, including escrow transactions, premium listings, and investment facilitation. Fees will be clearly disclosed before any transaction is completed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service, including its design, logos, and content, is owned by PropertyArk and protected by intellectual property laws. User-generated content remains the property of the respective users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Disclaimers</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service is provided "as is" without warranties of any kind. PropertyArk does not guarantee the accuracy of property listings or the outcome of any transaction. Users should conduct their own due diligence.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                PropertyArk shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                PropertyArk may terminate or suspend your account at any time for violations of these Terms. You may close your account at any time by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by the laws of the Federal Republic of Nigeria, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact</h2>
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

export default TermsOfService;
