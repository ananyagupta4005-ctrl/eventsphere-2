import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { certificateAPI } from "../api";

const VerifyCertPage = () => {
  const { certId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificateAPI.verify(certId)
      .then(({ data }) => setResult(data))
      .catch(() => setResult({ success: false, valid: false, message: "Verification failed." }))
      .finally(() => setLoading(false));
  }, [certId]);

  const typeColors = {
    Participation:"#7C5CFF", Winner:"#FFD700", "Runner Up":"#2DD4BF",
    Volunteer:"#7C5CFF", Speaker:"#FF6B5B", Organizer:"#2DD4BF",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#2DD4BF] flex items-center justify-center">
            <Sparkles size={18} className="text-[#0A0A0F]" />
          </div>
          <span className="font-display text-xl text-[#F5F5F7]">EventSphere</span>
        </div>

        {loading ? (
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#8A8A9E] text-sm">Verifying certificate...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[#1F1F2E] bg-[#13131C] p-8 text-center">
            {result?.valid ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#2DD4BF]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-[#2DD4BF]" />
                </div>
                <h1 className="font-display text-2xl text-[#F5F5F7] mb-1">Certificate Verified ✓</h1>
                <p className="text-[#8A8A9E] text-sm mb-8">This certificate is authentic and valid.</p>

                <div className="rounded-2xl border border-dashed p-6 mb-6 text-left space-y-3"
                  style={{ borderColor: `${typeColors[result.data?.type] || "#7C5CFF"}55`, background: `${typeColors[result.data?.type] || "#7C5CFF"}0A` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Award size={20} style={{ color: typeColors[result.data?.type] || "#7C5CFF" }} />
                    <span className="font-display text-base" style={{ color: typeColors[result.data?.type] || "#7C5CFF" }}>
                      Certificate of {result.data?.type}
                    </span>
                  </div>
                  {[
                    ["Recipient", result.data?.recipientName],
                    ["Event", result.data?.eventName],
                    ["Date", result.data?.eventDate],
                    ["Certificate ID", result.data?.certificateId],
                    ["Issued On", result.data?.issuedAt && new Date(result.data.issuedAt).toLocaleDateString("en-IN")],
                  ].map(([label, value]) => value && (
                    <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-[#1F1F2E] last:border-0">
                      <span className="text-xs text-[#8A8A9E] font-mono uppercase tracking-wider">{label}</span>
                      <span className="text-sm text-[#F5F5F7] text-right font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs font-mono text-[#8A8A9E] bg-[#0A0A0F] rounded-xl px-4 py-3">
                  Issued by EventSphere · Tamper-proof verification
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#FF6B5B]/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="text-[#FF6B5B]" />
                </div>
                <h1 className="font-display text-2xl text-[#F5F5F7] mb-2">Invalid Certificate</h1>
                <p className="text-[#8A8A9E] text-sm">
                  {result?.message || "This certificate could not be verified. It may have been revoked or does not exist."}
                </p>
                <div className="mt-6 text-xs font-mono text-[#8A8A9E] bg-[#0A0A0F] rounded-xl px-4 py-3">
                  Certificate ID: {certId}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertPage;
