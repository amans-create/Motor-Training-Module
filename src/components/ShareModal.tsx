import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Smartphone, Monitor, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId?: string;
  moduleTitle?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  moduleTitle
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Construct absolute URL with parameters
  const baseUrl = window.location.origin + window.location.pathname;
  const shareableUrl = moduleId
    ? `${baseUrl}?role=learner&module=${encodeURIComponent(moduleId)}`
    : `${baseUrl}?role=learner`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate lightweight SVG QR code representation for easy mobile scan
  const encodedText = encodeURIComponent(shareableUrl);
  // High reliability quickchart / Google QR svg or direct standard QR image endpoint
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedText}&bgcolor=ffffff&color=1e3a8a&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Share Module with Associates
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {moduleTitle && (
            <div className="mb-4 text-xs text-slate-600 bg-blue-50/60 border border-blue-100 rounded-lg p-2.5 text-left">
              <span className="font-semibold text-blue-700">Selected Module: </span>
              {moduleTitle}
            </div>
          )}

          {/* QR Code for Phone Scan */}
          <div className="flex flex-col items-center justify-center mb-5">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-inner inline-block">
              <img
                src={qrCodeUrl}
                alt="Scan to open on mobile"
                referrerPolicy="no-referrer"
                className="w-40 h-40 object-contain rounded-lg"
                onError={(e) => {
                  // Fallback if network blocked
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>Scan with mobile camera to open instantly on phones</span>
            </div>
          </div>

          {/* Shareable Link Input & Copy */}
          <div className="text-left mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Direct Desktop & Mobile Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left text-[11px] text-slate-500">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
              <Monitor className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Works on call-center agent desktop monitors</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Full responsive layout for iOS & Android smartphones</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
