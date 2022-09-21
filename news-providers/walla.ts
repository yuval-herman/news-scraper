import { getRssTalkbacks } from "./base";

export interface WallaEnclosure {
	url: string;
	length: string;
	type: string;
}

export interface WallaItem {
	title: string;
	link: string;
	pubDate: string;
	enclosure: WallaEnclosure;
	content: string;
	contentSnippet: string;
	guid: string;
	isoDate: Date;
}

export interface WallaImage {
	link: string;
	url: string;
	title: string;
}

export interface WallaRss {
	items: WallaItem[];
	image: WallaImage;
	title: string;
	description: string;
	generator: string;
	link: string;
	language: string;
	copyright: string;
	lastBuildDate: string;
	docs: string;
}

export function getWalla() {
	return getRssTalkbacks(
		"https://rss.walla.co.il/feed/1?type=main",
		(item) => item.link!.split("/").at(-1)!,
		(id) => `https://dal.walla.co.il/talkback/list/${id}?type=1&page=1`
	);
}
