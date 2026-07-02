import { betterAuth } from "better-auth";
import { PostgresDialect } from "kysely";
import { pool } from "./db/db";

export const auth = betterAuth({
  database: new PostgresDialect({ pool }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      is_admin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // l'utilisateur ne peut pas se déclarer admin
      },
    },
  },
});