import type { APIRoute } from "astro";
import {
  getCommentStaticPaths,
  type CommentRouteProps,
  type PlatformKey,
} from "$lib/platforms";
import { renderInstagramOg } from "$lib/og/instagram";
import { renderYoutubeOg } from "$lib/og/youtube";
import { renderRedditOg } from "$lib/og/reddit";

export const getStaticPaths = getCommentStaticPaths;

const renderers: Record<
  PlatformKey,
  (userSeed: string, content: string) => Promise<Uint8Array>
> = {
  i: renderInstagramOg,
  y: renderYoutubeOg,
  r: renderRedditOg,
};

export const GET: APIRoute<CommentRouteProps> = async ({ props }) => {
  const { platform, comment } = props;
  const png = await renderers[platform](comment.id.toString(), comment.content);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
