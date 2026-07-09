import "dotenv/config";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_API_KEY;

export async function sendMessage({
  technicianNumber,
  technicianName,
  clientName,
  description,
  type,
  priority,
}: {
  technicianNumber: string;
  technicianName: string;
  clientName: string;
  description: string;
  type: string;
  priority: string;
}): Promise<void> {
  if (
    !technicianNumber ||
    !technicianName ||
    !clientName ||
    !description ||
    !type ||
    !priority
  ) {
    throw new Error("Missing required fields");
  }

  if (technicianNumber.startsWith("0")) {
    technicianNumber = "33" + technicianNumber.slice(1);
  }

  console.log("PHONE_NUMBER_ID =", PHONE_NUMBER_ID);
  console.log("TOKEN =", ACCESS_TOKEN?.slice(0, 15));
  console.log("technicianNumber =", technicianNumber);

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
        to: technicianNumber,
        type: "template",
        template: {
          name: "notification_sav",
          language: {
            code: "fr",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: technicianName,
                },
                {
                  type: "text",
                  text: clientName,
                },
                {
                  type: "text",
                  text: description,
                },
                {
                  type: "text",
                  text: type,
                },
                {
                  type: "text",
                  text: priority,
                },
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

// sendMessage({
//   technicianName: "John Doe",
//   clientName: "Jane Doe",
//   description: "Problème de connexion",
//   type: "IA",
//   priority: "Moyenne",
//   technicianNumber: "33672651376",
// });
