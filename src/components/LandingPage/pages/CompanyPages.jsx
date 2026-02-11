import React from 'react';
import GenericPage from './GenericPage';
import { Mail, MapPin, Phone } from 'lucide-react';

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
            <p className="mb-4 text-gray-500">// Example API Request</p>
            <div className="text-blue-600">POST <span className="text-gray-900">https://api.finvois.com/v1/generate-report</span></div>
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

export const ContactPage = () => (
    <GenericPage title="Contact Us" subtitle="Get in touch with our team.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            <div className="space-y-8">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Our Office</h3>
                        <p className="text-gray-600">123 Innovation Street, Tech Park,<br />Bangalore, KA 560001</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
                        <p className="text-gray-600">support@finvois.com</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                        <Phone className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
                        <p className="text-gray-600">+91 98765 43210</p>
                    </div>
                </div>
            </div>

            <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                <input type="email" placeholder="Email Address" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all" />
                <textarea placeholder="Message" rows="4" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"></textarea>
                <button className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
                    Send Message
                </button>
            </form>
        </div>
    </GenericPage>
);
