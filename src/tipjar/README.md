# Tip Jar (drop-in)

Dependency-free tip jar: a small button that opens a card with
- **Card / Apple Pay / Google Pay** → your public Stripe Payment Link (new tab)
- **Crypto on Base** → ETH / USDC / GEAR tabs, QR (EIP-681), copy address, "open in wallet" link.

No secret keys anywhere. QR encoder is vendored (nayuki qrcodegen, MIT). CSS is injected by the component (`tj-` prefixed).

## Use in a TS/JS app (Vite, Next, etc.)
Copy `tipjar.ts` + `qrcodegen.ts` into your project:
```ts
import { mountTipJar } from "./tipjar/tipjar";
mountTipJar(document.getElementById("tips")!, {
  stripeUrl: "https://buy.stripe.com/cNi00labZ2y98uc20v9oc00",
  wallet: "0xEc264A2F2e5803b033193ed25A9918B8a6F4C544",
});
```
In React: call it in a `useEffect` on a ref and return `() => handle.destroy()`.

## Use in any HTML page
Copy `public/tipjar/tipjar.js` (built by `npm run build:tipjar`):
```html
<div id="tips"></div>
<script src="/tipjar.js"></script>
<script>
  TipJar.mountTipJar(document.getElementById("tips"), {
    stripeUrl: "https://buy.stripe.com/cNi00labZ2y98uc20v9oc00",
    wallet: "0xEc264A2F2e5803b033193ed25A9918B8a6F4C544"
  });
</script>
```

## Options
`stripeUrl`, `wallet`, `chainId` (8453), `chainName` ("Base"), `tokens` (default `BASE_TOKENS`), `label`, `title`, `message`, `className`.

Default Base tokens (verified on-chain via `symbol()`/`decimals()`):
- USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- GEAR `0x5880cD05605A549f1DAb01a53ca61Ee559244bD1` (6 decimals)
