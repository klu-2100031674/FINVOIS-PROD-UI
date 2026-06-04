import { Link2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function FranchiseShareActions({ franchiseName }) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleWhatsApp = () => {
    const url = window.location.href;
    const text = `${franchiseName || 'Franchise'} - ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 px-4 py-2 border border-[#7e22ce] text-[#7e22ce] rounded-lg hover:bg-purple-50 text-sm font-medium"
      >
        <Link2 className="h-4 w-4" />
        Copy link
      </button>
      <button
        type="button"
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-2 px-4 py-2 border border-[#7e22ce] text-[#7e22ce] rounded-lg hover:bg-purple-50 text-sm font-medium"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </button>
    </div>
  );
}
