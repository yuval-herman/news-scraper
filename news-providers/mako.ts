import Parser from "rss-parser";

export interface MakoItem {
	title: string;
	link: string;
	pubDate: string;
	content: string;
	contentSnippet: string;
	guid: string;
	isoDate: Date;
}

export interface MakoRss {
	items: MakoItem[];
	title: string;
	description: string;
	link: string;
	language: string;
}

export async function getMako() {
	const parser = new Parser<MakoRss>();
	const feed = await parser.parseURL(
		"https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml"
	);
	const talkbacks = [];
	let counter = 0;
	const totalItems = feed.items.length;
	for (const item of feed.items) {
		counter++;
		console.log(`fetching article ${counter} out of ${totalItems}`);
		console.log("article title: " + item.title);

		const itemID = item.guid;
		talkbacks.push({
			...item,
			talkbacks: await (
				await fetch(
					`https://www.mako.co.il/AjaxPage?jspName=talkbacksInJSONresponse.jsp&vgnextoid=${itemID}&page=1`
				)
			).json(),
		});
	}
	return talkbacks;
}
