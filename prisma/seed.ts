
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const demoProfile = {
  id: "demo-user",
  name: "Agam",
  age: 22,
  photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  bio: "Building things, exploring new places and enjoying meaningful conversations.",
  city: "Delhi",
  college: "Demo University",
  interests: JSON.stringify(["Technology", "Travel", "Music"]),
  isDemoUser: true,
};

const names = [
  "Aarav", "Ananya", "Riya", "Kabir", "Meera",
  "Arjun", "Ishita", "Vivaan", "Sara", "Aditya",
  "Aanya", "Reyansh", "Kiara", "Dev", "Myra",
  "Atharv", "Diya", "Ishaan", "Tara", "Krish",
  "Saanvi", "Rohan", "Anvi", "Yash", "Navya",
  "Advait", "Zoya", "Dhruv", "Aditi", "Neil",
];

const cities = [
  "Delhi", "Gurgaon", "Noida", "Bangalore", "Mumbai",
  "Pune", "Jaipur", "Hyderabad", "Chandigarh", "Delhi",
];

const bios = [
  "Chasing sunsets, good conversations and spontaneous adventures.",
  "Coffee enthusiast, music lover and weekend explorer.",
  "Building dreams and collecting beautiful memories.",
  "Always up for a new adventure and meaningful connections.",
  "Books, beaches and conversations that last for hours.",
];

const interests = [
  ["Travel", "Photography", "Music"],
  ["Technology", "Movies", "Coffee"],
  ["Fitness", "Reading", "Travel"],
  ["Music", "Food", "Art"],
  ["Startups", "Gaming", "Photography"],
  ["Dance", "Fashion", "Movies"],
];

async function main() {
  console.log("Starting Coy Discover database seeding...");

  // Create the demo user's profile.
  await prisma.profile.upsert({
    where: { id: demoProfile.id },
    update: demoProfile,
    create: demoProfile,
  });

  // Create the demo application user.
  await prisma.user.upsert({
    where: { profileId: demoProfile.id },
    update: {},
    create: {
      profileId: demoProfile.id,
    },
  });

  console.log("Demo user created.");

  // Generate 30 deterministic profiles.
  for (let i = 0; i < names.length; i++) {
    const number = i + 1;
    const id = `profile-${String(number).padStart(2, "0")}`;

    const profile = {
      id,
      name: names[i],
      age: 20 + (i % 7),
      photoUrl: `https://randomuser.me/api/portraits/${
        i % 2 === 0 ? "men" : "women"
      }/${number}.jpg`,
      bio: bios[i % bios.length],
      city: cities[i % cities.length],
      college: "Demo Institute",
      interests: JSON.stringify(interests[i % interests.length]),
      isDemoUser: false,
    };

    await prisma.profile.upsert({
      where: { id },
      update: profile,
      create: profile,
    });
  }

  console.log("30 discoverable profiles created.");

  // Five profiles have secretly liked the demo user.
  const incomingLikes = [
    "profile-02",
    "profile-05",
    "profile-08",
    "profile-12",
    "profile-17",
  ];

  for (const actorId of incomingLikes) {
    await prisma.swipe.upsert({
      where: {
        actorId_targetId: {
          actorId,
          targetId: demoProfile.id,
        },
      },
      update: { action: "LIKE" },
      create: {
        actorId,
        targetId: demoProfile.id,
        action: "LIKE",
      },
    });
  }

  console.log("5 incoming likes seeded.");
  console.log("2 potential mutual matches are ready.");
  console.log("Coy Discover database seeding completed!");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
