import { getRssTalkbacks } from "./base";

export function getYnet() {
	return getRssTalkbacks(
		"https://www.ynet.co.il/Integration/StoryRss2.xml",
		(item) => item.link!.split("/").at(-1)!,
		(id) =>
			`https://www.ynet.co.il/iphone/json/api/talkbacks/list/${id}/end_to_start/1`
	);
}
