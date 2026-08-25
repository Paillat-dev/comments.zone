import { Style, Avatar } from "@dicebear/core";
import definition from "@dicebear/styles/bottts.json" with { type: "json" };

const style = new Style(definition);

function getSeededAvatar(seed: string) {
  return new Avatar(style, { seed });
}

export { getSeededAvatar };
