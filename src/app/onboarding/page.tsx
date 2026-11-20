
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Heart,
  Sparkles,
  Camera,
  MapPin,
  GraduationCap,
  Loader2,
  Check,
  ArrowLeft,
} from "lucide-react";

const INTEREST_OPTIONS = [
  "Technology",
  "Music",
  "Travel",
  "Photography",
  "Fitness",
  "Movies",
  "Gaming",
  "Reading",
  "Food",
  "Art",
  "Sports",
  "Nature",
  "Startups",
  "Design",
  "Dancing",
];

type ProfileData = {
  name: string;
  age: string;
  photoUrl: string;
  bio: string;
  city: string;
  college: string;
  interests: string[];
};

const initialProfile: ProfileData = {
  name: "",
  age: "",
  photoUrl: "",
  bio: "",
  city: "",
  college: "",
  interests: [],
};

export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] = useState<ProfileData>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingProfile, setExistingProfile] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load profile.");
        }

        if (data.profile && active) {
          setExistingProfile(true);
          setForm({
            name: data.profile.name || "",
            age: String(data.profile.age || ""),
            photoUrl: data.profile.photoUrl || "",
            bio: data.profile.bio || "",
            city: data.profile.city || "",
            college: data.profile.college || "",
            interests: data.profile.interests || [],
          });
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  function updateField(
    field: keyof ProfileData,
    value: string
  ) {
    setForm((old) => ({ ...old, [field]: value }));
  }

  function toggleInterest(interest: string) {
    setForm((old) => ({
      ...old,
      interests: old.interests.includes(interest)
        ? old.interests.filter((item) => item !== interest)
        : old.interests.length < 10
          ? [...old.interests, interest]
          : old.interests,
    }));
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.interests.length === 0) {
      setError("Please select at least one interest.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save profile.");
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090f] text-white">
        <Loader2 className="animate-spin text-pink-400" size={36} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090f] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-pink-500 p-2">
              <Heart size={19} fill="white" />
            </div>
            <span className="text-xl font-black">
              coy<span className="text-pink-500">.</span>
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </header>

        <section className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-2 text-xs font-bold text-pink-400">
            <Sparkles size={15} />
            YOUR DISCOVERY PROFILE
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Your story,
            <br />
            your <span className="text-pink-500">connection.</span>
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-gray-400">
            Tell people a little about yourself. The best connections
            start with being yourself.
          </p>
        </section>

        <form
          onSubmit={saveProfile}
          className="space-y-7 rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-8"
        >
          <div>
            <label className="mb-3 block text-sm font-semibold">
              Profile photo URL
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <Camera className="text-gray-500" size={30} />
                )}
              </div>

              <div className="flex-1">
                <input
                  required
                  type="url"
                  value={form.photoUrl}
                  onChange={(e) => updateField("photoUrl", e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-3 text-sm outline-none transition focus:border-pink-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Use a publicly accessible image URL.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Your name
              </label>
              <input
                required
                minLength={2}
                maxLength={50}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="What should people call you?"
                className="w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-3 outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Age (18+)
              </label>
              <input
                required
                type="number"
                min={18}
                max={100}
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="Your age"
                className="w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-3 outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                <MapPin size={15} className="mr-2 inline text-pink-400" />
                City
              </label>
              <input
                required
                maxLength={80}
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="e.g. Delhi"
                className="w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-3 outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                <GraduationCap size={15} className="mr-2 inline text-pink-400" />
                College (optional)
              </label>
              <input
                maxLength={100}
                value={form.college}
                onChange={(e) => updateField("college", e.target.value)}
                placeholder="Your college"
                className="w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-3 outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold">Your bio</label>
              <span className="text-xs text-gray-500">
                {form.bio.length}/300
              </span>
            </div>

            <textarea
              required
              minLength={10}
              maxLength={300}
              rows={4}
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Tell people what makes you, you..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-3 leading-6 outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold">
                Your interests
              </label>
              <span className="text-xs text-pink-400">
                {form.interests.length}/10 selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = form.interests.includes(interest);

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                      selected
                        ? "border-pink-500 bg-pink-500 text-black"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-pink-500/50"
                    }`}
                  >
                    {selected && <Check size={14} />}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-4 font-black text-black transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={19} />
                Saving your profile...
              </>
            ) : (
              <>
                {existingProfile ? "Update my profile" : "Create my profile"}
                <Sparkles size={18} />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            By continuing, you confirm that you are at least 18 years old.
          </p>
        </form>

        <p className="mt-8 text-center text-xs text-gray-600">
          Made for meaningful connections.
        </p>
      </div>
    </main>
  );
}
