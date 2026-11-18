
"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, X, Sparkles, Users, Home, Compass, MessageCircle, MapPin, RotateCcw } from "lucide-react";

const profiles = [
  {
    id: "p1",
    name: "Aarav",
    age: 22,
    city: "Delhi",
    bio: "Chasing sunsets, good conversations and spontaneous adventures.",
    interests: ["Travel", "Photography", "Music"],
    image: "photo-1500648767791-00dcc994a43e",
    likedYou: true,
  },
  {
    id: "p2",
    name: "Ananya",
    age: 21,
    city: "Gurgaon",
    bio: "Coffee enthusiast. Finding beauty in the little things.",
    interests: ["Coffee", "Art", "Reading"],
    image: "photo-1534528741775-53994a69daeb",
    likedYou: false,
  },
  {
    id: "p3",
    name: "Rohan",
    age: 23,
    city: "Noida",
    bio: "Tech by day, explorer by weekend.",
    interests: ["Technology", "Fitness", "Travel"],
    image: "photo-1506794778202-cad84cf45f1d",
    likedYou: true,
  },
  {
    id: "p4",
    name: "Meera",
    age: 22,
    city: "Delhi",
    bio: "Books, mountains and meaningful conversations.",
    interests: ["Books", "Nature", "Movies"],
    image: "photo-1524504388940-b1c1722653e1",
    likedYou: false,
  },
  {
    id: "p5",
    name: "Kabir",
    age: 24,
    city: "Gurgaon",
    bio: "Building things and collecting memories.",
    interests: ["Startups", "Music", "Sports"],
    image: "photo-1507003211169-0a1dd7228f2d",
    likedYou: true,
  },
  {
    id: "p6",
    name: "Isha",
    age: 21,
    city: "Noida",
    bio: "Creative soul with an adventurous heart.",
    interests: ["Design", "Dance", "Travel"],
    image: "photo-1529139574466-a303027c1d8b",
    likedYou: false,
  },
];

type Profile = (typeof profiles)[number];
type Tab = "Home" | "Discover" | "Matches";

export default function DiscoverPage() {
  const [tab, setTab] = useState<Tab>("Discover");
  const [index, setIndex] = useState(0);
  const [swiped, setSwiped] = useState<string[]>([]);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [activeMatch, setActiveMatch] = useState<Profile | null>(null);

  const current = profiles[index];

  function swipe(action: "like" | "pass") {
    if (!current || swiped.includes(current.id)) return;

    if (action === "like" && current.likedYou) {
      setMatches((old) =>
        old.some((p) => p.id === current.id) ? old : [...old, current]
      );
      setActiveMatch(current);
    }

    setSwiped((old) => [...old, current.id]);
    setIndex((old) => old + 1);
  }

  const remaining = profiles.length - swiped.length;

  return (
    <main className="min-h-screen bg-[#09090f] text-white">
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
                  tab === item ? "text-pink-400" : "text-gray-400 hover:text-white"
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
            <Sparkles className="mr-2 inline text-pink-400" size={14} />
            Discover connections
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:px-10">
        {tab === "Home" ? (
          <div className="min-h-[65vh]" />
        ) : tab === "Matches" ? (
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-black">Your matches</h1>
            <p className="mt-2 text-sm text-gray-400">
              Mutual connections, all in one place.
            </p>

            {matches.length === 0 ? (
              <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
                <Heart className="mx-auto mb-4 text-pink-400" size={40} />
                <h2 className="text-xl font-bold">No matches yet</h2>
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
                {matches.map((profile) => (
                  <div key={profile.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div
                      className="aspect-[4/5] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(https://images.unsplash.com/${profile.image}?auto=format&fit=crop&w=600&q=80)`,
                      }}
                    />
                    <div className="p-3">
                      <h3 className="font-bold">{profile.name}, {profile.age}</h3>
                      <p className="text-xs text-gray-400">{profile.city}</p>
                      <p className="mt-2 text-xs text-pink-400">It's a match! ♥</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
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

            <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
              <div className="relative mx-auto w-full max-w-[390px]">
                {current ? (
                  <AnimatePresence mode="wait">
                    <ProfileSwipeCard
                      key={current.id}
                      profile={current}
                      onSwipe={swipe}
                    />
                  </AnimatePresence>
                ) : (
                  <div className="flex min-h-[540px] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center">
                    <Sparkles className="mb-5 text-pink-400" size={48} />
                    <h2 className="text-2xl font-black">You're all caught up!</h2>
                    <p className="mt-3 text-sm text-gray-400">
                      You've explored every available profile.
                    </p>
                    <button
                      onClick={() => {
                        setIndex(0);
                        setSwiped([]);
                      }}
                      className="mt-7 rounded-full bg-pink-500 px-6 py-3 font-bold text-black"
                    >
                      <RotateCcw className="mr-2 inline" size={16} />
                      Start again
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden space-y-6 lg:block">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                  <Sparkles className="mb-4 text-pink-400" size={26} />
                  <h2 className="text-2xl font-bold">A little swipe. A real connection.</h2>
                  <p className="mt-3 leading-7 text-gray-400">
                    Like someone who catches your attention. When they like you
                    back, it's a mutual match.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                  <h3 className="font-bold">Your discovery guide</h3>
                  <div className="mt-5 space-y-4 text-sm text-gray-400">
                    <p><Heart className="mr-3 inline text-pink-400" /> Right swipe to like</p>
                    <p><X className="mr-3 inline text-gray-400" /> Left swipe to pass</p>
                    <p><Users className="mr-3 inline text-pink-400" /> Mutual likes create matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

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
                tab === name ? "text-pink-400" : "text-gray-500"
              }`}
            >
              <Icon size={22} />
              {name}
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {activeMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="w-full max-w-sm rounded-[32px] border border-pink-500/30 bg-[#17111e] p-8 text-center"
            >
              <Sparkles className="mx-auto mb-4 text-pink-400" size={42} />
              <h2 className="text-4xl font-black">It's a match!</h2>
              <p className="mt-3 text-gray-400">
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
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ProfileSwipeCard({
  profile,
  onSwipe,
}: {
  profile: Profile;
  onSwipe: (action: "like" | "pass") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onSwipe("like");
        else if (info.offset.x < -100) onSwipe("pass");
      }}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 250, rotate: 15 }}
      transition={{ duration: 0.25 }}
      className="relative cursor-grab touch-pan-y active:cursor-grabbing"
    >
      <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-lg border-2 border-green-400 px-4 py-2 font-black text-green-400" style={{ opacity: likeOpacity }}>
        LIKE
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-10 rounded-lg border-2 border-red-400 px-4 py-2 font-black text-red-400" style={{ opacity: passOpacity }}>
        PASS
      </div>

      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#17171e] shadow-2xl shadow-black/50">
        <div
          className="relative h-[440px] bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/${profile.image}?auto=format&fit=crop&w=900&q=85)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/80">
              <MapPin size={14} /> {profile.city}
            </div>
            <h2 className="text-4xl font-black">{profile.name}, {profile.age}</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">{profile.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-7">
        <button
          onClick={() => onSwipe("pass")}
          aria-label="Pass profile"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 shadow-xl transition hover:border-red-400 hover:text-red-400"
        >
          <X size={30} />
        </button>
        <button
          onClick={() => onSwipe("like")}
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
