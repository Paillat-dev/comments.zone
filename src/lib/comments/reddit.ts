import rawCommentsArray from "$src/comments/reddit.json" with { type: "json" };
import { buildCommentsArray } from "./common";

const commentsArray = buildCommentsArray(rawCommentsArray);

export { commentsArray };
