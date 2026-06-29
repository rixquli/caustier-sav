import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { dbFilePathName } from "./db/db";

export const auth = betterAuth({
  database: new Database(dbFilePathName),
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