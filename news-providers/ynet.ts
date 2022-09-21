import Parser from "rss-parser";

export interface YnetItem {
	title: string;
	link: string;
	pubDate: string;
	content: string;
	contentSnippet: string;
	guid: string;
	isoDate: Date;
}

export interface YnetImage {
	link: string;
	url: string;
	title: string;
}

export interface YnetRss {
	items: YnetItem[];
	image: YnetImage;
	title: string;
	description: string;
	pubDate: string;
	link: string;
	language: string;
	copyright: string;
	lastBuildDate: string;
}

export async function getYnet() {
	const parser = new Parser<YnetRss>();
	const feed = await parser.parseURL(
		"https://www.ynet.co.il/Integration/StoryRss2.xml"
	);
	const talkbacks = [];
	let counter = 0;
	const totalItems = feed.items.length;
	for (const item of feed.items) {
		counter++;
		console.log(`fetching article ${counter} out of ${totalItems}`);
		console.log("article title: " + item.title);

		const itemID = item.link.split("/").at(-1);
		talkbacks.push({
			...item,
			talkbacks: (
				await (
					await fetch(
						`https://www.ynet.co.il/iphone/json/api/talkbacks/list/${itemID}/end_to_start/1`
					)
				).json()
			).rss,
		});
	}
	return talkbacks;
}
