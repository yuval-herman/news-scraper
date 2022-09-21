import Parser, { Item } from "rss-parser";

export async function getRssTalkbacks(
	rssURL: string,
	extractID: (item: Item) => string,
	getTalkbacksUrl: (id: string) => string
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
		itemWithTalkbacks.push({
			...item,
			talkbacks: await (await fetch(getTalkbacksUrl(itemID))).json(),
		});
	}
	return itemWithTalkbacks;
}
