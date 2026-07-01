import "dotenv/config";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_API_KEY;
const TO = "33672651376";

async function sendMessage() {
  const response = await fetch(
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: TO,
        type: "template",
        template: {
          name: "notification_sav",
          language: { code: "fr" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "John" },
                { type: "text", text: "Matieu" },
                { type: "text", text: "Probleme triage" },
                { type: "text", text: "IA" },
                { type: "text", text: "Moyenne" },
              ],
            },
          ],
        },
      }),
    },
  );

  const data = await response.json();
  console.log(data);
}

sendMessage();
