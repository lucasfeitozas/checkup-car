import { create } from "zustand";

import { storage } from "@/lib/storage";

const ACCESS_TOKEN_KEY = "checkup-car.access-token";
const REFRESH_TOKEN_KEY = "checkup-car.refresh-token";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (user: AuthUser, tokens: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  async hydrate() {
    const accessToken = await storage.getItem(ACCESS_TOKEN_KEY);

    set({
      accessToken,
      isHydrated: true,
    });
  },
  async signIn(user, tokens) {
    await storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);

    if (tokens.refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    set({
      user,
      accessToken: tokens.accessToken,
    });
  },
  async signOut() {
    await storage.removeItem(ACCESS_TOKEN_KEY);
    await storage.removeItem(REFRESH_TOKEN_KEY);

    set({
      user: null,
      accessToken: null,
    });
  },
}));
