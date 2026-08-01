import { getViteConfig } from "astro/config";
import type { UserConfig as VitestUserConfig } from "vitest/config";

const vitestConfig: VitestUserConfig = {
  test: {
    environment: "node",
  },
};

export default getViteConfig(vitestConfig);
