import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";
import { updateUpNext } from "./index";

export const settings = await ReactiveStore.getPluginStorage("UpNext", {
	showLabel: true,
	showCover: true,
	showArtist: true,
});

export const Settings = () =>
{
	const [showLabel, setShowLabel] = React.useState(settings.showLabel);
	const [showCover, setShowCover] = React.useState(settings.showCover);
	const [showArtist, setShowArtist] = React.useState(settings.showArtist);

	return (
		<LunaSettings>
			<LunaSwitchSetting
				title='Show "Up Next" Label'
				desc='Display the "Up Next:" text label before the actual track info'
				checked={showLabel}
				onChange={(_: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
				{
					setShowLabel((settings.showLabel = checked));
					updateUpNext();
				}}
			/>
			<LunaSwitchSetting
				title="Show Cover Art"
				desc="Display the album/song cover art"
				checked={showCover}
				onChange={(_: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
				{
					setShowCover((settings.showCover = checked));
					updateUpNext();
				}}
			/>
			<LunaSwitchSetting
				title="Show Artist Name"
				desc="Display the artist name below the track title"
				checked={showArtist}
				onChange={(_: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
				{
					setShowArtist((settings.showArtist = checked));
					updateUpNext();
				}}
			/>
		</LunaSettings>
	);
};
