import {
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const root = path.join(
  process.cwd(),
  "public",
  "artworks",
  "gallery",
);

const output = path.join(
  process.cwd(),
  "app",
  "gallery",
  "gallery-manifest.json",
);

const supported = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

async function scan(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await scan(absolute));
      continue;
    }

    const extension = path
      .extname(entry.name)
      .toLowerCase();

    if (
      supported.has(extension) &&
      !/(^|[-_.])(thumb|thumbnail)([-_.]|$)/i.test(entry.name)
    ) {
      files.push(absolute);
    }
  }

  return files;
}

function jpegSize(buffer) {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    if (offset + 3 >= buffer.length) {
      break;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (
      [
        0xc0,
        0xc1,
        0xc2,
        0xc3,
        0xc5,
        0xc6,
        0xc7,
        0xc9,
        0xca,
        0xcb,
        0xcd,
        0xce,
        0xcf,
      ].includes(marker)
    ) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += 2 + length;
  }

  return {
    width: 1,
    height: 1,
  };
}

async function imageSize(file) {
  const data = await readFile(file);
  const extension = path.extname(file).toLowerCase();

  if (
    extension === ".jpg" ||
    extension === ".jpeg"
  ) {
    return jpegSize(data);
  }

  if (extension === ".png") {
    return {
      width: data.readUInt32BE(16),
      height: data.readUInt32BE(20),
    };
  }

  return {
    width: 1,
    height: 1,
  };
}

async function readSidecar(file) {
  const extension = path.extname(file);

  const sidecarPath =
    file.slice(0, -extension.length) + ".json";

  try {
    const text = await readFile(sidecarPath, "utf8");
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * Recognizes timestamps such as:
 *
 * Project (20260807120823).jpg
 * artwork-20260807120823.png
 *
 * YYYYMMDDHHmmss
 */
function dateFromFilename(file) {
  const basename = path.basename(file);

  const match = basename.match(
    /(20\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
  );

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second,
  ] = match;

  // UTC makes builds deterministic across machines/timezones.
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

async function gitCreatedAt(file) {
  try {
    const relative = path.relative(
      process.cwd(),
      file,
    );

    const { stdout } = await execFileAsync(
      "git",
      [
        "log",
        "--follow",
        "--diff-filter=A",
        "--format=%aI",
        "--",
        relative,
      ],
      {
        cwd: process.cwd(),
      },
    );

    const dates = stdout
      .trim()
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    if (dates.length === 0) {
      return null;
    }

    const date = new Date(
      dates[dates.length - 1],
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  } catch {
    return null;
  }
}

async function resolveCreatedAt(file, sidecar) {
  // 1. Explicit metadata.
  if (sidecar.createdAt) {
    const explicit = new Date(sidecar.createdAt);

    if (!Number.isNaN(explicit.getTime())) {
      return explicit;
    }
  }

  // 2. Timestamp encoded in filename.
  const filenameDate = dateFromFilename(file);

  if (filenameDate) {
    return filenameDate;
  }

  // 3. First Git commit that added the image.
  const gitDate = await gitCreatedAt(file);

  if (gitDate) {
    return gitDate;
  }

  // 4. Filesystem fallback.
  const info = await stat(file);

  if (
    info.birthtime &&
    info.birthtime.getTime() > 0
  ) {
    return info.birthtime;
  }

  // 5. Last-resort fallback.
  return info.mtime;
}

function humanizeFilename(file) {
  return path
    .basename(file, path.extname(file))
    .replace(/\(20\d{12}\)/g, "")
    .replace(/20\d{12}/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const editorial = [
  {
    title: "Held Light",
    medium: "Oil pastel on paper",
    year: 2024,
    category: "Digital",
    description:
      "A study in gesture, proximity, and saturated color.",
  },
  {
    title: "Passage",
    medium: "Mixed media on paper",
    year: 2023,
    category: "Studies",
    description:
      "An architectural color study built from layered marks.",
  },
  {
    title: "Seated Studies",
    medium: "Ink on paper",
    year: 2024,
    category: "Drawings",
    description:
      "Two observational figure studies drawn from life.",
  },
];

const files = await scan(root);

const manifest = await Promise.all(
  files.map(async (file, index) => {
    const sidecar = await readSidecar(file);

    const createdAt = await resolveCreatedAt(
      file,
      sidecar,
    );

    const defaults = {
      title:
        humanizeFilename(file) ||
        `Untitled ${String(index + 1).padStart(2, "0")}`,
      medium: "Mixed media",
      category: "Class",
      description: "",
    };

    const metadata = {
      ...defaults,
      ...sidecar,
    };

    return {
      id: path
        .relative(root, file)
        .replace(path.extname(file), "")
        .split(path.sep)
        .join("-"),

      src: path
        .relative(
          path.join(process.cwd(), "public"),
          file,
        )
        .split(path.sep)
        .join("/"),

      ...(await imageSize(file)),

      ...metadata,

      createdAt: createdAt.toISOString(),

      year:
        metadata.year ??
        createdAt.getUTCFullYear(),
    };
  }),
);

// Default manifest order: newest → oldest.
manifest.sort((a, b) => {
  const difference =
    Date.parse(b.createdAt) -
    Date.parse(a.createdAt);

  if (difference !== 0) {
    return difference;
  }

  return a.id.localeCompare(b.id);
});

await mkdir(
  path.dirname(output),
  {
    recursive: true,
  },
);

await writeFile(
  output,
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Generated ${manifest.length} gallery entries.`,
);

console.table(
  manifest.map((work) => ({
    title: work.title,
    createdAt: work.createdAt,
    src: work.src,
  })),
);