import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find the demo user.
    const demoUser = await prisma.user.findUnique({
      where: {
        profileId: "demo-user",
      },
      select: {
        id: true,
        profileId: true,
      },
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: "Demo user not found. Run the database seed first." },
        { status: 404 }
      );
    }

    // Fetch profiles that the demo user has not swiped on.
    const where = {
      isDemoUser: false,
      outgoingSwipes: {
        none: {
          actorId: demoUser.profileId,
        },
      },
    };

    const [profiles, remaining] = await Promise.all([
      prisma.profile.findMany({
        where,
        select: {
          id: true,
          name: true,
          age: true,
          photoUrl: true,
          bio: true,
          city: true,
          college: true,
          interests: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 20,
      }),

      prisma.profile.count({ where }),
    ]);

    // Convert stored JSON strings into arrays.
    const safeProfiles = profiles.map((profile) => {
      let interests: string[] = [];

      try {
        const parsed: unknown = JSON.parse(profile.interests);

        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          interests = parsed;
        }
      } catch {
        interests = [];
      }

      return {
        ...profile,
        interests,
      };
    });

    return NextResponse.json({
      success: true,
      profiles: safeProfiles,
      count: safeProfiles.length,
      remaining,
      hasMore: remaining > safeProfiles.length,
    });
  } catch (error) {
    console.error("Feed API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch discovery feed." },
      { status: 500 }
    );
  }
}