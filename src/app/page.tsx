 
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

import {
  Heart,
  X,
  Sparkles,
  Users,
  Home,
  Compass,
  MessageCircle,
  MapPin,
  RotateCcw,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  city: string;
  college?: string | null;
  interests: string[];
};

type Match = {
  id: string;
  matchedAt: string;
  profile: Profile;
};

type Tab = "Home" | "Discover" | "Matches";

type FeedResponse = {
  success: boolean;
  profiles: Profile[];
  count: number;
  remaining: number;
  hasMore: boolean;
};

type MatchesResponse = {
  success: boolean;
  count: number;
  matches: Match[];
};

export default function DiscoverPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Discover");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [activeMatch, setActiveMatch] = useState<Profile | null>(null);

  const current = profiles[0] ?? null;

  const loadFeed = useCallback(async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/feed", {
        cache: "no-store",
      });

      const data: FeedResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Unable to load discovery profiles.");
      }

      setProfiles((old) =>
        append
          ? [
              ...old,
              ...data.profiles.filter(
                (p) => !old.some((existing) => existing.id === p.id)
              ),
            ]
          : data.profiles
      );

      setRemaining(data.remaining);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      const response = await fetch("/api/matches", {
        cache: "no-store",
      });

      const data: MatchesResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Unable to load matches.");
      }

      setMatches(data.matches);
    } catch (err) {
      console.error("Matches loading error:", err);
    }
  }, []);

   useEffect(() => {
  let active = true;

  async function initializeApp() {
    try {
      const response = await fetch("/api/profile", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to verify your profile.");
      }

      if (!data.profile) {
        router.replace("/onboarding");
        return;
      }

      if (active) {
        await Promise.all([loadFeed(), loadMatches()]);
      }
    } catch (error) {
      if (active) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to initialize the app."
        );
        setLoading(false);
      }
    }
  }

  void initializeApp();

  return () => {
    active = false;
  };
}, [loadFeed, loadMatches, router]);

  async function swipe(action: "LIKE" | "PASS") {
    if (!current || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: current.id,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to process your swipe."
        );
      }

      // Remove the swiped profile from the current feed.
      setProfiles((old) =>
        old.filter((profile) => profile.id !== current.id)
      );

      setRemaining((old) => Math.max(0, old - 1));

      // A real mutual match was confirmed by the backend.
      if (data.matched) {
        setActiveMatch(current);
        await loadMatches();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090f] text-white">

      {/* NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09090f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-10">

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500">
              <Heart size={20} fill="white" />
            </div>

            <span className="text-2xl font-black tracking-tight">
              discover<span className="text-pink-500">.</span>
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {(["Home", "Discover", "Matches"] as Tab[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`text-sm font-semibold transition ${
                  tab === item
                    ? "text-pink-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item}

                {item === "Matches" && matches.length > 0 && (
                  <span className="ml-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs text-white">
                    {matches.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400">
            <Sparkles
              className="mr-2 inline text-pink-400"
              size={14}
            />
            Discover connections
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:px-10">

        {tab === "Home" ? (
          <div className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-3xl bg-pink-500/10 p-6">
              <Heart size={48} className="text-pink-400" />
            </div>

            <h1 className="text-4xl font-black">
              Welcome to Coy<span className="text-pink-500">.</span>
            </h1>

            <p className="mt-4 text-gray-400">
              Discover people, find shared interests and build meaningful connections.
            </p>

            <button
              onClick={() => setTab("Discover")}
              className="mt-8 rounded-full bg-pink-500 px-8 py-3 font-bold text-black transition hover:bg-pink-400"
            >
              Start discovering
            </button>
          </div>

        ) : tab === "Matches" ? (

          /* MATCHES PAGE */
          <div className="mx-auto max-w-3xl">

            <h1 className="text-3xl font-black">
              Your matches<span className="text-pink-500">.</span>
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Mutual connections, all in one place.
            </p>

            {matches.length === 0 ? (
              <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">

                <Heart
                  className="mx-auto mb-4 text-pink-400"
                  size={40}
                />

                <h2 className="text-xl font-bold">
                  No matches yet
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  Keep discovering. Your next connection might be close.
                </p>

                <button
                  onClick={() => setTab("Discover")}
                  className="mt-6 rounded-full bg-pink-500 px-6 py-3 font-bold text-black"
                >
                  Explore profiles
                </button>
              </div>

            ) : (

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">

                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1"
                  >
                    <div
                      className="aspect-[4/5] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${match.profile.photoUrl})`,
                      }}
                    />

                    <div className="p-3">
                      <h3 className="font-bold">
                        {match.profile.name}, {match.profile.age}
                      </h3>

                      <p className="text-xs text-gray-400">
                        {match.profile.city}
                      </p>

                      <p className="mt-2 text-xs text-pink-400">
                        It&apos;s a match! ♥
                      </p>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

        ) : (

          /* DISCOVER PAGE */
          <div className="mx-auto max-w-5xl">

            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-400">
                  Find your connection
                </p>

                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                  Discover people<span className="text-pink-500">.</span>
                </h1>

                <p className="mt-3 text-gray-400">
                  Real possibilities start with a single swipe.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
                <Users className="mr-2 inline text-pink-400" size={16} />
                {remaining} profiles left
              </div>

            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* LOADING */}
            {loading ? (

              <div className="flex min-h-[500px] flex-col items-center justify-center">
                <Loader2
                  size={42}
                  className="animate-spin text-pink-400"
                />
                <p className="mt-4 text-gray-400">
                  Finding your connections...
                </p>
              </div>

            ) : profiles.length > 0 ? (

              <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">

                {/* PROFILE CARD */}
                <div className="relative mx-auto w-full max-w-[390px]">

                  <AnimatePresence mode="wait">

                    <ProfileSwipeCard
                      key={current!.id}
                      profile={current!}
                      onSwipe={swipe}
                      disabled={busy}
                    />

                  </AnimatePresence>

                </div>

                {/* DISCOVERY GUIDE */}
                <div className="hidden space-y-6 lg:block">

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

                    <Sparkles
                      className="mb-4 text-pink-400"
                      size={26}
                    />

                    <h2 className="text-2xl font-bold">
                      A little swipe. A real connection.
                    </h2>

                    <p className="mt-3 leading-7 text-gray-400">
                      Like someone who catches your attention.
                      When they like you back, it&apos;s a mutual match.
                    </p>

                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">

                    <h3 className="font-bold">
                      Your discovery guide
                    </h3>

                    <div className="mt-5 space-y-4 text-sm text-gray-400">
                      <p>
                        <Heart className="mr-3 inline text-pink-400" />
                        Right swipe to like
                      </p>

                      <p>
                        <X className="mr-3 inline" />
                        Left swipe to pass
                      </p>

                      <p>
                        <Users className="mr-3 inline text-pink-400" />
                        Mutual likes create matches
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            ) : (

              /* EMPTY FEED */
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">

                <Sparkles
                  size={48}
                  className="mb-5 text-pink-400"
                />

                <h2 className="text-2xl font-black">
                  You&apos;re all caught up!
                </h2>

                <p className="mt-3 max-w-sm text-sm text-gray-400">
                  You&apos;ve explored all the profiles in this batch.
                  New connections might still be waiting.
                </p>

                {remaining > 0 ? (
                  <button
                    disabled={loadingMore}
                    onClick={() => loadFeed(true)}
                    className="mt-7 rounded-full bg-pink-500 px-6 py-3 font-bold text-black"
                  >
                    {loadingMore ? (
                      <Loader2 className="mr-2 inline animate-spin" size={16} />
                    ) : (
                      <RefreshCw className="mr-2 inline" size={16} />
                    )}
                    Load more profiles
                  </button>
                ) : (
                  <button
                    onClick={() => loadFeed()}
                    className="mt-7 rounded-full bg-pink-500 px-6 py-3 font-bold text-black"
                  >
                    <RotateCcw className="mr-2 inline" size={16} />
                    Refresh feed
                  </button>
                )}

              </div>
            )}

          </div>
        )}

      </section>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#09090f]/95 px-5 py-3 backdrop-blur-xl md:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          {([
            ["Home", Home],
            ["Discover", Compass],
            ["Matches", MessageCircle],
          ] as const).map(([name, Icon]) => (

            <button
              key={name}
              onClick={() => setTab(name)}
              className={`flex flex-col items-center gap-1 text-xs font-semibold ${
                tab === name
                  ? "text-pink-400"
                  : "text-gray-500"
              }`}
            >
              <Icon size={22} />
              {name}

              {name === "Matches" && matches.length > 0 && (
                <span className="absolute -mt-2 ml-8 rounded-full bg-pink-500 px-1.5 text-[10px] text-black">
                  {matches.length}
                </span>
              )}
            </button>

          ))}

        </div>
      </nav>

      {/* REAL MATCH CELEBRATION */}
      <AnimatePresence>

        {activeMatch && (

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
          >

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="w-full max-w-sm rounded-[32px] border border-pink-500/30 bg-[#17111e] p-8 text-center"
            >

              <Sparkles
                className="mx-auto mb-4 text-pink-400"
                size={42}
              />

              <h2 className="text-4xl font-black">
                It&apos;s a match!
              </h2>

              <div
                className="mx-auto mt-6 h-28 w-28 rounded-full border-4 border-pink-500 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${activeMatch.photoUrl})`,
                }}
              />

              <p className="mt-5 text-gray-400">
                You and {activeMatch.name} liked each other.
              </p>

              <button
                onClick={() => {
                  setActiveMatch(null);
                  setTab("Matches");
                }}
                className="mt-8 w-full rounded-full bg-pink-500 py-4 font-black text-black"
              >
                See your matches
              </button>

              <button
                onClick={() => setActiveMatch(null)}
                className="mt-4 text-sm text-gray-400"
              >
                Keep discovering
              </button>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </main>
  );
}

/* REUSABLE SWIPE CARD */

function ProfileSwipeCard({
  profile,
  onSwipe,
  disabled,
}: {
  profile: Profile;
  onSwipe: (action: "LIKE" | "PASS") => void;
  disabled: boolean;
}) {
  const x = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);

  return (
    <motion.div
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onSwipe("LIKE");
        else if (info.offset.x < -100) onSwipe("PASS");
      }}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 250, rotate: 15 }}
      transition={{ duration: 0.25 }}
      className={`relative ${
        disabled ? "cursor-wait" : "cursor-grab active:cursor-grabbing"
      } touch-pan-y`}
      >

      {/* LIKE INDICATOR */}
       <motion.div
       className="pointer-events-none absolute left-5 top-5 z-10 rounded-lg border-2 border-green-400 px-4 py-2 font-black text-green-400"
       style={{ opacity: likeOpacity }}
      >
       LIKE
       </motion.div>

      {/* PASS INDICATOR */}
       <motion.div
       className="pointer-events-none absolute right-5 top-5 z-10 rounded-lg border-2 border-red-400 px-4 py-2 font-black text-red-400"
       style={{ opacity: passOpacity }}
      >
       PASS
      </motion.div>

      {/* PROFILE IMAGE */}
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#17171e] shadow-2xl shadow-black/50">

        <div
          className="relative h-[440px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${profile.photoUrl})`,
          }}
        >

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6">

            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/80">
              <MapPin size={14} />
              {profile.city}
            </div>

            <h2 className="text-4xl font-black">
              {profile.name}, {profile.age}
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/80">
              {profile.bio}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">

              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-md"
                >
                  {interest}
                </span>
              ))}

            </div>

          </div>

        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-6 flex items-center justify-center gap-7">

        <button
          disabled={disabled}
          onClick={() => onSwipe("PASS")}
          aria-label="Pass profile"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 shadow-xl transition hover:border-red-400 hover:text-red-400"
        >
          <X size={30} />
        </button>

        <button
          disabled={disabled}
          onClick={() => onSwipe("LIKE")}
          aria-label="Like profile"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-500 text-black shadow-xl shadow-pink-500/20 transition hover:scale-110 hover:bg-pink-400"
        >
          <Heart size={34} fill="currentColor" />
        </button>

      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        Swipe right to like · Swipe left to pass
      </p>

    </motion.div>
  );
}
