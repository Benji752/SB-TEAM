import type { IncomingMessage, ServerResponse } from "http";
import app, { appReady } from "./server/index";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await appReady;
  return app(req, res);
}
