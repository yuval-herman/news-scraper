import Parser, { Item } from "rss-parser";

export interface Talkback {
	writer: string;
	title?: string;
	content: string;
	createDate: Date;
	positive: number;
	negative: number;
	children: Talkback[];
}

export async function getRssWithTalkbacks(
	rssURL: string,
	extractID: (item: Item) => string,
	getTalkbacksUrl: (id: string) => string,
	normalizeTalkbacks: (talkbacks: any) => Talkback[]
) {
	const parser = new Parser();
	const feed = await parser.parseURL(rssURL);
	const itemWithTalkbacks = [];
	let counter = 0;
	const totalItems = feed.items.length;
	for (const item of feed.items) {
		counter++;
		console.log(`fetching article ${counter} out of ${totalItems}`);
		console.log("article title: " + item.title);

		const itemID = extractID(item);
		const talkbacks = await (await fetch(getTalkbacksUrl(itemID))).json();
		itemWithTalkbacks.push({
			...item,
			talkbacks: normalizeTalkbacks(talkbacks),
		});
	}
	return itemWithTalkbacks;
}
