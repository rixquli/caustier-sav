import dotenv from "dotenv";

dotenv.config();

const { subscribeWhatsappApp } =
  await import("../src/lib/whatsapp/subscribe.ts");

subscribeWhatsappApp()
  .then((data) => console.log(data))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
