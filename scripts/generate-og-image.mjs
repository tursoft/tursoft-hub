/**
 * Renders scripts/og-image.html with headless Chrome and writes
 *   public/og-image.jpg         (1200×630 social card for Open Graph / Twitter)
 *   public/apple-touch-icon.png (180×180 home-screen icon)
 * Run `npm run og-image` after changing the photo, the title or the colours, then commit the outputs.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import puppeteer from "puppeteer";

const html = pathToFileURL(resolve("scripts/og-image.html")).href;
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  await page.goto(html, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);

  const card = await page.$("#og");
  await card.screenshot({ path: "public/og-image.jpg", type: "jpeg", quality: 88 });
  console.log("wrote public/og-image.jpg (1200x630)");

  const icon = await page.$("#icon");
  await icon.screenshot({ path: "public/apple-touch-icon.png", type: "png", omitBackground: false });
  console.log("wrote public/apple-touch-icon.png (180x180)");
} finally {
  await browser.close();
}
