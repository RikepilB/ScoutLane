import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { syncUserFromClerk } from "@/lib/auth/sync-user";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "CLERK_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(secret);
  let event: WebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const email = event.data.email_addresses[0]?.email_address;
    if (email) {
      await syncUserFromClerk({
        email,
        name: [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") || null,
        image: event.data.image_url ?? null,
      });
    }
  }

  return Response.json({ received: true });
}
