"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { isEmailConfigured } from "@/lib/email/client";
import { sendJobAlertConfirmation, sendNewJobNotification } from "@/lib/email/send";

export async function subscribe(email: string): Promise<{ success: boolean; message: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@") || normalized.length < 5) {
    return { success: false, message: "Please provide a valid email address." };
  }

  try {
    const token = randomUUID();
    await prisma.jobAlert.upsert({
      where: { email: normalized },
      update: { active: true, token },
      create: { email: normalized, token },
    });

    if (isEmailConfigured()) {
      const result = await sendJobAlertConfirmation(normalized, token);
      if (!result.ok && !result.skipped) {
        console.error("[job-alerts] confirmation email failed:", result.error);
      }
    }

    return {
      success: true,
      message: isEmailConfigured()
        ? "Subscribed! Check your email to confirm."
        : "Subscribed!",
    };
  } catch (e) {
    console.error("[job-alerts] subscribe failed:", e);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

export async function unsubscribe(token: string): Promise<boolean> {
  try {
    const result = await prisma.jobAlert.updateMany({
      where: { token },
      data: { active: false },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function notifySubscribers(jobTitle: string, jobSlug: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[job-alerts] skipping notifySubscribers: email not configured");
    return;
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${APP_URL}/careers/${jobSlug}`;

  const alerts = await prisma.jobAlert.findMany({
    where: { active: true },
    select: { email: true, token: true },
  });

  for (const alert of alerts) {
    try {
      const result = await sendNewJobNotification(alert.email, jobTitle, url, alert.token);
      if (!result.ok && !result.skipped) {
        console.error(`[job-alerts] notify failed for ${alert.email}:`, result.error);
      }
    } catch (error) {
      console.error(`[job-alerts] notify threw for ${alert.email}:`, error);
    }
  }
}
