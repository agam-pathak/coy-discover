
"use client";

import { useState, type FormEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { Heart, MailCheck, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Email address is missing. Please register again.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter your six-digit verification code.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      setVerified(true);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090d] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-pink-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/20">
            <Heart className="h-8 w-8 fill-white text-white" />
          </div>

          <h1 className="text-3xl font-bold">
            Verify your <span className="text-pink-400">email</span>
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            One quick step before you discover your connection.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          {verified ? (
            <div className="py-5 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <MailCheck className="h-8 w-8 text-emerald-400" />
              </div>

              <h2 className="text-xl font-semibold">Email verified!</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Your email address has been verified successfully. You can now
                sign in to Coy Discover.
              </p>

              <button
                onClick={() => router.push("/login")}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3.5 text-sm font-semibold transition hover:brightness-110"
              >
                Continue to login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10">
                  <MailCheck className="h-7 w-7 text-pink-400" />
                </div>

                <h2 className="text-xl font-semibold">Enter verification code</h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  We sent a six-digit code to
                </p>

                <p className="mt-1 break-all text-sm font-medium text-pink-300">
                  {email || "Your registered email"}
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="mb-3 block text-center text-sm font-medium text-zinc-300">
                    Six-digit OTP
                  </label>

                  <input
                    ref={inputRef}
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-5 text-center text-3xl font-bold tracking-[0.5em] text-white outline-none transition placeholder:text-zinc-700 focus:border-pink-500/70 focus:ring-2 focus:ring-pink-500/10"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || !email}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3.5 text-sm font-semibold shadow-lg shadow-pink-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify email
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
                Your verification code expires after 10 minutes. If it expires,
                a new code must be requested.
              </p>
            </>
          )}
        </div>
      </motion.section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#09090d] text-zinc-400">
          Loading verification...
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
