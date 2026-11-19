
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const demoUser = await prisma.user.findUnique({
      where: { profileId: "demo-user" },
      select: { id: true },
    });

    if (!demoUser) {
      return NextResponse.json(
        { success: false, error: "Demo user not found." },
        { status: 404 }
      );
    }

    const matches = await prisma.match.findMany({
      where: {
        userId: demoUser.id,
      },
      include: {
        profile: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const safeMatches = matches.map((match) => {
      let interests: string[] = [];

      try {
        const parsed: unknown = JSON.parse(
          match.profile.interests
        );

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
        id: match.id,
        matchedAt: match.createdAt,
        profile: {
          ...match.profile,
          interests,
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: safeMatches.length,
      matches: safeMatches,
    });
  } catch (error) {
    console.error("Matches API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch matches.",
      },
      { status: 500 }
    );
  }
}
