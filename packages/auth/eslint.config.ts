import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@mcc/eslint-config/base";

export default defineConfig(
  {
    ignores: ["script/**"],
  },
  baseConfig,
  restrictEnvAccess,
);
