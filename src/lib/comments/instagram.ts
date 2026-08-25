import rawCommentsArray from "$src/comments/instagram.json" with { type: "json" };
import {
  hashString,
  getSeededUsername,
  getSeededAvatar,
  getDistributedRandom,
} from "$lib/utils";

const seenIds = new Set<number>();

const commentsArray: [number, string][] = rawCommentsArray
  .map((comment): [number, string] => {
    return [hashString(comment), comment];
  })
  .filter(([id]) => {
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });

export const commentKeys: number[] = commentsArray.map(
  (comment): number => comment[0],
);

interface TextSegment {
  type: "text";
  value: string;
}

interface MentionSegment {
  type: "mention";
  username: string;
}

type ContentSegment = TextSegment | MentionSegment;

const likesFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
});

function getCommentDisplayData(userSeed: string, content: string) {
  const username = getSeededUsername(userSeed);
  const avatar = getSeededAvatar(userSeed);
  const numLikes = likesFormatter
    .format(getDistributedRandom(userSeed, 250, 200000))
    .toLowerCase();
  const weeksAge = getDistributedRandom(userSeed, 1, 150);

  let userIndex = 1;

  const segments: ContentSegment[] = content
    .split(/(@user)/g)
    .filter((value) => value.length > 0)
    .map((value): ContentSegment => {
      if (value === "@user") {
        return {
          type: "mention",
          username: getSeededUsername(userSeed, userIndex++),
        };
      }

      return {
        type: "text",
        value,
      };
    });

  return { username, avatar, numLikes, weeksAge, segments };
}

export { commentsArray, getCommentDisplayData };
export type { ContentSegment, TextSegment, MentionSegment };
