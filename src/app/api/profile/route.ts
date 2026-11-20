
import { NextResponse, connection } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(50),
  age: z.coerce.number().int().min(18).max(100),
  photoUrl: z.string().url().max(2000).refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Photo must use a valid HTTP or HTTPS URL."
  ),
  bio: z.string().trim().min(10).max(300),
  city: z.string().trim().min(2).max(80),
  college: z.string().trim().max(100).optional().default(""),
  interests: z.array(z.string().trim().min(1).max(30)).min(1).max(10),
});

function parseInterests(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed;
    }
  } catch {
    // Return an empty list for invalid stored data.
  }

  return [];
}

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
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    if (!user.profile) {
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...user.profile,
        interests: parseInterests(user.profile.interests),
      },
    });
  } catch (error) {
    console.error("Profile GET error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load your profile." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Please sign in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const validation = profileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please check your profile details.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          profileId: true,
        },
      });

      if (!user) {
        return null;
      }

      const profileData = {
        name: data.name,
        age: data.age,
        photoUrl: data.photoUrl,
        bio: data.bio,
        city: data.city,
        college: data.college || null,
        interests: JSON.stringify(data.interests),
        isDemoUser: false,
      };

      if (user.profileId) {
        return tx.profile.update({
          where: { id: user.profileId },
          data: profileData,
        });
      }

      const profile = await tx.profile.create({
        data: profileData,
      });

      await tx.user.update({
        where: { id: user.id },
        data: { profileId: profile.id },
      });

      return profile;
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your profile has been saved.",
      profile: {
        ...result,
        interests: parseInterests(result.interests),
      },
    });
  } catch (error) {
    console.error("Profile POST error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to save your profile." },
      { status: 500 }
    );
  }
}
