import * as AuthSession from "expo-auth-session";

import { useAuthStore } from "@/features/auth/stores/authStore";

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "checkupcar",
});

export function getGoogleOAuthConfig() {
  return {
    redirectUri,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };
}

export async function bootstrapAuth() {
  await useAuthStore.getState().hydrate();
}
