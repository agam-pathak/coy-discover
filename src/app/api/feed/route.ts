import { NextResponse, connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    await connection();

    try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Please sign in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        profile: { select: { id: true } },
      },
    });

    if (!user?.profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Complete your profile to discover people.",
          code: "PROFILE_REQUIRED",
        },
        { status: 409 }
      );
    }

    const profileId = user.profile.id;

    const where = {
      id: { not: profileId },
      isDemoUser: false,
      incomingSwipes: {
        none: { actorId: profileId },
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
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
      prisma.profile.count({ where }),
    ]);

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

      return { ...profile, interests };
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
      { success: false, error: "Unable to fetch discovery feed." },
      { status: 500 }
    );
  }
}
