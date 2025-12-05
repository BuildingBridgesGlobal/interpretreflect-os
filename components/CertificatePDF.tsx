"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type CertificateData = {
  certificate_number: string;
  title: string;
  description?: string;
  ceu_value: number;
  rid_category: string;
  rid_subcategory?: string;
  issued_at: string;
  completed_at?: string;
  time_spent_minutes?: number;
  assessment_score?: number;
  learning_objectives_achieved?: { id: string; objective: string; verb?: string }[];
  user_name?: string;
  user_email?: string;
};

type Props = {
  certificate: CertificateData;
  onClose: () => void;
};

export default function CertificatePDF({ certificate, onClose }: Props) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    setDownloading(true);

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CEU-Certificate-${certificate.certificate_number}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }

    setDownloading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl p-6 max-w-5xl w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-100">CEU Certificate</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Certificate Preview */}
        <div className="overflow-auto mb-6 border border-slate-700 rounded-lg">
          <div
            ref={certificateRef}
            className="bg-white p-8 min-w-[900px]"
            style={{ aspectRatio: "1.414/1" }}
          >
            {/* Certificate Design */}
            <div className="h-full flex flex-col border-4 border-teal-600 p-8 relative">
              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-teal-600" />
              <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-teal-600" />
              <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-teal-600" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-teal-600" />

              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-teal-600 text-sm font-medium tracking-widest mb-2">
                  INTERPRET REFLECT
                </div>
                <h1 className="text-3xl font-serif text-gray-800 mb-1">
                  Certificate of Completion
                </h1>
                <p className="text-gray-500 text-sm">
                  Continuing Education Units (CEUs)
                </p>
              </div>

              {/* Recipient */}
              <div className="text-center mb-6">
                <p className="text-gray-600 text-sm mb-1">This is to certify that</p>
                <p className="text-2xl font-serif text-gray-800 border-b-2 border-gray-300 inline-block px-8 py-2">
                  {certificate.user_name || "Participant"}
                </p>
              </div>

              {/* Achievement */}
              <div className="text-center mb-6">
                <p className="text-gray-600 text-sm mb-2">has successfully completed</p>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                  {certificate.title}
                </h2>
                {certificate.description && (
                  <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                    {certificate.description}
                  </p>
                )}
              </div>

              {/* CEU Details */}
              <div className="flex justify-center gap-12 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600">
                    {certificate.ceu_value}
                  </div>
                  <div className="text-sm text-gray-600">CEU Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-800">
                    {certificate.rid_category}
                  </div>
                  <div className="text-sm text-gray-600">RID Category</div>
                </div>
                {certificate.assessment_score && (
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-800">
                      {certificate.assessment_score}%
                    </div>
                    <div className="text-sm text-gray-600">Assessment Score</div>
                  </div>
                )}
              </div>

              {/* Learning Objectives */}
              {certificate.learning_objectives_achieved && certificate.learning_objectives_achieved.length > 0 && (
                <div className="mb-6 px-4">
                  <p className="text-sm font-medium text-gray-700 mb-2 text-center">
                    Learning Objectives Achieved:
                  </p>
                  <ul className="text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1 max-w-3xl mx-auto">
                    {certificate.learning_objectives_achieved.map((obj, idx) => (
                      <li key={obj.id || idx} className="flex items-start gap-1">
                        <span className="text-teal-600">•</span>
                        <span>{obj.objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto">
                <div className="flex justify-between items-end px-8">
                  <div className="text-center">
                    <div className="text-gray-800 font-medium mb-1">
                      {formatDate(certificate.issued_at)}
                    </div>
                    <div className="text-xs text-gray-500 border-t border-gray-300 pt-1 px-4">
                      Date of Issue
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-gray-800 font-mono text-sm mb-1">
                      {certificate.certificate_number}
                    </div>
                    <div className="text-xs text-gray-500 border-t border-gray-300 pt-1 px-4">
                      Certificate Number
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-gray-800 font-medium mb-1">
                      RID Sponsor #2309
                    </div>
                    <div className="text-xs text-gray-500 border-t border-gray-300 pt-1 px-4">
                      Approved Provider
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4 text-xs text-gray-400">
                  Building Bridges Global • InterpretReflect Platform • www.interpretreflect.com
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="px-5 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
