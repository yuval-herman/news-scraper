import { getRssWithTalkbacks, Talkback } from "./base";

interface Item {
	id: number;
	fatherId: number;
	writer: string;
	content: string;
	createDate: string;
	c1: string;
	positive: number;
	negative: number;
	children: Item[];
}

interface Data {
	list?: Item[];
	total: number;
	discussions: number;
}

interface ApiResult {
	result: string;
	data: Data;
}

export function getWalla() {
	return getRssWithTalkbacks(
		"https://rss.walla.co.il/feed/1?type=main",
		(item) => item.link!.split("/").at(-1)!,
		(id) => `https://dal.walla.co.il/talkback/list/${id}?type=1&page=1`,
		(apiResult: ApiResult): Talkback[] => {
			const convertTalkback = (
				item: Item
			): {
				createDate: Date;
				children: Talkback[];
				id: number;
				fatherId: number;
				writer: string;
				content: string;
				c1: string;
				positive: number;
				negative: number;
			} => ({
				...item,
				createDate: new Date(item.createDate),
				children: item.children.length
					? item.children.map(convertTalkback)
					: [],
			});
			return apiResult.data.list
				? apiResult.data.list.map(convertTalkback)
				: [];
		}
	);
}
