import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp, FaTelegram } from 'react-icons/fa';

const Contact = () => {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    subject: '',
    message: '' 
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: FaPhone,
      title: 'Phone',
      details: ['+234 800 123 4567', '+234 800 123 4568'],
      description: 'Call us for immediate assistance'
    },
    {
      icon: FaEnvelope,
      title: 'Email',
      details: ['info@propertyark.com', 'support@propertyark.com'],
      description: 'Send us an email anytime'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Office Locations',
      details: ['123 Victoria Island, Lagos', '456 CBD, Abuja'],
      description: 'Visit our offices'
    },
    {
      icon: FaClock,
      title: 'Business Hours',
      details: ['Mon-Fri: 8AM-6PM', 'Sat: 9AM-4PM'],
      description: 'We\'re here to help'
    }
  ];

  const socialContacts = [
    {
      icon: FaWhatsapp,
      name: 'WhatsApp',
      contact: '+234 800 123 4567',
      description: 'Quick assistance via WhatsApp'
    },
    {
      icon: FaTelegram,
      name: 'Telegram',
      contact: '@PropertyArkSupport',
      description: 'Get help through Telegram'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-600">
          Get in touch with our team for any questions or assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="p-3 bg-brand-blue bg-opacity-10 rounded-lg">
                    <info.icon className="text-brand-blue text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{info.description}</p>
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-gray-700 font-medium">{detail}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Support</h3>
            <div className="space-y-4">
              {socialContacts.map((social, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-brand-blue transition-colors">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <social.icon className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{social.name}</p>
                    <p className="text-sm text-gray-600">{social.contact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
            
          {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent Successfully!</h3>
                <p className="text-gray-600">Thank you for contacting us. We'll get back to you within 24 hours.</p>
              </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      placeholder="Enter your email address"
                  required
                />
              </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="property">Property Information</option>
                      <option value="investment">Investment Opportunities</option>
                      <option value="mortgage">Mortgage Services</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="Tell us how we can help you..."
                  required
                />
              </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="privacy"
                      className="mt-1 h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="privacy" className="text-sm text-gray-600">
                      I agree to the <a href="#" className="text-brand-blue hover:underline">Privacy Policy</a> and 
                      <a href="#" className="text-brand-blue hover:underline"> Terms of Service</a>. 
                      I consent to being contacted by PropertyArk regarding my inquiry.
                    </label>
                  </div>
                </div>

              <button
                type="submit"
                  className="w-full btn-primary py-3 text-lg"
              >
                Send Message
              </button>
            </form>
          )}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Find Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Lagos Office</h3>
            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center">
                <FaMapMarkerAlt className="text-brand-blue text-2xl mx-auto mb-2" />
                <p className="text-gray-600">123 Victoria Island</p>
                <p className="text-gray-600">Lagos, Nigeria</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Abuja Office</h3>
            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center">
                <FaMapMarkerAlt className="text-brand-blue text-2xl mx-auto mb-2" />
                <p className="text-gray-600">456 Central Business District</p>
                <p className="text-gray-600">Abuja, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;


