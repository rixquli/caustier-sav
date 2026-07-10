async function getTokenTargetIds(accessToken: string): Promise<string[]> {
  const response = await fetch(
    `https://graph.facebook.com/v25.0/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(accessToken)}`,
  );
  const payload = (await response.json()) as {
    data?: { granular_scopes?: Array<{ target_ids?: string[] }> };
  };

  return [
    ...new Set(
      (payload.data?.granular_scopes ?? []).flatMap(
        (entry) => entry.target_ids ?? [],
      ),
    ),
  ];
}

async function discoverWabaId(accessToken: string): Promise<string | null> {
  const targetIds = await getTokenTargetIds(accessToken);

  for (const id of targetIds) {
    const check = await fetch(
      `https://graph.facebook.com/v25.0/${id}/subscribed_apps`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = (await check.json()) as { error?: { code?: number } };
    if (!data.error) {
      return id;
    }
  }

  return null;
}

export async function subscribeWhatsappApp(): Promise<{ success: boolean }> {
  const accessToken = process.env.WHATSAPP_API_KEY;
  const wabaId =
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ??
    (accessToken ? await discoverWabaId(accessToken) : null);

  if (!accessToken) {
    throw new Error("WHATSAPP_API_KEY manquant");
  }

  if (!wabaId) {
    const targetIds = await getTokenTargetIds(accessToken);
    const hint =
      targetIds.length > 0
        ? ` IDs liés au token : ${targetIds.join(", ")} (aucun n'est un WABA).`
        : "";
    throw new Error(
      "WHATSAPP_BUSINESS_ACCOUNT_ID manquant (ID du compte WhatsApp Business, pas PHONE_NUMBER_ID)." +
        hint +
        " Trouvez-le dans Meta Developers > WhatsApp > API Setup.",
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${wabaId}/subscribed_apps`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const data = (await response.json()) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Échec abonnement webhook");
  }

  return data as { success: boolean };
}
