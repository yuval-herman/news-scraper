import { Talkback } from "../../common/types";
import { getRssWithTalkbacks } from "./base";

interface TalkbackParentId {
	talkbackId: number;
	title: string;
	text: string;
	author: string;
	sourceIp: string;
	authorLocation: string;
	authorEmail: string;
	date: string;
	filterTalkbackStatusValue: string;
	articleId: string;
	isConfirmed: boolean;
	inappropriateWordTypes: number;
	recommended: boolean;
	talkback_number: number;
	talkback_parent_id?: any;
}

interface Item {
	id: number;
	number?: number;
	title: string;
	author: string;
	pubDate: string;
	text: string;
	level: number;
	recommended: boolean;
	talkback_like: number;
	authorLocation: string;
	talkback_parent_id?: TalkbackParentId;
	likes: number;
	unlikes: number;
}

interface Channel {
	hasMore: number;
	sum_talkbacks: number;
	sum_discussions: number;
	item?: Item[];
}

interface Rss {
	channel: Channel;
}

interface ApiResult {
	rss: Rss;
}

export function getYnet() {
	return getRssWithTalkbacks(
		"https://www.ynet.co.il/Integration/StoryRss2.xml",
		(item) => item.link!.split("/").at(-1)!,
		async (id: string): Promise<Talkback[]> => {
			let pageCounter = 1;
			const apiURL = `https://www.ynet.co.il/iphone/json/api/talkbacks/list/${id}/start_to_end/`;
			let tempResult: ApiResult = await (
				await fetch(apiURL + pageCounter)
			).json();
			const apiResult: ApiResult = tempResult;
			while (tempResult.rss.channel.hasMore) {
				pageCounter++;
				tempResult = await (await fetch(apiURL + pageCounter)).json();
				apiResult.rss.channel.item = apiResult.rss.channel.item!.concat(
					tempResult.rss.channel.item!
				);
			}
			const convertTalkback = (item: Item | TalkbackParentId): Talkback => ({
				writer: item.author,
				title: item.title,
				createDate: "pubDate" in item ? item.pubDate : item.date,
				content: item.text,
				children: [],
				negative: "unlikes" in item ? item.unlikes : 0,
				positive: "likes" in item ? item.likes : 0,
			});
			if (!apiResult.rss.channel.item) return [];
			const normalized: Talkback[] = [];
			const children: Item[] = [];

			for (const item of apiResult.rss.channel.item) {
				if (item.talkback_parent_id) {
					children.push(item);
				} else {
					normalized.push(convertTalkback(item));
				}
			}

			for (const talkback of normalized) {
				for (const child of children) {
					const converted = convertTalkback(child.talkback_parent_id!);
					if (
						talkback.content === converted.content &&
						talkback.createDate === converted.createDate &&
						talkback.title === converted.title &&
						talkback.writer === converted.writer
					)
						talkback.children.push(convertTalkback(child));
				}
			}

			return normalized;
		}
	);
}
