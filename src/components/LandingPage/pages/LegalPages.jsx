import React from 'react';
import GenericPage from './GenericPage';

export const PrivacyPolicyPage = () => (
    <GenericPage title="Privacy Policy" subtitle="Last updated: October 25, 2025">
        <div className="max-w-4xl mx-auto text-left">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    At Finvois, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                </p>

                <div className="space-y-8">
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">1</span>
                            Information We Collect
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            We collect information that you provide directly to us, such as when you create an account, request a report, or contact customer support. This may include:
                        </p>
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {[
                                "Name and contact information",
                                "Financial data for report generation",
                                "Payment information (processed securely)",
                                "Usage data and preferences"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">2</span>
                            How We Use Your Information
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">We use the information we collect to:</p>
                        <ul className="space-y-3">
                            {[
                                "Provide, maintain, and improve our services",
                                "Generate financial reports as requested",
                                "Process transactions and send related information",
                                "Send you technical notices, updates, and support messages"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-600">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                                    <span className="leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">3</span>
                            Data Security
                        </h3>
                        <p className="text-gray-600 leading-relaxed bg-blue-50 p-6 rounded-xl border border-blue-100">
                            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Have questions?</h4>
                    <p className="text-gray-600">
                        Contact us at <a href="mailto:privacy@finvois.com" className="text-purple-600 hover:text-purple-700 font-medium">privacy@finvois.com</a>
                    </p>
                </div>
            </div>
        </div>
    </GenericPage>
);

export const TermsOfServicePage = () => (
    <GenericPage title="Terms of Service" subtitle="Last updated: October 25, 2025">
        <div className="max-w-4xl mx-auto text-left">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Please read these Terms of Service ("Terms") carefully before using the Finvois website and services.
                </p>

                <div className="space-y-8">
                    {[
                        {
                            title: "Acceptance of Terms",
                            content: "By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service."
                        },
                        {
                            title: "Description of Service",
                            content: "Finvois provides an AI-powered platform for generating financial project reports. The reports are generated based on data provided by the user and are for informational purposes only."
                        },
                        {
                            title: "User Accounts",
                            content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms."
                        },
                        {
                            title: "Intellectual Property",
                            content: "The service and its original content, features, and functionality are and will remain the exclusive property of Finvois and its licensors."
                        },
                        {
                            title: "Limitation of Liability",
                            content: "In no event shall Finvois, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages."
                        }
                    ].map((section, idx) => (
                        <section key={idx} className="border-b border-gray-50 pb-8 last:border-0 last:pb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                                <span className="text-gray-300 text-sm font-manrope">0{idx + 1}</span>
                                {section.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed pl-8 md:pl-0">
                                {section.content}
                            </p>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    </GenericPage>
);

export const CookiesPage = () => (
    <GenericPage title="Cookie Policy" subtitle="Last updated: October 25, 2025">
        <div className="max-w-4xl mx-auto text-left">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    This Cookie Policy explains how Finvois uses cookies and similar technologies to recognize you when you visit our website.
                </p>

                <div className="grid gap-6">
                    <div className="bg-gray-50 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">1. What are cookies?</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                        </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">2. Why do we use cookies?</h3>
                        <p className="text-gray-600 leading-relaxed">
                            We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies.
                        </p>
                    </div>

                    <div className="border border-gray-100 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <span className="block font-semibold text-purple-900 mb-1">Essential Cookies</span>
                                <span className="text-sm text-purple-700">Strictly necessary for the website to function.</span>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="block font-semibold text-blue-900 mb-1">Analytics Cookies</span>
                                <span className="text-sm text-blue-700">Help us understand how visitors interact with the website.</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">4. Your Control</h3>
                        <p className="text-gray-600 leading-relaxed">
                            You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </GenericPage>
);
