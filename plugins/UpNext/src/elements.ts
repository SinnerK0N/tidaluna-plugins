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
}

export function createElements(unloads: Set<LunaUnload>): UpNextElements
{
	const container = document.createElement("div");
	container.className = "upnext-container";
	container.style.display = "none";
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

	return { container, label, cover, title, artist };
}

export async function injectContainer(unloads: Set<LunaUnload>, container: HTMLElement): Promise<void>
{
	const playbackContainer = await observePromise<HTMLElement>(unloads, `[class*="_playbackControlsContainer_"]`);
	if (playbackContainer == null)
		throw new Error("Failed to find playback controls container element!");

	const parentElement = playbackContainer.parentElement;
	if (parentElement == null)
		throw new Error("Failed to find playback controls container parent element!");

	parentElement.insertBefore(container, playbackContainer);
}

export async function updateDisplay(elements: UpNextElements): Promise<boolean>
{
	const { container, label, cover, title, artist } = elements;

	const nextItem = await PlayState.nextMediaItem();
	if (!nextItem)
	{
		container.style.display = "none";
		return false;
	}

	const trackTitle = await nextItem.title();
	if (!trackTitle)
	{
		container.style.display = "none";
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

	container.style.display = "flex";
	return true;
}
