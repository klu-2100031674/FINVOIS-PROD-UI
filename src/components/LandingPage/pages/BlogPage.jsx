import React from 'react';
import GenericPage from './GenericPage';

const posts = [
    {
        category: "Finance",
        title: "Guide to MSME Loan Schemes in 2025",
        excerpt: "A comprehensive breakdown of the latest government initiatives for small businesses.",
        author: "Finance Team",
        date: "Oct 12, 2025",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800"
    },
    {
        category: "Technology",
        title: "How AI is Revolutionizing Banking Reports",
        excerpt: "Explore the impact of artificial intelligence on financial documentation accuracy.",
        author: "Tech Lead",
        date: "Sep 28, 2025",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"
    },
    {
        category: "Success Stories",
        title: "Case Study: From Reject to Approved",
        excerpt: "How one startup used Finvois to secure a ₹50L Mudra loan after initial rejection.",
        author: "Customer Success",
        date: "Sep 15, 2025",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800"
    }
];

const BlogPage = () => {
    return (
        <GenericPage
            title="Latest Updates"
            subtitle="Insights, news, and guides from the world of finance and technology."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {posts.map((post, idx) => (
                    <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-purple-700">
                                {post.category}
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 font-manrope mb-3 leading-snug group-hover:text-purple-700 transition-colors">
                                {post.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                                <span>{post.author}</span>
                                <span>{post.date}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </GenericPage>
    );
};

export default BlogPage;
