
import { NextResponse } from "next/server";
import { randomInt, createHmac } from "node:crypto";
import { hash } from "bcryptjs";
import { Resend } from "resend";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export async function POST(request: Request) {
  try {
    // 1. Validate registration details.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid registration details.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const name = validation.data.name;
    const email = validation.data.email.toLowerCase();
    const password = validation.data.password;

    // 2. Verify email configuration.
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      console.error("Resend environment variables are missing.");

      return NextResponse.json(
        { success: false, error: "Email service is not configured." },
        { status: 503 }
      );
    }

    // 3. Check whether this email is already verified.
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (existingUser?.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // 4. Hash password and generate OTP.
    const passwordHash = await hash(password, 12);
    const otp = randomInt(100000, 1000000).toString();
    const codeHash = hashOtp(otp);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 5. Save the user and OTP challenge atomically.
    const challenge = await prisma.$transaction(async (tx) => {
      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            passwordHash,
          },
          select: { id: true },
        });
      } else {
        await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
          },
          select: { id: true },
        });
      }

      // Invalidate previous unused registration OTPs.
      await tx.otpChallenge.updateMany({
        where: {
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      return tx.otpChallenge.create({
        data: {
          identifier: email,
          channel: "EMAIL",
          purpose: "REGISTRATION",
          codeHash,
          expiresAt,
        },
        select: { id: true },
      });
    });

    // 6. Send the actual verification email.
    const resend = new Resend(apiKey);
    const safeName = escapeHtml(name);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Verify your Coy Discover account",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#222">
          <h1 style="color:#e84b86">Welcome to Coy Discover!</h1>
          <p>Hi ${safeName},</p>
          <p>Use the verification code below to verify your email address.</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f8f1f5;text-align:center;border-radius:12px">
            ${otp}
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this account, you can ignore this email.</p>
        </div>
      `,
      text: `Hi ${name}, your Coy Discover verification code is ${otp}. It expires in 10 minutes.`,
    });

    if (error || !data) {
      console.error("Resend delivery failed:", error);

      // Invalidate the code if delivery fails.
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unable to send verification email. Please try again.",
        },
        { status: 502 }
      );
    }

    // 7. Return a response without exposing the OTP.
    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent to your email.",
        expiresIn: 600,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to complete registration." },
      { status: 500 }
    );
  }
}
