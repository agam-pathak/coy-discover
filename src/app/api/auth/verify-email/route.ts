
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  email: z.string().trim().email().max(255),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits."),
});

function hashOtp(otp: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return createHmac("sha256", secret)
    .update(otp)
    .digest("hex");
}

function safeCompare(a: string, b: string) {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");

  return (
    bufferA.length === bufferB.length &&
    timingSafeEqual(bufferA, bufferB)
  );
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification details.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const email = validation.data.email.toLowerCase();
    const submittedHash = hashOtp(validation.data.otp);

    const result = await prisma.$transaction(async (tx) => {
      const challenge = await tx.otpChallenge.findFirst({
        where: {
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          consumedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!challenge) {
        return { status: "not_found" as const };
      }

      if (challenge.expiresAt <= new Date()) {
        await tx.otpChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        });

        return { status: "expired" as const };
      }

      if (challenge.attempts >= 5) {
        await tx.otpChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        });

        return { status: "too_many_attempts" as const };
      }

      if (!safeCompare(challenge.codeHash, submittedHash)) {
        const nextAttempts = challenge.attempts + 1;

        await tx.otpChallenge.update({
          where: { id: challenge.id },
          data: {
            attempts: nextAttempts,
            ...(nextAttempts >= 5
              ? { consumedAt: new Date() }
              : {}),
          },
        });

        return {
          status: nextAttempts >= 5
            ? "too_many_attempts" as const
            : "invalid" as const,
        };
      }

      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true },
      });

      if (!user) {
        await tx.otpChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        });

        return { status: "user_not_found" as const };
      }

      if (!user.emailVerified) {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }

      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      return { status: "verified" as const };
    });

    if (result.status === "not_found") {
      return NextResponse.json(
        { success: false, error: "No active verification code found. Request a new code." },
        { status: 404 }
      );
    }

    if (result.status === "expired") {
      return NextResponse.json(
        { success: false, error: "Verification code expired. Request a new one." },
        { status: 410 }
      );
    }

    if (result.status === "too_many_attempts") {
      return NextResponse.json(
        { success: false, error: "Too many incorrect attempts. Request a new code." },
        { status: 429 }
      );
    }

    if (result.status === "invalid") {
      return NextResponse.json(
        { success: false, error: "Incorrect verification code." },
        { status: 400 }
      );
    }

    if (result.status === "user_not_found") {
      return NextResponse.json(
        { success: false, error: "Registration account not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to verify email address." },
      { status: 500 }
    );
  }
}
