import { describe, it, expect } from "vitest";
import { eip681, qrSvg, BASE_TOKENS } from "../src/tipjar/tipjar";
const W = "0xEc264A2F2e5803b033193ed25A9918B8a6F4C544";
describe("tipjar", () => {
  it("builds EIP-681 URIs", () => {
    expect(eip681(W, 8453, BASE_TOKENS[0])).toBe(`ethereum:${W}@8453`);
    expect(eip681(W, 8453, BASE_TOKENS[1])).toBe(`ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913@8453/transfer?address=${W}`);
  });
  it("makes a QR svg", () => { const s = qrSvg("ethereum:" + W); expect(s.startsWith("<svg")).toBe(true); expect(s).toContain("<path"); });
});
