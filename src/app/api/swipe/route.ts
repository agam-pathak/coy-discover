
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const swipeSchema = z.object({
  targetId: z.string().min(1).max(100),
  action: z.enum(["LIKE", "PASS"]),
});

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(request: Request) {
  try {
    // 1. Validate request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const validation = swipeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid swipe data.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { targetId, action } = validation.data;

    // 2. Perform swipe and matching atomically
    const result = await prisma.$transaction(async (tx) => {
      const demoUser = await tx.user.findUnique({
        where: { profileId: "demo-user" },
        select: { id: true, profileId: true },
      });

      if (!demoUser) {
        return { status: "demo_user_missing" as const };
      }

      // 3. Validate target profile
      const target = await tx.profile.findUnique({
        where: { id: targetId },
        select: { id: true, isDemoUser: true },
      });

      if (!target || target.isDemoUser) {
        return { status: "target_missing" as const };
      }

      // 4. Prevent duplicate swipes
      const existingSwipe = await tx.swipe.findUnique({
        where: {
          actorId_targetId: {
            actorId: demoUser.profileId,
            targetId,
          },
        },
      });

      if (existingSwipe) {
        return { status: "already_swiped" as const };
      }

      // 5. Save swipe
      const swipe = await tx.swipe.create({
        data: {
          actorId: demoUser.profileId,
          targetId,
          action,
        },
        select: {
          id: true,
          actorId: true,
          targetId: true,
          action: true,
          createdAt: true,
        },
      });

      let matched = false;
      let matchId: string | null = null;

      // 6. Check for a mutual LIKE
      if (action === "LIKE") {
        const reverseSwipe = await tx.swipe.findFirst({
          where: {
            actorId: targetId,
            targetId: demoUser.profileId,
            action: "LIKE",
          },
        });

        if (reverseSwipe) {
          const match = await tx.match.upsert({
            where: {
              userId_profileId: {
                userId: demoUser.id,
                profileId: targetId,
              },
            },
            create: {
              userId: demoUser.id,
              profileId: targetId,
            },
            update: {},
            select: { id: true },
          });

          matched = true;
          matchId = match.id;
        }
      }

      return {
        status: "created" as const,
        swipe,
        matched,
        matchId,
      };
    });

    // 7. Handle transaction outcomes
    if (result.status === "demo_user_missing") {
      return NextResponse.json(
        { success: false, error: "Demo user not found." },
        { status: 404 }
      );
    }

    if (result.status === "target_missing") {
      return NextResponse.json(
        { success: false, error: "Target profile not found." },
        { status: 404 }
      );
    }

    if (result.status === "already_swiped") {
      return NextResponse.json(
        { success: false, error: "You have already swiped on this profile." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.matched
          ? "It's a match!"
          : "Swipe recorded successfully.",
        swipe: result.swipe,
        matched: result.matched,
        matchId: result.matchId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Swipe API error:", error);

    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { success: false, error: "This profile has already been swiped." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to process swipe." },
      { status: 500 }
    );
  }
}
