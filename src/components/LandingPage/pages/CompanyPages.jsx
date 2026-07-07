import React, { useState } from 'react';
import GenericPage from './GenericPage';
import { Mail, MapPin, Phone, Send, Clock, CheckCircle } from 'lucide-react';
import apiClient from '@/api/apiClient';

export const HelpCenterPage = () => (
    <GenericPage title="Help Center" subtitle="Find answers to your questions and get support.">
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
            <div className="inline-block p-4 rounded-full bg-purple-50 text-purple-600 mb-6">
                <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold font-manrope mb-4">Contact Support</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Can't find what you're looking for? Our support team is here to help you 24/7.
            </p>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                Submit a Ticket
            </button>
        </div>
    </GenericPage>
);

export const APIPage = () => (
    <GenericPage title="API Reference" subtitle="Build powerful integrations with our robust API.">
        <div className="border border-gray-200 rounded-xl bg-gray-50 p-8 font-mono text-sm text-gray-700 overflow-x-auto">
            <p className="mb-4 text-gray-500">{'// Example API Request'}</p>
            <div className="text-[#7e22ce]">POST <span className="text-gray-900">https://api.finvois.com/v1/generate-report</span></div>
            <div className="mt-4 text-purple-600">
                Authorization: <span className="text-green-600">Bearer YOUR_API_KEY</span>
            </div>
            <div className="mt-4">
                {`{
  "project_type": "manufacturing",
  "investment": 5000000,
  "location": "IN-KA"
}`}
            </div>
        </div>
        <div className="mt-8 text-center">
            <button className="text-purple-600 font-bold hover:text-purple-800 underline">View Full Documentation</button>
        </div>
    </GenericPage>
);

export const AboutPage = () => (
    <GenericPage title="About Us" subtitle="We are on a mission to simplify financial reporting for everyone.">
        <div className="prose prose-lg mx-auto text-gray-600">
            <p className="mb-6">
                Finvois was founded with a simple goal: to make professional project reports accessible to every entrepreneur, regardless of their financial expertise.
            </p>
            <p>
                Our team consists of Chartered Accountants, Financial Analysts, and Software Engineers working together to build the most accurate and user-friendly reporting tools in the market.
            </p>
        </div>
    </GenericPage>
);

export const CareersPage = () => (
    <GenericPage title="Careers" subtitle="Join us in building the future of financial technology.">
        <div className="space-y-4 max-w-2xl mx-auto">
            {['Senior Frontend Engineer', 'Product Designer', 'Financial Analyst'].map((job, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-xl hover:border-purple-200 transition-colors cursor-pointer group">
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{job}</h3>
                        <p className="text-sm text-gray-500">Remote • Full-time</p>
                    </div>
                    <span className="text-purple-600 font-bold text-sm">Apply &rarr;</span>
                </div>
            ))}
        </div>
    </GenericPage>
);

export const PartnersPage = () => (
    <GenericPage title="Partners" subtitle="Grow your business by partnering with Finvois.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale">
            {/* Placeholders for logos */}
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400">
                    Partner {i}
                </div>
            ))}
        </div>
    </GenericPage>
);

export const ContactPage = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;
        setLoading(true);
        setError('');
        try {
            await apiClient.post('/support/general-contact', form);
            setSubmitted(true);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const contacts = [
        {
            icon: <MapPin className="w-5 h-5" />,
            label: 'Our Office',
            value: 'Finvois Open Business Solutions LLP, Rata Tata Innovation Hub Building, Vijayawada, Andhra Pradesh',
        },
        {
            icon: <Mail className="w-5 h-5" />,
            label: 'Email Us',
            value: 'support@finvois.com',
            href: 'mailto:support@finvois.com',
        },
        {
            icon: <Phone className="w-5 h-5" />,
            label: 'Call Us',
            value: '+91 96182 21011',
            href: 'tel:+919618221011',
        },
        {
            icon: <Clock className="w-5 h-5" />,
            label: 'Business Hours',
            value: 'Mon – Sat, 9:00 AM – 6:00 PM IST',
        },
    ];

    return (
        <GenericPage title="Contact Us" subtitle="We're here to help. Reach out and we'll get back to you within 24 hours.">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

                {/* Left — contact info */}
                <div className="lg:col-span-2 space-y-4">
                    {contacts.map((c, i) => (
                        <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#7e22ce] shrink-0">
                                {c.icon}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{c.label}</p>
                                {c.href
                                    ? <a href={c.href} className="text-gray-700 font-medium hover:text-[#7e22ce] transition-colors text-sm leading-snug">{c.value}</a>
                                    : <p className="text-gray-700 font-medium text-sm leading-snug">{c.value}</p>
                                }
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right — form */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                            <p className="text-gray-500 max-w-xs">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                            <button
                                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                                className="mt-6 px-6 py-2.5 bg-[#7e22ce] text-white rounded-xl text-sm font-semibold hover:bg-[#6b21a8] transition-colors"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Send us a message</h3>
                                <p className="text-sm text-gray-500">Fill in the details and we'll respond shortly.</p>
                            </div>

                            {error && (
                                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                                    <input
                                        type="text" name="name" value={form.name} onChange={handleChange} required
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7e22ce] focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address *</label>
                                    <input
                                        type="email" name="email" value={form.email} onChange={handleChange} required
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7e22ce] focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                                <input
                                    type="text" name="subject" value={form.subject} onChange={handleChange}
                                    placeholder="How can we help?"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7e22ce] focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message *</label>
                                <textarea
                                    name="message" value={form.message} onChange={handleChange} required rows={5}
                                    placeholder="Describe your question or issue in detail..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7e22ce] focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none text-sm"
                                />
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-[#7e22ce] text-white font-bold py-3.5 rounded-xl hover:bg-[#6b21a8] transition-colors disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {loading ? 'Sending…' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </GenericPage>
    );
};
