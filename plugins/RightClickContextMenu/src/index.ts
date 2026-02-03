import { Tracer, type LunaUnload } from "@luna/core";
import { observe, observePromise } from "@luna/lib";

export const { trace } = Tracer("[RightClickContextMenu]");
export const unloads = new Set<LunaUnload>();

const ATTACHED_KEY = "__rightClickContextMenuAttached";

function scheduleRepositionContextMenu(clientX: number): void
{
	observePromise(unloads, `[data-test="contextmenu"]`, 1500).then((menuEl) =>
	{
		if (!menuEl) 
			return;

		const parent = menuEl.parentElement;
		if (!parent || !(parent instanceof HTMLElement)) 
			return;

		const target = parent;

		const rect = target.getBoundingClientRect();
		const left = Math.max(0, Math.min(clientX, window.innerWidth - rect.width));
		const leftPx = `${left}px`;

		const apply = () =>
		{
			//changing the X pos is enough because Y is correct (the context menu button is in the same height)
			target.style.left = leftPx;
		};
		apply();

		//we need to reapply the position because it gets moved back when the element is being hydrated
		const observer = new MutationObserver(() =>
		{
			if (!target.isConnected) 
				return;

			if (target.style.left !== leftPx)
				apply();
		});
		observer.observe(target, { attributes: true, attributeFilter: ["style"] });
		setTimeout(() => observer.disconnect(), 600); //600ms should be enough for it to stop getting moved
	}).catch(() => {});
}

function findContextMenuButton(from: Element): HTMLElement | null
{
	const btn = from.querySelector(`[data-type="contextmenu-open"]`);
	return btn ? (btn as HTMLElement) : null;
}

type AttachedEntry = { element: Element; listener: (e: Event) => void };
const attachedListeners = new Set<AttachedEntry>();
unloads.add(() =>
{
	for (const { element, listener } of attachedListeners)
	{
		element.removeEventListener("contextmenu", listener as EventListener);
		delete (element as unknown as Record<string, unknown>)[ATTACHED_KEY];
	}
	attachedListeners.clear();
});

function openContextMenu(event: MouseEvent, element: Element): void
{
	event.preventDefault();

	const button = findContextMenuButton(element);
	if (button)
	{
		button.click();
		scheduleRepositionContextMenu(event.clientX);
	}
	else
		trace.msg.warn("Could not find the button to open context menu with!");
}

function attachContextMenu(element: Element, handler: (event: MouseEvent) => void): void
{
	if ((element as unknown as Record<string, unknown>)[ATTACHED_KEY])
		return;

	(element as unknown as Record<string, unknown>)[ATTACHED_KEY] = true;
	
	const listener = (event: Event) => handler(event as MouseEvent);
	element.addEventListener("contextmenu", listener);
	attachedListeners.add({ element, listener });
}

observe(unloads, `[data-test="new-media-table-row"]`, (row) =>
{
	attachContextMenu(row, (event) => openContextMenu(event, row));
});
observe(unloads, `[data-test="footer-track-title"]`, (footer) =>
{
	attachContextMenu(footer, (event) => openContextMenu(event, footer));
});

trace.msg.log("RightClickContextMenu plugin loaded!");