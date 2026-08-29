import sharp from "sharp";
import path from "node:path";
const root = process.cwd();
const source = path.join(root, "public/icons/icon-master.png");
async function icon(size, file, markScale = 0.7) {
  const mark = Math.round(size * markScale);
  const buffer = await sharp(source).resize(mark, mark, { fit: "contain" }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#07100d" } }).composite([{ input: buffer, gravity: "center" }]).png().toFile(path.join(root, `public/icons/${file}`));
}
await icon(192, "icon-192.png");
await icon(512, "icon-512.png");
await icon(512, "icon-maskable-512.png", 0.58);
await icon(180, "apple-touch-icon.png");
const alpha = await sharp(source).resize(72, 72, { fit: "contain" }).ensureAlpha().extractChannel("alpha").threshold(40).toBuffer();
await sharp({ create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: { create: { width: 72, height: 72, channels: 4, background: "#ffffff" } }, mask: { input: alpha }, gravity: "center" }]).png().toFile(path.join(root, "public/icons/notification-96.png"));