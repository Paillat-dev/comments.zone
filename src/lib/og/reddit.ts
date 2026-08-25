import satori from "satori";
import sharp from "sharp";
import { ArrowBigUp, ArrowBigDown } from "lucide-static";
import { getCommentDisplayData } from "$lib/comments/common";
import {
  OG_WIDTH,
  OG_HEIGHT,
  MENTION_COLOR,
  loadRedditSansFonts,
  svgIconNode,
  buildContentNodes,
  avatarImageNode,
  getGraphemeImages,
  type OgNode,
} from "./common";

const COLORS = {
  background: "#141211",
  foreground: "#f4f3f3",
  muted: "#998f8c",
  text: "rgb(183, 202, 212)",
};

let iconsPromise: Promise<{ arrowUp: OgNode; arrowDown: OgNode }> | undefined;

function loadIcons(): Promise<{ arrowUp: OgNode; arrowDown: OgNode }> {
  iconsPromise ??= (async () => ({
    arrowUp: await svgIconNode(ArrowBigUp, COLORS.text, 44),
    arrowDown: await svgIconNode(ArrowBigDown, COLORS.text, 44),
  }))();
  return iconsPromise;
}

async function renderRedditOg(
  userSeed: string,
  content: string,
): Promise<Uint8Array> {
  const { username, avatar, numLikes, weeksAge, segments } =
    getCommentDisplayData(userSeed, content);

  const monthsAge = Math.floor(weeksAge / 4);
  const { arrowUp, arrowDown } = await loadIcons();

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
        fontFamily: "Reddit Sans",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", marginRight: 14 },
            children: [await avatarImageNode(avatar.toString(), 110)],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              maxWidth: 820,
              color: COLORS.foreground,
              fontSize: 34,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    gap: 7,
                    marginTop: 20,
                    fontSize: 30,
                  },
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
                        children: "•",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { color: COLORS.muted },
                        children: `${monthsAge}mo ago`,
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
                    marginTop: 20,
                  },
                  children: buildContentNodes(segments, {
                    text: COLORS.text,
                    mention: MENTION_COLOR,
                  }),
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 14,
                    color: COLORS.text,
                  },
                  children: [
                    arrowUp,
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: 30,
                          fontWeight: 600,
                          letterSpacing: "-0.5px",
                        },
                        children: numLikes.replace("k", ""),
                      },
                    },
                    arrowDown,
                  ],
                },
              },
            ],
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
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadRedditSansFonts(),
    graphemeImages: await getGraphemeImages(`${username} ${content}`),
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export { renderRedditOg };
