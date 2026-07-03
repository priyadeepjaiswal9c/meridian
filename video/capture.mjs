// Automated demo capture — records the Meridian demo to a WebM with Playwright.
// FREE, zero manual effort. Produces raw footage you can narrate or edit (Remotion).
//
//   cd meridian && npm run dev            # in one terminal (serves :3000)
//   npm i -D playwright && npx playwright install chromium
//   node video/capture.mjs                # → video/out/*.webm
//   # then, optional: ffmpeg -i video/out/<file>.webm -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart video/demo.mp4
//
// Run HEADED (headless:false) so the WebGL globe + deck.gl map render reliably.

import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Inject a smooth fake cursor + click pulse (headed capture doesn't record the OS cursor well).
async function installCursor(page) {
  await page.addInitScript(() => {
    if (window.__cursorInstalled) return;
    window.__cursorInstalled = true;
    const c = document.createElement("div");
    c.id = "__cursor";
    Object.assign(c.style, {
      position: "fixed", top: "0", left: "0", width: "24px", height: "24px", borderRadius: "50%",
      background: "rgba(15,98,254,.25)", border: "2px solid #0f62fe", boxShadow: "0 0 10px rgba(0,0,0,.35)",
      zIndex: 2147483647, pointerEvents: "none", transition: "transform .45s cubic-bezier(.22,1,.36,1)",
      transform: "translate(-100px,-100px)",
    });
    const add = () => document.body && document.body.appendChild(c);
    if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
    window.__moveCursor = (x, y) => { c.style.transform = `translate(${x - 12}px,${y - 12}px)`; };
    window.__pulse = () => c.animate(
      [{ boxShadow: "0 0 0 0 rgba(15,98,254,.6)" }, { boxShadow: "0 0 0 30px rgba(15,98,254,0)" }],
      { duration: 550 });
  });
}

async function glideClick(page, locator, { pulse = true } = {}) {
  const el = typeof locator === "string" ? page.locator(locator).first() : locator;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (!box) { await el.click({ force: true }).catch(() => {}); return; }
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.evaluate(([x, y]) => window.__moveCursor?.(x, y), [x, y]);
  await sleep(650);
  if (pulse) await page.evaluate(() => window.__pulse?.());
  await el.click().catch(() => el.click({ force: true }));
  await sleep(500);
}

const browser = await chromium.launch({ headless: false, slowMo: 90 });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: { dir: "video/out", size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();
await installCursor(page);

try {
  // ── Act I: the landing story ──────────────────────────────────────────────
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(3500); // hold on the globe
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 900); await sleep(1900); } // scroll the story

  // ── Act II: into the console ──────────────────────────────────────────────
  await glideClick(page, page.getByRole("link", { name: /enter the console/i }));
  await page.waitForTimeout(6000); // map + globe settle

  // fire the crisis
  await glideClick(page, page.getByRole("button", { name: /simulate crisis/i }));
  // wait for the directed run to finish
  await page.waitForFunction(() => /cleared|Verified crude reroutes/i.test(document.body.innerText), null, { timeout: 45000 }).catch(() => {});
  await sleep(3000);

  // approve the top reroute (closes the loop)
  await glideClick(page, page.getByRole("button", { name: /approve & route/i }).first());
  await sleep(4000);
} catch (e) {
  console.error("capture error:", e?.message);
} finally {
  await context.close(); // flushes the webm
  const file = await page.video()?.path().catch(() => null);
  await browser.close();
  console.log("done →", file || "video/out/*.webm");
}
