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
          error: "Complete your profile to view matches.",
          code: "PROFILE_REQUIRED",
        },
        { status: 409 }
      );
    }

    const matches = await prisma.match.findMany({
      where: { userId: session.user.id },
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
      orderBy: { createdAt: "desc" },
    });

    const safeMatches = matches.map((match) => {
      let interests: string[] = [];

      try {
        const parsed: unknown = JSON.parse(match.profile.interests);

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
      { success: false, error: "Unable to fetch matches." },
      { status: 500 }
    );
  }
}
