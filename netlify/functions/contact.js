const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Méthode non autorisée." });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return json(500, { error: "Webhook non configuré." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Payload invalide." });
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const message = String(payload.message || "").trim();
  const danceId = String(payload.danceId || "").trim();
  const danceTitle = String(payload.danceTitle || "").trim();
  const website = String(payload.website || "").trim();

  if (website) {
    return json(204, {});
  }

  if (!name || !email || !message) {
    return json(400, { error: "Tous les champs sont requis." });
  }

  const discordPayload = {
    username: "Quatrième Mur",
    embeds: [
      {
        title: danceId ? `Nouvelle demande · ${danceId}` : "Nouvelle demande DS",
        description: danceTitle ? `**${danceTitle}**` : "Demande depuis le formulaire du site.",
        color: 617727,
        fields: [
          { name: "Nom", value: name.slice(0, 1024), inline: true },
          { name: "Email", value: email.slice(0, 1024), inline: true },
          {
            name: "DS demandée",
            value: danceId ? `${danceId} - ${danceTitle || "Sans titre"}`.slice(0, 1024) : "Non précisée",
            inline: false
          },
          { name: "Message", value: message.slice(0, 1024) }
        ],
        footer: {
          text: "studios-quatrieme-mur.netlify.app"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(discordPayload)
  });

  if (!response.ok) {
    return json(502, { error: "Erreur de transmission. Vérifiez la liaison." });
  }

  return json(200, { ok: true });
};
