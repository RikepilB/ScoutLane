import { prisma } from "@/lib/db/prisma";
import { signPayload } from "./sign";

interface DispatchResult {
  success: boolean;
  statusCode?: number;
}

export async function dispatchWebhook(webhookId: string, event: string, data: unknown): Promise<DispatchResult> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || !webhook.active) {
    return { success: false };
  }

  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  const signature = signPayload(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Signature": signature,
    "X-Webhook-Event": event,
  };

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payload,
    });

    await prisma.webhookLog.create({
      data: {
        webhookId,
        event,
        status: response.status,
        request: payload,
        response: await response.text().catch(() => null),
      },
    });

    return { success: response.ok, statusCode: response.status };
  } catch (error) {
    await prisma.webhookLog.create({
      data: {
        webhookId,
        event,
        status: 0,
        request: payload,
        response: (error as Error).message,
      },
    });

    return { success: false };
  }
}
