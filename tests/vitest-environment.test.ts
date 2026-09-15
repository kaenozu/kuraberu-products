import { describe, expect, it } from "vitest";

describe("Vitest environment isolation", () => {
  it("uses preview-safe defaults even when invoked by a production build", () => {
    expect(process.env.DEPLOYMENT_ENV).toBe("preview");
    expect(process.env.PUBLIC_AMAZON_ASSOCIATE_TAG).toBe("");
  });
});
