import { prisma } from "@/lib/db/prisma";
import { signPayload } from "./sign";
import { validateEgressUrl } from "./validate-egress-url";
import { decryptSecret } from "@/lib/security/integration-secrets";
import { redactIntegrationResponse } from "@/lib/security/integration-response-redaction";

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

  try {
    const signature = signPayload(payload, decryptSecret(webhook.secret ?? ""));
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-Event": event,
    };
    await validateEgressUrl(webhook.url);
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payload,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });

    await prisma.webhookLog.create({
      data: {
        webhookId,
        event,
        status: response.status,
        request: payload,
        response: redactIntegrationResponse(await response.text().catch(() => null)),
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
        response: redactIntegrationResponse((error as Error).message),
      },
    });

    return { success: false };
  }
}
