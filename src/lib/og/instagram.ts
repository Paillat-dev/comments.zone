import { readFile } from "node:fs/promises";
import satori, { type Font } from "satori";
import sharp from "sharp";
import { getCommentDisplayData } from "$lib/comments/instagram";
import { Heart } from "lucide-static";

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  background: "#222328",
  foreground: "#f8f9f9",
  muted: "#b8b9bd",
  mention: "#3b82f6",
};

interface OgNode {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: (OgNode | string)[] | OgNode | string;
    [key: string]: unknown;
  };
}

let fontsPromise: Promise<Font[]> | undefined;

function loadFonts(): Promise<Font[]> {
  fontsPromise ??= Promise.all(
    ([400, 600, 700] as const).map(async (weight): Promise<Font> => {
      const data = await readFile(
        `node_modules/@fontsource/roboto/files/roboto-latin-${weight}-normal.woff`,
      );
      return { name: "Roboto", data, weight, style: "normal" };
    }),
  );
  return fontsPromise;
}

const MAX_CONTENT_LENGTH = 260;

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

let heartIconPromise: Promise<OgNode> | undefined;

function loadHeartIcon(): Promise<OgNode> {
  heartIconPromise ??= (async () => {
    const svg = Heart.replace(/currentColor/g, COLORS.muted);
    const png = await sharp(Buffer.from(svg)).resize(88, 88).png().toBuffer();

    return {
      type: "img",
      props: {
        src: `data:image/png;base64,${png.toString("base64")}`,
        width: 44,
        height: 44,
      },
    } satisfies OgNode;
  })();
  return heartIconPromise;
}

async function renderInstagramOg(
  userSeed: string,
  content: string,
): Promise<Uint8Array> {
  const { username, avatar, numLikes, weeksAge, segments } =
    getCommentDisplayData(userSeed, content);

  const avatarPng = await sharp(Buffer.from(avatar.toString()))
    .resize(220, 220)
    .png()
    .toBuffer();

  let remaining = MAX_CONTENT_LENGTH;
  const contentChildren: OgNode[] = [];

  for (const segment of segments) {
    if (remaining <= 0) break;

    const text =
      segment.type === "mention" ? `@${segment.username}` : segment.value;
    const truncated =
      text.length > remaining ? `${text.slice(0, remaining)}…` : text;
    remaining -= text.length;

    const color =
      segment.type === "mention" ? COLORS.mention : COLORS.foreground;

    for (const [lineIndex, line] of truncated.split("\n").entries()) {
      if (lineIndex > 0) {
        contentChildren.push({
          type: "div",
          props: { style: { display: "flex", width: "100%", height: 0 } },
        });
      }

      for (const word of line.split(/\s+/).filter((w) => w.length > 0)) {
        contentChildren.push({
          type: "span",
          props: { style: { color }, children: word },
        });
      }
    }
  }

  const card: OgNode = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        maxWidth: 1080,
        padding: 64,
        backgroundColor: COLORS.background,
        fontFamily: "Roboto",
      },
      children: [
        {
          type: "img",
          props: {
            src: `data:image/png;base64,${avatarPng.toString("base64")}`,
            width: 110,
            height: 110,
            style: {
              borderRadius: 9999,
              backgroundColor: COLORS.muted,
              marginRight: 32,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 720,
              color: COLORS.foreground,
              fontSize: 34,
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "row", gap: 14 },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { fontWeight: 600 },
                        children: username,
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { color: COLORS.muted },
                        children: `${weeksAge}w`,
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexWrap: "wrap",
                    columnGap: 9,
                    rowGap: 6,
                  },
                  children: contentChildren,
                },
              },
              {
                type: "div",
                props: {
                  style: { fontWeight: 600, color: COLORS.muted },
                  children: "Reply",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              marginLeft: 48,
              marginTop: 16,
              color: COLORS.muted,
              fontSize: 30,
              fontWeight: 600,
            },
            children: [await loadHeartIcon(), numLikes],
          },
        },
      ],
    },
  };

  const scene: OgNode = {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.background,
      },
      children: [card],
    },
  };

  const svg = await satori(scene as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: await loadFonts(),
    graphemeImages: await getGraphemeImages(`${username} ${content}`),
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export { renderInstagramOg, WIDTH as OG_WIDTH, HEIGHT as OG_HEIGHT };
