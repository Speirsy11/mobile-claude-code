import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@mcc/eslint-config/base";
import { nextjsConfig } from "@mcceslint-config/nextjs";
import { reactConfig } from "@mcceslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
