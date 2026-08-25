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

interface CommentData {
  id: number;
  content: string;
}

interface CommentRouteProps {
  platform: PlatformKey;
  comment: CommentData;
}

function getCommentStaticPaths() {
  return Object.entries(platforms).flatMap(([key, platform]) =>
    platform.comments.map(([id, content]) => ({
      params: {
        platform: key,
        id: id.toString(),
      },
      props: {
        platform: key as PlatformKey,
        comment: { id, content },
      } satisfies CommentRouteProps,
    })),
  );
}

export { platforms, getCommentStaticPaths };
export type { Platform, PlatformKey, CommentData, CommentRouteProps };
