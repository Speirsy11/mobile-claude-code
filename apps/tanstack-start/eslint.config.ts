import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@mcc/eslint-config/base";
import { reactConfig } from "@mcceslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
