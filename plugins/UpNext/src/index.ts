import { Tracer, type LunaUnload } from "@luna/core";
import { MediaItem, redux, StyleTag } from "@luna/lib";

import styles from "file://styles.css?minify";
import { createElements, injectContainer, updateDisplay } from "./elements";

export const { trace, errSignal } = Tracer("[UpNext]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./Settings";

new StyleTag("UpNext", unloads, styles);

const elements = createElements(unloads);

let lastMediaTransition = 0;
const COOLDOWN_MS = 50;

export async function updateUpNext(): Promise<void>
{
	try
	{
		await updateDisplay(elements);
	}
	catch (err)
	{
		trace.msg.err.withContext("updateUpNext")(err);
		elements.container.style.display = "none";
	}
}

injectContainer(unloads, elements.container)
	.then(() => updateUpNext())
	.catch(trace.msg.err.withContext("injectContainer"));

MediaItem.onMediaTransition(unloads, () =>
{
	lastMediaTransition = Date.now();
	setTimeout(updateUpNext, 100);
});

redux.intercept([
	"playQueue/MOVE_TO",
	"playQueue/MOVE_NEXT",
	"playQueue/MOVE_PREVIOUS",
	"playQueue/ADD_NOW",
	"playQueue/RESET",
	"playQueue/TOGGLE_SHUFFLE",
	"playQueue/SET_REPEAT_MODE"
], unloads, () =>
{
	if (Date.now() - lastMediaTransition > COOLDOWN_MS)
		setTimeout(updateUpNext, 100);
});

trace.msg.log("UpNext plugin loaded!");