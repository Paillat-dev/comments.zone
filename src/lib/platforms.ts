import { commentsArray as instagramComments } from "$lib/comments/instagram";

interface Platform {
  name: string;
  comments: [number, string][];
}

const platforms = {
  i: {
    name: "Instagram",
    comments: instagramComments,
  },
} as const satisfies Record<string, Platform>;

type PlatformKey = keyof typeof platforms;

export { platforms, type Platform, type PlatformKey };
