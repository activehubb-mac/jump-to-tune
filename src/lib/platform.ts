import { Capacitor } from "@capacitor/core";

export type AppPlatform = "ios" | "android" | "web";

export const getPlatform = (): AppPlatform => {
  if (!Capacitor.isNativePlatform()) return "web";
  return Capacitor.getPlatform() as "ios" | "android";
};

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const isIOS = (): boolean => getPlatform() === "ios";

export const isAndroid = (): boolean => getPlatform() === "android";

export const isWeb = (): boolean => getPlatform() === "web";

const WEB_ORIGIN = "https://jump-to-tune.lovable.app";

export const getAuthRedirectUrl = (path: string): string => {
  if (isNative()) {
    return `jumtunes://${path}`;
  }
  return `${window.location.origin}${path}`;
};

export const getWebOrigin = (): string => {
  if (isNative()) return WEB_ORIGIN;
  return window.location.origin;
};
