import { Tracer, type LunaUnload } from "@luna/core";
import { ContextMenu, type MediaItem } from "@luna/lib";
import { saveCoverToFile } from "./download.native";

export const { trace, errSignal } = Tracer("[CoverFetcher]");

export const unloads = new Set<LunaUnload>();

const COVER_SIZES = ["1280", "1080", "750", "640", "480", "320", "160", "80"] as const;

async function getBestCoverUrl(mediaItem: MediaItem): Promise<string | undefined>
{
	for (const size of COVER_SIZES)
	{
		const url = await mediaItem.coverUrl(size);
		if (url)
			return url;
	}

	//Try album if mediaItem doesnt have a cover
	const album = await mediaItem.album();
	if (album)
	{
		for (const size of COVER_SIZES)
		{
			const url = album.coverUrl(size);
			if (url)
				return url;
		}
	}

	return undefined;
}

async function copyToClipboard(text: string): Promise<void>
{
	try
	{
		await navigator.clipboard.writeText(text);
	}
	catch (error)
	{
		trace.msg.err(`Failed to copy to clipboard: ${error}`);
		throw error;
	}
}

async function generateFilename(mediaItem: MediaItem): Promise<string>
{
	const title = await mediaItem.title() ?? "cover";
	const album = await mediaItem.album();
	const albumTitle = album ? await album.title() : undefined;
	const artist = await mediaItem.artist();
	const artistName = artist?.name;

	const parts: string[] = [];

	if (artistName)
		parts.push(artistName);

	if (albumTitle)
		parts.push(albumTitle);
	else
		parts.push(title);

	const filename = parts
		.join(" - ")
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, " ")
		.trim();

	return `${filename}.jpg`;
}

const downloadButton = ContextMenu.addButton(unloads);
const copyLinkButton = ContextMenu.addButton(unloads);

ContextMenu.onMediaItem(unloads, async ({ mediaCollection, contextMenu }) =>
{
	const trackCount = await mediaCollection.count();
	if (trackCount === 0)
		return;

	const mediaItems = await mediaCollection.mediaItems();
	const firstItem = (await mediaItems.next()).value;
	if (!firstItem)
		return;

	const coverUrl = await getBestCoverUrl(firstItem);
	if (!coverUrl)
		return;

	downloadButton.text = "Download Cover Art";
	downloadButton.onClick(async () =>
	{
		try
		{
			const filename = await generateFilename(firstItem);
			downloadButton.text = "Downloading...";
			const success = await saveCoverToFile(coverUrl, filename);
			downloadButton.text = success ? "Downloaded!" : "Cancelled";
			setTimeout(() =>
			{
				downloadButton.text = "Download Cover Art";
			}, 2000);
		}
		catch (error)
		{
			trace.msg.err(`Download failed: ${error}`);
			downloadButton.text = "Download failed!";
			setTimeout(() =>
			{
				downloadButton.text = "Download Cover Art";
			}, 2000);
		}
	});

	copyLinkButton.text = "Copy Cover Art Link";
	copyLinkButton.onClick(async () =>
	{
		try
		{
			await copyToClipboard(coverUrl);
			copyLinkButton.text = "Link copied!";
			setTimeout(() =>
			{
				copyLinkButton.text = "Copy Cover Art Link";
			}, 2000);
		}
		catch (error)
		{
			copyLinkButton.text = "Copy failed!";
			setTimeout(() =>
			{
				copyLinkButton.text = "Copy Cover Art Link";
			}, 2000);
		}
	});

	await downloadButton.show(contextMenu);
	await copyLinkButton.show(contextMenu);
});

trace.msg.log("CoverFetcher plugin loaded!");
