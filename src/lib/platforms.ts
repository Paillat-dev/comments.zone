import { commentsArray as instagramComments } from "$lib/comments/instagram";
import { commentsArray as youtubeComments } from "$lib/comments/youtube";
import { commentsArray as redditComments } from "$lib/comments/reddit";

interface Platform {
  name: string;
  comments: [number, string][];
}

const platforms = {
  i: {
    name: "Instagram",
    comments: instagramComments,
  },
  y: {
    name: "YouTube",
    comments: youtubeComments,
  },
  r: {
    name: "Reddit",
    comments: redditComments,
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

// One entry per comment across every platform, so picking uniformly at random
// from this list weights platforms by how many comments they actually have.
function getAllCommentEntries(): [PlatformKey, number][] {
  return Object.entries(platforms).flatMap(([key, platform]) =>
    platform.comments.map(([id]): [PlatformKey, number] => [
      key as PlatformKey,
      id,
    ]),
  );
}

function getPlatformCommentEntries(
  platform: PlatformKey,
): [PlatformKey, number][] {
  return platforms[platform].comments.map(([id]): [PlatformKey, number] => [
    platform,
    id,
  ]);
}

export {
  platforms,
  getCommentStaticPaths,
  getAllCommentEntries,
  getPlatformCommentEntries,
};
export type { Platform, PlatformKey, CommentData, CommentRouteProps };
