import Parser from "rss-parser";
import { Article, Talkback } from "../../common/types";

/**
 * Base function for all providers.
 * Gets an rss url and custom functions for a specific site and extracts data and talkbacks.
 * @param rssURL url to extract rss feed from
 * @param extractID function that receives an article and return it's ID
 * @param getTalkbacks function that receives an ID and return talkbacks
 */
export async function getRssWithTalkbacks(
	rssURL: string,
	extractID: (item: Article) => string,
	getTalkbacks: (id: string) => Promise<Talkback[]>
): Promise<Article[]> {
	const parser = new Parser();
	let feed;
	// Instead of raising the error and stopping execution I decided to
	// ignore single-provider errors. I don't mind missing one provider once in a while since
	// the info is not critical and abundant already.
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
