import React from 'react';
import { Award, ShieldCheck, Printer, Download, X, Sparkles } from 'lucide-react';

export default function CertificateModal({ certificate, onClose }) {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const getAwardTitle = (type) => {
    switch (type) {
      case 'WINNER_1ST': return 'FIRST PLACE - GOLD MEDAL';
      case 'WINNER_2ND': return 'SECOND PLACE - SILVER MEDAL';
      case 'WINNER_3RD': return 'THIRD PLACE - BRONZE MEDAL';
      default: return 'OFFICIAL CERTIFICATE OF PARTICIPATION';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Award className="w-5 h-5" /> Official Verified Certificate
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <Printer className="w-4 h-4" /> Print / Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Render Canvas */}
        <div className="p-8 sm:p-12 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40 text-slate-100 printable-certificate">
          
          {/* Certificate Gold Frame Border */}
          <div className="border-4 border-double border-amber-500/60 p-8 rounded-2xl relative bg-slate-950/60">
            
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Award className="w-96 h-96 text-amber-400" />
            </div>

            {/* Certificate Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-lg shadow-amber-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-xs uppercase tracking-[0.3em] font-extrabold text-amber-400">
                CAMPUS VIBE NON-TECHNICAL FESTIVALS
              </h2>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 font-serif tracking-wide">
                Certificate of Excellence
              </h1>
              <p className="text-xs text-amber-300/80 font-medium mt-1">
                {getAwardTitle(certificate.type)}
              </p>
            </div>

            {/* Recipient Details */}
            <div className="my-8 text-center space-y-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                This is proudly presented to
              </p>
              <h3 className="text-3xl sm:text-4xl font-bold text-amber-200 underline decoration-amber-500/40 underline-offset-8">
                {certificate.student_name}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Department of {certificate.department || 'Computer Science'}
              </p>
              
              <p className="max-w-2xl mx-auto text-sm text-slate-300 leading-relaxed pt-2">
                for outstanding talent and active participation in <span className="font-bold text-indigo-300">{certificate.competition_name || certificate.event_title}</span> held during <span className="font-semibold text-white">{certificate.event_title}</span> on {certificate.event_date || certificate.issue_date}.
              </p>
            </div>

            {/* Footer Signatures & QR Code */}
            <div className="mt-12 pt-6 border-t border-amber-500/20 flex flex-wrap items-end justify-between gap-6">
              
              {/* Signature 1 */}
              <div className="text-center">
                <div className="h-10 text-amber-400 font-serif italic text-lg font-bold">
                  Dr. K. S. Rao
                </div>
                <div className="w-36 h-0.5 bg-slate-700 mx-auto my-1"></div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Faculty Coordinator</p>
              </div>

              {/* Verification Stamp & Code */}
              <div className="text-center bg-slate-900/80 p-3 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4" /> VERIFIED OFFICIAL
                </div>
                <div className="font-mono text-[10px] text-amber-300 font-bold tracking-wider">
                  {certificate.certificate_code}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Issued: {certificate.issue_date}
                </div>
              </div>

              {/* Signature 2 */}
              <div className="text-center">
                <div className="h-10 text-amber-400 font-serif italic text-lg font-bold">
                  Dr. R. N. Mukherjee
                </div>
                <div className="w-36 h-0.5 bg-slate-700 mx-auto my-1"></div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Principal / Final Admin</p>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
