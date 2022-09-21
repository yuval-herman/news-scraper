import { getRssTalkbacks } from "./base";

export function getWalla() {
	return getRssTalkbacks(
		"https://rss.walla.co.il/feed/1?type=main",
		(item) => item.link!.split("/").at(-1)!,
		(id) => `https://dal.walla.co.il/talkback/list/${id}?type=1&page=1`
	);
}
