import { showSaveDialog } from "@luna/lib.native";
import { writeFile } from "fs/promises";

export async function saveCoverToFile(url: string, defaultFilename: string): Promise<boolean>
{
	const { canceled, filePath } = await showSaveDialog(
	{
		defaultPath: defaultFilename,
		filters:
		[
			{ name: "JPEG Image", extensions: ["jpg", "jpeg"] },
			{ name: "All Files", extensions: ["*"] }
		]
	});

	if (canceled || !filePath)
		return false;

	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	await writeFile(filePath, buffer);
	
	return true;
}