import { readFile } from "node:fs/promises";
import satori from "satori";
import sharp from "sharp";
import { getCommentDisplayData } from "$lib/comments/common";
import {
  OG_WIDTH,
  OG_HEIGHT,
  MENTION_COLOR,
  loadRobotoFonts,
  svgIconNode,
  buildContentNodes,
  avatarImageNode,
  getGraphemeImages,
  type OgNode,
} from "./common";

const COLORS = {
  background: "#0f0f0f",
  foreground: "#f1f1f1",
  muted: "#999999",
};

let iconsPromise: Promise<{ thumbsUp: OgNode; thumbsDown: OgNode }> | undefined;

function loadIcons(): Promise<{ thumbsUp: OgNode; thumbsDown: OgNode }> {
  iconsPromise ??= (async () => {
    const [up, down] = await Promise.all([
      readFile("src/lib/assets/yt-thumbs-up.svg", "utf8"),
      readFile("src/lib/assets/yt-thumbs-down.svg", "utf8"),
    ]);

    return {
      thumbsUp: await svgIconNode(up, COLORS.foreground, 44),
      thumbsDown: await svgIconNode(down, COLORS.foreground, 44),
    };
  })();
  return iconsPromise;
}

async function renderYoutubeOg(
  userSeed: string,
  content: string,
): Promise<Uint8Array> {
  const { username, avatar, numLikes, weeksAge, segments } =
    getCommentDisplayData(userSeed, content);

  const { thumbsUp, thumbsDown } = await loadIcons();

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
          type: "div",
          props: {
            style: { display: "flex", marginRight: 32 },
            children: [
              await avatarImageNode(avatar.toString(), 110, COLORS.muted),
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 800,
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
                        style: { fontWeight: 600, letterSpacing: "-0.5px" },
                        children: `@${username}`,
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { color: COLORS.muted },
                        children: `${weeksAge} weeks ago`,
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
                  children: buildContentNodes(segments, {
                    text: COLORS.foreground,
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
                    gap: 28,
                    marginTop: 14,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 14,
                        },
                        children: [
                          thumbsUp,
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: 30,
                                letterSpacing: "-0.5px",
                                color: COLORS.muted,
                              },
                              children: numLikes.toUpperCase(),
                            },
                          },
                          thumbsDown,
                        ],
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { fontWeight: 600, letterSpacing: "-0.5px" },
                        children: "Reply",
                      },
                    },
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
    fonts: await loadRobotoFonts(),
    graphemeImages: await getGraphemeImages(`${username} ${content}`),
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export { renderYoutubeOg };
