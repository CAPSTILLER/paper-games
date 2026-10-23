/**
 * Tip Jar — standard, dependency-free, framework-agnostic.
 *   import { mountTipJar } from "./tipjar/tipjar";
 *   mountTipJar(el, { stripeUrl, wallet });
 * Or the standalone build: <script src="tipjar.js"></script> → TipJar.mountTipJar(el, {...})
 * No keys or secrets: card tips go through a public Stripe Payment Link; crypto tips are plain
 * transfers to a public address on Base (copy address / EIP-681 link / QR).
 */
import { qrcodegen } from "./qrcodegen";

export interface TipToken { symbol: string; address?: string; decimals?: number; note?: string }
export interface TipJarOpts {
  stripeUrl?: string;          // Stripe Payment Link (Card / Apple Pay / Google Pay)
  wallet?: string;             // receiving address on Base
  chainId?: number;            // default 8453 (Base)
  chainName?: string;          // default "Base"
  tokens?: TipToken[];         // default ETH, USDC, GEAR
  label?: string;              // button text, default "🫙 Tip jar"
  title?: string;              // card title
  message?: string;            // short thank-you line
  className?: string;          // extra class on the button
}

export const BASE_TOKENS: TipToken[] = [
  { symbol: "ETH", note: "native ETH on Base" },
  { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "GEAR", address: "0x5880cD05605A549f1DAb01a53ca61Ee559244bD1", decimals: 6 },
];

/** EIP-681 payment URI (no amount, so the wallet asks). */
export function eip681(wallet: string, chainId: number, token?: TipToken) {
  return token?.address ? `ethereum:${token.address}@${chainId}/transfer?address=${wallet}` : `ethereum:${wallet}@${chainId}`;
}

/** QR code as an SVG string. */
export function qrSvg(text: string, px = 168) {
  const q = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const n = q.size, b = 2; let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.getModule(x, y)) d += `M${x + b} ${y + b}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + b * 2} ${n + b * 2}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

const CSS = `
.tj-btn{font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.25);color:inherit;cursor:pointer;min-height:32px}
.tj-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:1000;padding:12px}
.tj-card{background:#1d1430;color:#f4ecff;border:1px solid #4b3a70;border-radius:16px;width:min(100%,340px);max-height:calc(100dvh - 24px);overflow:auto;padding:14px;font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5);position:relative}
.tj-card h3{margin:0 0 4px;font-size:17px}.tj-card p{margin:0 0 10px;opacity:.8;font-size:12.5px}
.tj-x{position:absolute;top:6px;right:8px;background:none;border:0;color:inherit;font-size:20px;cursor:pointer;padding:4px 8px}
.tj-pay{display:block;text-align:center;text-decoration:none;background:#635bff;color:#fff;font-weight:700;border-radius:10px;padding:11px;margin-bottom:12px}
.tj-sec{border-top:1px solid #4b3a70;padding-top:10px}
.tj-tabs{display:flex;gap:6px;margin:6px 0 8px}.tj-tabs button{flex:1;font:inherit;font-size:13px;padding:6px;border-radius:8px;border:1px solid #4b3a70;background:transparent;color:inherit;cursor:pointer}
.tj-tabs button[aria-pressed=true]{background:#ff8c1a;border-color:#ff8c1a;color:#1a0f2e;font-weight:700}
.tj-qr{display:flex;justify-content:center;margin:4px 0 8px}.tj-qr svg{border-radius:8px;display:block}
.tj-addr{display:flex;gap:6px;align-items:center}.tj-addr code{flex:1;min-width:0;overflow-wrap:anywhere;font-size:11px;background:rgba(255,255,255,.07);padding:6px;border-radius:6px}
.tj-addr button,.tj-open{font:inherit;font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid #4b3a70;background:#2c2147;color:inherit;cursor:pointer;white-space:nowrap}
.tj-open{display:block;text-align:center;text-decoration:none;margin-top:8px}
.tj-small{font-size:11px;opacity:.7;margin-top:6px}`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...kids); return e;
}
async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const t = el("textarea"); t.value = text; document.body.append(t); t.select();
    const ok = document.execCommand("copy"); t.remove(); return ok;
  }
}

export function mountTipJar(container: HTMLElement, opts: TipJarOpts = {}) {
  if (!document.getElementById("tj-css")) document.head.append(Object.assign(el("style", { id: "tj-css" }), { textContent: CSS }));
  const chainId = opts.chainId ?? 8453, chain = opts.chainName ?? "Base", tokens = opts.tokens ?? BASE_TOKENS;
  const btn = el("button", { type: "button", class: "tj-btn " + (opts.className ?? ""), "aria-haspopup": "dialog" }, opts.label ?? "🫙 Tip jar");
  let ov: HTMLElement | null = null;
  const close = () => { ov?.remove(); ov = null; document.removeEventListener("keydown", onEsc); btn.focus(); };
  const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
  function open() {
    if (ov) return;
    const card = el("div", { class: "tj-card", role: "dialog", "aria-modal": "true", "aria-label": "Tip jar" });
    const x = el("button", { class: "tj-x", "aria-label": "Close" }, "×"); x.onclick = close;
    card.append(x, el("h3", {}, opts.title ?? "🫙 Tip jar"), el("p", {}, opts.message ?? "Thanks for keeping the gears turning!"));
    if (opts.stripeUrl) card.append(el("a", { class: "tj-pay", href: opts.stripeUrl, target: "_blank", rel: "noopener noreferrer" }, "💳 Card / Apple Pay / Google Pay"));
    if (opts.wallet) {
      const w = opts.wallet, sec = el("div", { class: "tj-sec" }), tabs = el("div", { class: "tj-tabs", role: "group" });
      const qr = el("div", { class: "tj-qr" }), info = el("div", { class: "tj-small" });
      const openA = el("a", { class: "tj-open" }, "Open in wallet app");
      const cp = el("button", { type: "button" }, "Copy");
      cp.onclick = async () => { cp.textContent = (await copy(w)) ? "Copied ✓" : "Copy failed"; setTimeout(() => (cp.textContent = "Copy"), 1500); };
      const pick = (t: TipToken) => {
        Array.from(tabs.children).forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === t.symbol)));
        const uri = eip681(w, chainId, t); qr.innerHTML = qrSvg(uri); openA.setAttribute("href", uri);
        info.textContent = t.address ? `${t.symbol} token: ${t.address} — send on ${chain} only.` : `Send ${t.symbol} on ${chain} only.`;
      };
      tokens.forEach((t) => { const b = el("button", { type: "button" }, t.symbol); b.onclick = () => pick(t); tabs.append(b); });
      sec.append(el("b", {}, `Crypto on ${chain}`), tabs, qr, el("div", { class: "tj-addr" }, el("code", {}, w), cp), openA, info);
      card.append(sec); pick(tokens[0]);
    }
    ov = el("div", { class: "tj-ov" }); ov.append(card);
    ov.onclick = (e) => { if (e.target === ov) close(); };
    document.body.append(ov); document.addEventListener("keydown", onEsc); x.focus();
  }
  btn.onclick = open;
  container.append(btn);
  return { open, close, destroy() { close(); btn.remove(); } };
}
