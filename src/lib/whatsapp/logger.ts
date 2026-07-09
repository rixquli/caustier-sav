const PREFIX = "[WhatsApp Webhook]";

export function waLog(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.log(`${PREFIX} ${message}`, data);
    return;
  }
  console.log(`${PREFIX} ${message}`);
}

export function waWarn(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.warn(`${PREFIX} ${message}`, data);
    return;
  }
  console.warn(`${PREFIX} ${message}`);
}

export function waError(message: string, error?: unknown): void {
  console.error(`${PREFIX} ${message}`, error);
}
