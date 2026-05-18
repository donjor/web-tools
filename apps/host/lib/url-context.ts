import { urlConfig } from "../../../urls.config";
import type { UrlContext } from "@web-tools/tool-kit";

export function getUrlContext(): UrlContext {
  return {
    env: process.env.NODE_ENV === "production" ? "prod" : "dev",
    devBase: urlConfig.devBase,
    prodHost: urlConfig.prodHost,
  };
}
