/**
 * One-off image conversions with headless Chrome (no extra dependency):
 *   src/assets/hero-bg.jpg       -> src/assets/hero-bg.webp        (same size, quality 0.78)
 *   src/assets/profile-photo.jpg -> src/assets/profile-photo-80.webp (80×80 for the 40 px avatar)
 * Run `npm run images` after replacing a source image, then commit the outputs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer";

const JOBS = [
  { src: "src/assets/hero-bg.jpg", out: "src/assets/hero-bg.webp", quality: 0.78 },
  { src: "src/assets/profile-photo.jpg", out: "src/assets/profile-photo-80.webp", quality: 0.85, size: 80 },
];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
try {
  const page = await browser.newPage();
  for (const job of JOBS) {
    const input = readFileSync(job.src);
    const dataUrl = `data:image/jpeg;base64,${input.toString("base64")}`;
    const b64 = await page.evaluate(
      async ({ dataUrl, quality, size }) => {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        const w = size || img.naturalWidth;
        const h = size ? Math.round((img.naturalHeight / img.naturalWidth) * size) : img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL("image/webp", quality).split(",")[1];
      },
      { dataUrl, quality: job.quality, size: job.size },
    );
    const out = Buffer.from(b64, "base64");
    writeFileSync(job.out, out);
    console.log(`${job.src} (${(input.length / 1024).toFixed(0)} KB) -> ${job.out} (${(out.length / 1024).toFixed(0)} KB)`);
  }
} finally {
  await browser.close();
}
