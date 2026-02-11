import React from 'react';
import GenericPage from './GenericPage';
import { Book, Code, FileQuestion, Terminal } from 'lucide-react';

const sections = [
    {
        icon: Book,
        title: "Getting Started",
        desc: "Everything you need to know to create your first project report."
    },
    {
        icon: Terminal,
        title: "API Reference",
        desc: "Detailed documentation for integrating with the Finvois API."
    },
    {
        icon: Code,
        title: "SDKs & Libraries",
        desc: "Official libraries for Python, Node.js, and other platforms."
    },
    {
        icon: FileQuestion,
        title: "FAQ",
        desc: "Answers to common questions about report generation and compliance."
    }
];

const DocumentationPage = () => {
    return (
        <GenericPage
            title="Documentation"
            subtitle="Learn how to integrate and use Finvois to automate your financial reporting."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sections.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                        <div key={idx} className="flex gap-6 p-8 bg-white rounded-2xl border border-gray-100 hover:border-purple-100 hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex-shrink-0 flex items-center justify-center text-purple-600">
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 font-manrope">{section.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{section.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </GenericPage>
    );
};

export default DocumentationPage;
