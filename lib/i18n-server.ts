import "server-only";

import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  parseLocale,
  translate,
  type Locale,
  type TranslationKey,
  type TranslationParams,
} from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocale(store.get(COOKIE_NAME)?.value);
}

export type ServerT = (key: TranslationKey, params?: TranslationParams) => string;

export async function serverT(): Promise<ServerT> {
  const locale = await getServerLocale();
  return (key, params) => translate(locale, key, params);
}