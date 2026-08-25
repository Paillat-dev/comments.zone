import { readFile } from "node:fs/promises";
import type { Font } from "satori";
import sharp from "sharp";
import type { ContentSegment } from "$lib/comments/common";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const MENTION_COLOR = "#3b82f6";
const MAX_CONTENT_LENGTH = 260;

interface OgNode {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: (OgNode | string)[] | OgNode | string;
    [key: string]: unknown;
  };
}

const fontCache = new Map<string, Promise<Font[]>>();

function loadFontFamily(
  family: string,
  packageName: string,
  filePrefix: string,
  weights: readonly number[],
): Promise<Font[]> {
  let fonts = fontCache.get(family);

  fonts ??= Promise.all(
    weights.map(async (weight): Promise<Font> => {
      const data = await readFile(
        `node_modules/${packageName}/files/${filePrefix}-latin-${weight}-normal.woff`,
      );
      return {
        name: family,
        data,
        weight: weight as Font["weight"],
        style: "normal",
      };
    }),
  );

  fontCache.set(family, fonts);
  return fonts;
}

function loadRobotoFonts(): Promise<Font[]> {
  return loadFontFamily(
    "Roboto",
    "@fontsource/roboto",
    "roboto",
    [400, 600, 700],
  );
}

function loadRedditSansFonts(): Promise<Font[]> {
  return loadFontFamily(
    "Reddit Sans",
    "@fontsource/reddit-sans",
    "reddit-sans",
    [400, 600, 700],
  );
}

// Rasterizes an SVG icon (stroked or filled with currentColor) into an <img>
// node, since satori's inline SVG support is limited.
async function svgIconNode(
  svg: string,
  color: string,
  size: number,
): Promise<OgNode> {
  const colored = svg.replace(/currentColor/g, color);
  const png = await sharp(Buffer.from(colored))
    .resize(size * 2, size * 2)
    .png()
    .toBuffer();

  return {
    type: "img",
    props: {
      src: `data:image/png;base64,${png.toString("base64")}`,
      width: size,
      height: size,
    },
  };
}

// Satori has no inline text flow for mixed styled children, so comment
// content is laid out word by word inside a wrapping flex row.
function buildContentNodes(
  segments: ContentSegment[],
  colors: { text: string; mention: string },
  maxLength: number = MAX_CONTENT_LENGTH,
): OgNode[] {
  let remaining = maxLength;
  const nodes: OgNode[] = [];

  for (const segment of segments) {
    if (remaining <= 0) break;

    const text =
      segment.type === "mention" ? `@${segment.username}` : segment.value;
    const truncated =
      text.length > remaining ? `${text.slice(0, remaining)}…` : text;
    remaining -= text.length;

    const color = segment.type === "mention" ? colors.mention : colors.text;

    for (const [lineIndex, line] of truncated.split("\n").entries()) {
      if (lineIndex > 0) {
        nodes.push({
          type: "div",
          props: { style: { display: "flex", width: "100%", height: 0 } },
        });
      }

      for (const word of line.split(/\s+/).filter((w) => w.length > 0)) {
        nodes.push({
          type: "span",
          props: { style: { color }, children: word },
        });
      }
    }
  }

  return nodes;
}

async function avatarImageNode(
  avatarSvg: string,
  size: number,
  backgroundColor?: string,
): Promise<OgNode> {
  const png = await sharp(Buffer.from(avatarSvg))
    .resize(size * 2, size * 2)
    .png()
    .toBuffer();

  return {
    type: "img",
    props: {
      src: `data:image/png;base64,${png.toString("base64")}`,
      width: size,
      height: size,
      style: {
        borderRadius: 9999,
        ...(backgroundColor !== undefined ? { backgroundColor } : {}),
      },
    },
  };
}

const EMOJI_DIR = "node_modules/emoji-datasource-google/img/google/64";
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const emojiCache = new Map<string, string | undefined>();

async function loadEmojiImage(grapheme: string): Promise<string | undefined> {
  if (emojiCache.has(grapheme)) return emojiCache.get(grapheme);

  const codepoints = [...grapheme].map((c) =>
    c.codePointAt(0)!.toString(16).padStart(4, "0"),
  );

  const candidates = [
    codepoints.join("-"),
    codepoints.filter((c) => c !== "fe0f").join("-"),
    [...codepoints, "fe0f"].join("-"),
  ];

  let dataUri: string | undefined;

  for (const name of candidates) {
    try {
      const png = await readFile(`${EMOJI_DIR}/${name}.png`);
      dataUri = `data:image/png;base64,${png.toString("base64")}`;
      break;
    } catch {
      // Not this name; try the next candidate.
    }
  }

  emojiCache.set(grapheme, dataUri);
  return dataUri;
}

async function getGraphemeImages(
  text: string,
): Promise<Record<string, string>> {
  const images: Record<string, string> = {};

  for (const { segment } of segmenter.segment(text)) {
    if (!/\p{RI}|\p{Extended_Pictographic}/u.test(segment)) continue;
    if (segment in images) continue;

    const image = await loadEmojiImage(segment);
    if (image !== undefined) images[segment] = image;
  }

  return images;
}

export {
  OG_WIDTH,
  OG_HEIGHT,
  MENTION_COLOR,
  MAX_CONTENT_LENGTH,
  loadRobotoFonts,
  loadRedditSansFonts,
  svgIconNode,
  buildContentNodes,
  avatarImageNode,
  getGraphemeImages,
};
export type { OgNode };
