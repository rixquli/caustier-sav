import dotenv from "dotenv";
dotenv.config();

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_API_KEY?.trim();

async function main() {
  const response = await fetch(
    `https://graph.facebook.com/v25.0/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`,
  );
  console.log(await response.json());
  console.log({
    authorization: `Bearer ${ACCESS_TOKEN}`,
  });
}

main();
console.dir(
  await fetch(
    `https://graph.facebook.com/v25.0/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`,
  ).then((r) => r.json()),
  { depth: null },
);
const WABA_ID = "1040680421811844";

const r = await fetch(
  `https://graph.facebook.com/v25.0/${WABA_ID}/phone_numbers`,
  {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  },
);

console.log(await r.json());
