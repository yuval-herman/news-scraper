import Parser from "rss-parser";

export interface Talkback {
	writer: string;
	title?: string | null;
	content: string;
	createDate: string;
	positive: number;
	negative: number;
	children: Talkback[];
}

export interface Article {
	guid: string;
	title: string;
	link: string;
	pubDate: string;
	content: string;
	contentSnippet: string;
	talkbacks: Talkback[];
}

export async function getRssWithTalkbacks(
	rssURL: string,
	extractID: (item: Article) => string,
	getTalkbacks: (id: string) => Promise<Talkback[]>
) {
	const parser = new Parser();
	let feed;
	try {
		feed = await parser.parseURL(rssURL);
	} catch (error) {
		console.log(error);
		console.log(rssURL);
		return [];
	}
	const itemWithTalkbacks: Article[] = [];
	let counter = 0;
	const totalItems = feed.items.length;
	for (const item of feed.items as Article[]) {
		counter++;
		console.log(`fetching article ${counter} out of ${totalItems}`);
		console.log("article title: " + item.title);

		const itemID = extractID(item);
		itemWithTalkbacks.push({
			...item,
			guid: itemID, //set guid to itemID in case guid doesn't exist (i.e: inn)
			talkbacks: await getTalkbacks(itemID),
		});
	}
	return itemWithTalkbacks;
}
