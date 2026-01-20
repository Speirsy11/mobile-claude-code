import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@mcc/eslint-config/base";
import { nextjsConfig } from "@mcc/eslint-config/nextjs";
import { reactConfig } from "@mcc/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
