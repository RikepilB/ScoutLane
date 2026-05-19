"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
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

    try {
      await sendJobAlertConfirmation(normalized, token);
    } catch (e) {
      console.error("[job-alerts] confirmation email failed:", e);
    }

    return { success: true, message: "Subscribed! Check your email to confirm." };
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
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${APP_URL}/careers/${jobSlug}`;

  const alerts = await prisma.jobAlert.findMany({
    where: { active: true },
    select: { email: true, token: true },
  });

  for (const alert of alerts) {
    try {
      await sendNewJobNotification(alert.email, jobTitle, url, alert.token);
    } catch (e) {
      console.error(`[job-alerts] notify failed for ${alert.email}:`, e);
    }
  }
}
