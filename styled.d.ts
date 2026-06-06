import "styled-components";
import "styled-components/native";

import type { AppTheme } from "@/theme/theme";

declare module "styled-components" {
  export interface DefaultTheme {
    name: AppTheme["name"];
    background: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
  }
}

declare module "styled-components/native" {
  export interface DefaultTheme {
    name: AppTheme["name"];
    background: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
  }
}
