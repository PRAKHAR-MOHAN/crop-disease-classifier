import React, { useState } from "react";
import { Lock, ShieldCheck, Eye, EyeOff, ArrowRight, Sprout, UserCheck, Sparkles, CheckCircle2 } from "lucide-react";

export interface UserSession {
  username: string;
  role: "admin" | "operator";
  displayName: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: UserSession) => void;
  currentUser?: UserSession | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [role, setRole] = useState<"admin" | "operator">("operator");
  const [username, setUsername] = useState("agronomist_lead");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      username: username || (role === "admin" ? "admin_lead" : "field_scout"),
      role,
      displayName: role === "admin" ? "Lead Agronomist (Dr. Sharma)" : "Field Scout (Ramesh K.)",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden border border-[#1a3152] bg-gradient-to-br from-[#07111e] via-[#0a1626] to-[#060c15] shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#112238] border border-[#1d3b63] text-gray-400 hover:text-white flex items-center justify-center transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Left Hero Column */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#152a45] relative overflow-hidden bg-gradient-to-b from-[#0a182c]/60 via-[#071322]/40 to-[#040911]">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Top Brand */}
          <div className="space-y-3 relative z-10">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sprout className="w-5 h-5 text-gray-950 font-black" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                Crop<span className="text-cyan-400">Guard</span>
              </span>
            </div>

            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Agro Station Intelligence</span>
            </div>
          </div>

          {/* Core Value Headline */}
          <div className="my-8 sm:my-10 space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Better visibility. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-green-400">
                More confident decisions.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Monitor field crop station health, investigate foliar disease anomalies with calibrated ONNX AI, and review agronomic prescriptions from one workspace.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Role-based access for field scouts & expert agronomists</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Real-time spore pressure trends & Grad-CAM visual heatmaps</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="pt-4 border-t border-[#13233b] text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            CropGuard AI · Agro Data & Crop Health Monitoring
          </div>
        </div>

        {/* Right Form Card Column */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center bg-[#0a1626]/90 relative z-10">
          <div className="space-y-6">
            {/* Header Icon + Title */}
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#0f243d] border border-[#1f426c] flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                Welcome back
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Sign in to CropGuard
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your account credentials to access station feeds.
              </p>
            </div>

            {/* Role Switcher */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Sign in as
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    role === "admin"
                      ? "border-cyan-500 bg-cyan-950/40 text-white shadow-md shadow-cyan-950/50"
                      : "border-[#193252] bg-[#0c1c30] text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <ShieldCheck className={`w-4 h-4 ${role === "admin" ? "text-cyan-400" : "text-slate-500"}`} />
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      role === "admin" ? "border-cyan-400 bg-cyan-500/20" : "border-slate-600"
                    }`}>
                      {role === "admin" && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold">Administrator</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">Manage rules & prescriptions</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("operator")}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    role === "operator"
                      ? "border-cyan-500 bg-cyan-950/40 text-white shadow-md shadow-cyan-950/50"
                      : "border-[#193252] bg-[#0c1c30] text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <UserCheck className={`w-4 h-4 ${role === "operator" ? "text-cyan-400" : "text-slate-500"}`} />
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      role === "operator" ? "border-cyan-400 bg-cyan-500/20" : "border-slate-600"
                    }`}>
                      {role === "operator" && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold">Field Scout</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">Diagnose leaves & log anomalies</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#1c3656] bg-[#0a1828] text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1c3656] bg-[#0a1828] text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
              >
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom Security Note */}
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authorized access for verified agro operators</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
