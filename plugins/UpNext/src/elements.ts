import type { LunaUnload } from "@luna/core";
import { PlayState, observePromise } from "@luna/lib";

import { settings } from "./Settings";

export interface UpNextElements
{
	container: HTMLDivElement;
	label: HTMLSpanElement;
	cover: HTMLImageElement;
	title: HTMLSpanElement;
	artist: HTMLSpanElement;
	injected: boolean;
}

export function createElements(unloads: Set<LunaUnload>): UpNextElements
{
	const container = document.createElement("div");
	container.className = "upnext-container hidden";
	unloads.add(() => container.remove());

	const label = document.createElement("span");
	label.className = "upnext-label";
	label.textContent = "Up Next:";

	const cover = document.createElement("img");
	cover.className = "upnext-cover";
	cover.alt = "";

	const track = document.createElement("div");
	track.className = "upnext-track";

	const title = document.createElement("span");
	title.className = "upnext-title";

	const artist = document.createElement("span");
	artist.className = "upnext-artist";

	track.appendChild(title);
	track.appendChild(artist);
	container.appendChild(label);
	container.appendChild(cover);
	container.appendChild(track);

	return { container, label, cover, title, artist, injected: false };
}

export function tryInjectContainer(elements: UpNextElements): boolean
{
	if (elements.injected) return true;

	const leftColumn = document.querySelector<HTMLElement>(`[data-test="left-column-footer-player"]`);
	if (!leftColumn) return false;

	leftColumn.appendChild(elements.container);
	elements.injected = true;
	return true;
}

export function startContainerObserver(unloads: Set<LunaUnload>, elements: UpNextElements, onInjected: () => void): void
{
	if (tryInjectContainer(elements))
	{
		onInjected();
		return;
	}

	observePromise<HTMLElement>(unloads, `[data-test="left-column-footer-player"]`)
		.then(() =>
		{
			if (tryInjectContainer(elements))
				onInjected();
		})
		.catch(() => {});
}

export async function updateDisplay(elements: UpNextElements): Promise<boolean>
{
	const { container, label, cover, title, artist } = elements;

	const nextItem = await PlayState.nextMediaItem();
	if (!nextItem)
	{
		container.classList.add("hidden");
		return false;
	}

	const trackTitle = await nextItem.title();
	if (!trackTitle)
	{
		container.classList.add("hidden");
		return false;
	}

	title.textContent = trackTitle;

	const trackArtist = await nextItem.artist();
	if (settings.showArtist && trackArtist?.name)
	{
		artist.textContent = trackArtist.name;
		artist.style.display = "block";
	}
	else
	{
		artist.style.display = "none";
	}

	label.style.display = settings.showLabel ? "inline" : "none";

	if (settings.showCover)
	{
		const coverUrl = await nextItem.coverUrl({ res: "80" });
		cover.src = coverUrl ?? "";
		cover.style.display = coverUrl ? "block" : "none";
	}
	else
	{
		cover.style.display = "none";
	}

	container.classList.remove("hidden");
	return true;
}
