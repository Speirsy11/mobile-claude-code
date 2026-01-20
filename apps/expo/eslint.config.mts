import { defineConfig } from "eslint/config";

import { baseConfig } from "@mcc/eslint-config/base";
import { reactConfig } from "@mcceslint-config/react";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
