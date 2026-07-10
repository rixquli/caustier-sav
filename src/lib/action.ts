import { createSafeActionClient } from "next-safe-action";
import { getSessionUser, guardAdmin, guardUser } from "@/lib/session";

export const authActionClient = createSafeActionClient().use(async ({ next }) => {
  const user = await getSessionUser();
  const auth = guardUser(user);
  if (!auth.ok) {
    throw new Error(auth.error.error);
  }

  return next({ ctx: { user: auth.user } });
});

export const authActionAdmin = createSafeActionClient().use(async ({ next }) => {
  const user = await getSessionUser();
  const auth = guardAdmin(user);
  if (!auth.ok) {
    throw new Error(auth.error.error);
  }

  return next({ ctx: { user: auth.user } });
});
