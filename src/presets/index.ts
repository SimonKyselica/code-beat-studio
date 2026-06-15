import { tutorial } from "./tutorial";
import { dreamcore } from "./dreamcore";
import { cyberpunk } from "./cyberpunk";
import { dreampunk } from "./dreampunk";

/** DSL source for each named preset, used by the dropdown and preset() calls. */
export const PRESETS: Record<string, string> = {
  tutorial,
  dreamcore,
  cyberpunk,
  dreampunk,
};

export const PRESET_NAMES = Object.keys(PRESETS);
