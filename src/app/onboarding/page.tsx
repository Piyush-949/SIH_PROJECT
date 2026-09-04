"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import {
  Sprout,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  Landmark,
  Globe,
  Sparkles,
  HelpCircle,
  MapPin,
  Search,
  Loader2,
  Check,
} from "lucide-react";
import { INDIAN_STATES } from "@/lib/data/indianStates";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateKycProfile, loginAsDemoRole } = useAuth();
  const { t, isHindi } = useTranslation();

  const [step, setStep] = useState<number>(1);
  const [aadhaar, setAadhaar] = useState<string>("");
  const [kisanId, setKisanId] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isGovVerified, setIsGovVerified] = useState<boolean>(false);
  const [govError, setGovError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>("");
  const [village, setVillage] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [pincode, setPincode] = useState<string>("");
  const [landAcres, setLandAcres] = useState<number>(5.0);

  // Bank Info
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [prefLang, setPrefLang] = useState<string>("en");

  // Location Autocomplete State
  const [villageSuggestions, setVillageSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [showVillageDropdown, setShowVillageDropdown] = useState<boolean>(false);
  const [pinLookupLoading, setPinLookupLoading] = useState<boolean>(false);
  const [pinOffices, setPinOffices] = useState<string[]>([]);
  const [autoFillBadge, setAutoFillBadge] = useState<string | null>(null);

  const villageDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        villageDropdownRef.current &&
        !villageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowVillageDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle typing in village input
  const handleVillageChange = (val: string) => {
    setVillage(val);
    if (val.trim().length >= 2) {
      setIsSearchingLocation(true);
      setShowVillageDropdown(true);
    } else {
      setVillageSuggestions([]);
      setShowVillageDropdown(false);
      setIsSearchingLocation(false);
    }
  };

  // Debounced search for village / city
  useEffect(() => {
    if (!village || village.trim().length < 2 || !showVillageDropdown) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/lookup?q=${encodeURIComponent(village.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setVillageSuggestions(data.results);
          }
        }
      } catch (err) {
        console.warn("[Location Search] error:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [village, showVillageDropdown]);

  // When farmer selects a location suggestion from dropdown
  const handleSelectLocation = (loc: {
    village: string;
    district: string;
    state: string;
    pincode: string;
  }) => {
    setVillage(loc.village);
    setDistrict(loc.district);
    setState(loc.state);
    setPincode(loc.pincode);
    setVillageSuggestions([]);
    setShowVillageDropdown(false);
    setAutoFillBadge(`Auto-populated: ${loc.village}, ${loc.district}, ${loc.state} (${loc.pincode})`);
    setTimeout(() => setAutoFillBadge(null), 6000);
  };

  // Reverse PIN Code Lookup
  const handlePincodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, "").slice(0, 6);
    setPincode(cleanPin);

    if (cleanPin.length === 6) {
      setPinLookupLoading(true);
      try {
        const res = await fetch(`/api/location/lookup?pincode=${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.district) {
            setDistrict(data.district);
            if (data.state) setState(data.state);
            if (data.villages && data.villages.length > 0) {
              setPinOffices(data.villages);
              if (!village || village === "Rampur" || village === "Karnal Rural") {
                setVillage(data.villages[0]);
              }
            }
            setAutoFillBadge(`Location verified from PIN ${cleanPin}: ${data.district}, ${data.state}`);
            setTimeout(() => setAutoFillBadge(null), 6000);
          }
        }
      } catch (err) {
        console.warn("[PIN Lookup] error:", err);
      } finally {
        setPinLookupLoading(false);
      }
    } else {
      setPinOffices([]);
    }
  };

  const handleVerifyGov = async () => {
    setGovError(null);
    const cleanAadhaar = aadhaar.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      setGovError("Aadhaar Number must be exactly 12 digits.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/validate-gov-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber: cleanAadhaar,
          kisanId: kisanId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setGovError(data.error || "Aadhaar validation failed.");
        setIsGovVerified(false);
        return;
      }

      setIsGovVerified(true);
      if (data.record) {
        if (data.record.kisanId) setKisanId(data.record.kisanId);
        if (data.record.fullName) setName(data.record.fullName);
        if (data.record.village) setVillage(data.record.village);
        if (data.record.district) setDistrict(data.record.district);
        if (data.record.state) setState(data.record.state);
        if (data.record.pincode) setPincode(data.record.pincode);
        if (data.record.landAreaAcres) setLandAcres(data.record.landAreaAcres);
      }
    } catch {
      setIsGovVerified(true);
    } finally {
      setIsVerifying(false);
    }
  };


  const handleComplete = async () => {
    if (!user) {
      alert("Please sign in with your mobile number first so your Aadhaar registration is linked to your account.");
      router.push("/login");
      return;
    }
    const success = await updateKycProfile({
      name: name.trim(),
      aadhaarNumber: aadhaar.replace(/\D/g, ""),
      kisanId: kisanId.trim(),
      village: village.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      bankAccountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      bankName: bankName.trim(),
      landAreaAcres: Number(landAcres) || 5.0,
    });
    if (success) {
      router.push("/farmer/dashboard");
    }
  };

  return (
    <div className="flex-1 bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SIH 2026 • Problem ID: 26032 Verified KYC Flow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.kyc.title}
          </h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            {t.kyc.subtitle}
          </p>
          {user?.phone ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Authenticated Mobile: <strong className="text-white font-mono">+91 {user.phone}</strong></span>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between gap-2 max-w-lg mx-auto mt-2">
              <span>Sign in with mobile number to bind this registration.</span>
              <Link href="/login" className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition text-[10px] whitespace-nowrap">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Multi-Step Stepper Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            {[
              { num: 1, title: t.kyc.step1 },
              { num: 2, title: t.kyc.step2 },
              { num: 3, title: t.kyc.step3 },
              { num: 4, title: t.kyc.step4 },
            ].map((s) => (
              <div
                key={s.num}
                className={`py-2 px-1 rounded-xl border transition flex flex-col items-center gap-1 ${
                  step === s.num
                    ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold shadow-xs"
                    : step > s.num
                    ? "bg-slate-900/60 border-slate-700 text-emerald-400"
                    : "bg-slate-900/30 border-slate-800 text-slate-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step === s.num
                      ? "bg-emerald-500 text-slate-900"
                      : step > s.num
                      ? "bg-emerald-900 text-emerald-300"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span className="hidden sm:inline text-[11px] truncate max-w-full">
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* STEP 1: Gov Identity Verification */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Government Registry Cross-Verification
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your Aadhaar Number and Kisan ID to perform real-time verification against the State Land & PM-KISAN database.
                </p>
              </div>

              {govError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold block">Verification Error:</span>
                    <span>{govError}</span>
                  </div>
                </div>
              )}

              {isGovVerified && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">{t.kyc.verifiedSuccess}</span>
                    <span className="text-[11px] text-emerald-200/80">
                      Farmer Name: {name} | Land: {landAcres} Acres | District: {district}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.aadhaarLabel}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaar}
                    onChange={(e) => {
                      setAadhaar(e.target.value.replace(/\D/g, ""));
                      setIsGovVerified(false);
                    }}
                    placeholder="123456789012"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-wider focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {t.kyc.kisanIdLabel}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      (Optional — auto-generated via AgriStack)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={kisanId}
                    onChange={(e) => {
                      setKisanId(e.target.value);
                      setIsGovVerified(false);
                    }}
                    placeholder="e.g. KID-HR-2026-001 (auto-assigned on verify)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono uppercase focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyGov}
                    disabled={isVerifying || aadhaar.replace(/\D/g, "").length !== 12}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <span>{isVerifying ? "Cross-Verifying with AgriStack & UIDAI..." : t.kyc.verifyGov}</span>
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Official UIDAI Gateway Note */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-400 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>UIDAI & PM-Kisan Gateway will instantly cross-verify your identity & land records.</span>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!isGovVerified}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-40"
                >
                  <span>Proceed to Profile Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Farmer Personal & Land Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  Farmer Profile & Agricultural Land
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm your agricultural holding and residential details.
                </p>
              </div>

              {/* Auto-filled notification badge */}
              {autoFillBadge && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white text-[11px]">{autoFillBadge}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.landLabel}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={landAcres}
                    onChange={(e) => setLandAcres(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Village / City with Autocomplete Dropdown */}
                <div className="relative" ref={villageDropdownRef}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {t.kyc.villageLabel} / City
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Type to auto-search list
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => handleVillageChange(e.target.value)}
                      onFocus={() => {
                        if (village.trim().length >= 2) setShowVillageDropdown(true);
                      }}
                      placeholder="e.g. Cuttack, Karnal, Rampur..."
                      className="w-full pl-8 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
                      required
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    {isSearchingLocation && (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-3 animate-spin pointer-events-none" />
                    )}
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {showVillageDropdown && (villageSuggestions.length > 0 || isSearchingLocation) && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                      {villageSuggestions.length > 0 ? (
                        villageSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectLocation(item)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-950/70 hover:text-emerald-300 transition flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">{item.village}</span>
                                <span className="text-[11px] text-slate-400 truncate block">
                                  {item.district}, {item.state}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 shrink-0 border border-slate-700">
                              {item.pincode}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Searching locations in India...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.districtLabel}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Cuttack, Karnal"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                {/* State with quick Select list */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.stateLabel}
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-emerald-500"
                    required
                  >
                    <option value="">Select State / UT</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PIN Code with Auto-lookup */}
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {t.kyc.pincodeLabel} (6 Digits)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Entering PIN auto-fills District & State
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="e.g. 753001 or 132001"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-widest focus:outline-hidden focus:border-emerald-500"
                      required
                    />
                    {pinLookupLoading && (
                      <Loader2 className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-3 animate-spin pointer-events-none" />
                    )}
                  </div>

                  {/* Village pills if found by PIN code */}
                  {pinOffices.length > 1 && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Post Offices in this PIN Code (click to select):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {pinOffices.map((po, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setVillage(po)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                              village === po
                                ? "bg-emerald-600 text-white font-bold"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {po}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  <span>Proceed to Bank Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Bank Account Details for DBT */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-400" />
                  Direct Benefit Transfer (DBT) Bank Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  MSP procurement payouts are credited directly to this verified bank account via PFMS.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.bankNameLabel}
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.accountLabel}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.kyc.ifscLabel}
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  <span>Review & Complete</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Language Preference */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Review & Complete Registration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify your details before completing KYC onboarding.
                </p>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-slate-500 block">Farmer Name:</span>
                    <span className="font-bold text-white">{name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kisan ID:</span>
                    <span className="font-mono text-emerald-400 font-bold">{kisanId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-slate-500 block">Aadhaar (Masked):</span>
                    <span className="font-mono text-slate-300">XXXX-XXXX-{aadhaar.slice(-4)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Landholding:</span>
                    <span className="font-bold text-white">{landAcres} Acres</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-slate-500 block">Location:</span>
                    <span className="text-slate-300">{village}, {district}, {state}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Bank Account:</span>
                    <span className="font-mono text-slate-300">{bankName} ({ifscCode})</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Preferred Portal Language:</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="radio"
                        name="lang"
                        value="en"
                        checked={prefLang === "en"}
                        onChange={() => setPrefLang("en")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>English</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="radio"
                        name="lang"
                        value="hi"
                        checked={prefLang === "hi"}
                        onChange={() => setPrefLang("hi")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>हिन्दी (Hindi)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.kyc.completeKyc}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
