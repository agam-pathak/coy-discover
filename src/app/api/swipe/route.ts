 
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
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

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          profile: { select: { id: true } },
        },
      });

      if (!user?.profile) {
        return { status: "profile_required" as const };
      }

      const actorId = user.profile.id;

      if (targetId === actorId) {
        return { status: "self_swipe" as const };
      }

      const target = await tx.profile.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          isDemoUser: true,
          user: { select: { id: true } },
        },
      });

      if (!target || target.isDemoUser) {
        return { status: "target_missing" as const };
      }

      const existingSwipe = await tx.swipe.findUnique({
        where: {
          actorId_targetId: { actorId, targetId },
        },
      });

      if (existingSwipe) {
        return { status: "already_swiped" as const };
      }

      const swipe = await tx.swipe.create({
        data: { actorId, targetId, action },
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

      if (action === "LIKE") {
        const reverseSwipe = await tx.swipe.findFirst({
          where: {
            actorId: targetId,
            targetId: actorId,
            action: "LIKE",
          },
        });

        if (reverseSwipe) {
          const match = await tx.match.upsert({
            where: {
              userId_profileId: {
                userId: user.id,
                profileId: targetId,
              },
            },
            create: {
              userId: user.id,
              profileId: targetId,
            },
            update: {},
            select: { id: true },
          });

          // If the target profile belongs to a registered user,
          // create the reciprocal match for that user too.
          if (target.user) {
            await tx.match.upsert({
              where: {
                userId_profileId: {
                  userId: target.user.id,
                  profileId: actorId,
                },
              },
              create: {
                userId: target.user.id,
                profileId: actorId,
              },
              update: {},
            });
          }

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

    if (result.status === "profile_required") {
      return NextResponse.json(
        {
          success: false,
          error: "Complete your profile before swiping.",
          code: "PROFILE_REQUIRED",
        },
        { status: 409 }
      );
    }

    if (result.status === "self_swipe") {
      return NextResponse.json(
        { success: false, error: "You cannot swipe on your own profile." },
        { status: 400 }
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
        message: result.matched ? "It's a match!" : "Swipe recorded successfully.",
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
