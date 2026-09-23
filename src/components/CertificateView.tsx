import React, { useState } from 'react';
import { Certificate } from '../types';
import { goldSealImage } from '../assets/images';
import { Printer, Calendar, Award, CheckCircle, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface CertificateViewProps {
  certificates: Certificate[];
  employeeCode: string;
  learnerName: string;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  certificates,
  employeeCode,
  learnerName
}) => {
  // Filter certificates for this employee
  const userCerts = certificates.filter(
    c => c.employeeCode.toUpperCase() === employeeCode.toUpperCase()
  );

  // Group by month
  const availableMonths = Array.from(new Set(userCerts.map(c => c.monthYear)));
  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths[0] || 'September 2026'
  );

  const filteredCerts = userCerts.filter(c => c.monthYear === selectedMonth);
  const [activeCert, setActiveCert] = useState<Certificate | null>(
    filteredCerts[0] || userCerts[0] || null
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Monthly Training Certificates</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified proof of completed motor insurance process modules for {learnerName} ({employeeCode}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Select Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  const matched = userCerts.find(c => c.monthYear === e.target.value);
                  if (matched) setActiveCert(matched);
                }}
                className="bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {activeCert && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          )}
        </div>
      </div>

      {userCerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            No Certificates Earned Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Complete your scheduled motor insurance video training module and score at least 60% on the quiz to earn your official monthly certificate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Certificate Selection List */}
          <div className="lg:col-span-1 space-y-2.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Earned This Month ({filteredCerts.length})
            </div>
            {filteredCerts.map((cert) => {
              const isSelected = activeCert?.id === cert.id;
              return (
                <div
                  key={cert.id}
                  onClick={() => setActiveCert(cert)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>{cert.dedicatedDate}</span>
                    <span className="font-semibold text-emerald-600">{cert.score}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                    {cert.moduleTitle}
                  </h4>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    {cert.certificateNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* High-Fidelity Printable Certificate Preview */}
          <div className="lg:col-span-3">
            {activeCert && (
              <div
                id="printable-certificate"
                className="bg-white rounded-2xl border-8 border-double border-amber-600/30 p-8 md:p-12 shadow-xl relative overflow-hidden text-center text-slate-900"
                style={{
                  backgroundImage: 'radial-gradient(ellipse at center, rgba(254, 252, 232, 0.4) 0%, rgba(255, 255, 255, 1) 100%)'
                }}
              >
                {/* Vintage Watermark Corner Accents */}
                <div className="absolute top-3 left-3 w-16 h-16 border-t-2 border-l-2 border-amber-600/40 pointer-events-none"></div>
                <div className="absolute top-3 right-3 w-16 h-16 border-t-2 border-r-2 border-amber-600/40 pointer-events-none"></div>
                <div className="absolute bottom-3 left-3 w-16 h-16 border-b-2 border-l-2 border-amber-600/40 pointer-events-none"></div>
                <div className="absolute bottom-3 right-3 w-16 h-16 border-b-2 border-r-2 border-amber-600/40 pointer-events-none"></div>

                {/* Institution Banner */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold tracking-[0.25em] text-blue-800 uppercase mb-1">
                    Motor Insurance Process Quality & Training Academy
                  </div>
                  <div className="text-xs text-slate-500 font-serif italic">
                    Policybazaar Process Compliance Division
                  </div>
                </div>

                {/* Header Title */}
                <h1
                  className="text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-wider mb-2 font-serif"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  Certificate of Process Mastery
                </h1>
                <p className="text-xs text-amber-700 font-medium tracking-wide uppercase mb-6">
                  Awarded for Flawless Call Implementation & Policy Advisory
                </p>

                {/* Subtitle */}
                <p className="text-xs text-slate-600 mb-2">
                  This officially certifies that
                </p>

                {/* Recipient Name */}
                <div className="text-2xl md:text-3xl font-bold text-blue-900 border-b-2 border-amber-500/50 pb-2 inline-block px-8 mb-2 font-serif">
                  {activeCert.learnerName}
                </div>
                <div className="text-xs text-slate-500 font-mono mb-6">
                  Employee Code: <span className="font-semibold text-slate-700">{activeCert.employeeCode}</span>
                </div>

                {/* Achievement Description */}
                <p className="text-xs md:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed mb-6">
                  Has successfully concluded the mandatory process training module, verified call advisory scripts, and scored <strong className="text-slate-900">{activeCert.score}</strong> on the dedicated process evaluation for:
                </p>

                {/* Module Title Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-w-lg mx-auto mb-8">
                  <div className="text-sm font-bold text-slate-900">
                    "{activeCert.moduleTitle}"
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Dedicated Training Date: {activeCert.dedicatedDate} · Month of {activeCert.monthYear}
                  </div>
                </div>

                {/* Signatures & Seal Section */}
                <div className="grid grid-cols-3 items-end max-w-xl mx-auto pt-4 border-t border-slate-200 text-left">
                  {/* Left: Issue Date & Hash */}
                  <div className="text-xs text-slate-600">
                    <div className="text-[10px] text-slate-400 uppercase font-mono mb-0.5">Issued On</div>
                    <div className="font-semibold text-slate-800">{activeCert.issueDate}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-1">
                      ID: {activeCert.certificateNumber}
                    </div>
                  </div>

                  {/* Center: Official Gold Seal */}
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={goldSealImage}
                      alt="Gold Excellence Seal"
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 md:w-24 md:h-24 object-contain filter drop-shadow-md"
                    />
                    <div className="text-[9px] font-bold text-amber-800 uppercase tracking-widest mt-1">
                      Verified Authentic
                    </div>
                  </div>

                  {/* Right: Trainer Signature */}
                  <div className="text-right">
                    <div className="font-serif italic text-base text-slate-800 border-b border-slate-300 pb-1 mb-1">
                      {activeCert.trainerSignature || 'Authorized Quality Lead'}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 uppercase">
                      Process Trainer Signature
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
