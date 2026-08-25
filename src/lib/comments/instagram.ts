import rawCommentsArray from "$src/comments/instagram.json" with { type: "json" };
import { hashString } from "$lib/utils";

const commentsArray: [number, string][] = rawCommentsArray.map(
  (comment): [number, string] => {
    return [hashString(comment), comment];
  },
);

export const commentKeys: number[] = commentsArray.map(
  (comment): number => comment[0],
);

export { commentsArray };
