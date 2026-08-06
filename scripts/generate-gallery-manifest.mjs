import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "public", "artworks", "gallery");
const output = path.join(process.cwd(), "app", "gallery", "gallery-manifest.json");
const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

async function scan(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await scan(absolute));
    else if (supported.has(path.extname(entry.name).toLowerCase()) && !/(^|[-_.])(thumb|thumbnail)([-_.]|$)/i.test(entry.name)) files.push(absolute);
  }
  return files;
}

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return { width: 1, height: 1 };
}

async function imageSize(file) {
  const data = await readFile(file);
  const ext = path.extname(file).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return jpegSize(data);
  if (ext === ".png") return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  return { width: 1, height: 1 };
}

const editorial = [
  { title: "Held Light", medium: "Oil pastel on paper", year: 2024, category: "Digital", description: "A study in gesture, proximity, and saturated color." },
  { title: "Passage", medium: "Mixed media on paper", year: 2023, category: "Studies", description: "An architectural color study built from layered marks." },
  { title: "Seated Studies", medium: "Ink on paper", year: 2024, category: "Drawings", description: "Two observational figure studies drawn from life." },
];

const files = (await scan(root)).sort();
const manifest = await Promise.all(files.map(async (file, index) => ({
  id: path.basename(file, path.extname(file)),
  src: path.relative(path.join(process.cwd(), "public"), file).split(path.sep).join("/"),
  ...(await imageSize(file)),
  ...(editorial[index] ?? { title: `Untitled ${String(index + 1).padStart(2, "0")}`, medium: "Mixed media", year: new Date().getFullYear(), category: "Class", description: "" }),
})));

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.length} gallery entries.`);
