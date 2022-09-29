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
		async (id: string): Promise<Talkback[]> => {
			let pageCounter = 1;
			const apiURL = `https://dal.walla.co.il/talkback/list/${id}?type=1&page=`;
			let tempResult: ApiResult = await (
				await fetch(apiURL + pageCounter)
			).json();
			const apiResult: ApiResult = tempResult;
			if (!apiResult.data.list) return [];
			while (apiResult.data.discussions > apiResult.data.list.length) {
				pageCounter++;
				tempResult = await (await fetch(apiURL + pageCounter)).json();
				apiResult.data.list = apiResult.data.list.concat(
					tempResult.data.list!
				);
			}
			const convertTalkback = (item: Item): Talkback => {
				const [time, date] = item.createDate.split(" ");
				const [day, month, year] = date.split(".").map(Number);
				const [hour, minute] = time.split(":").map(Number);
				return {
					...item,
					createDate: new Date(
						year + 2000,
						month,
						day,
						hour,
						minute
					).toISOString(),
					children: item.children.length
						? item.children.map(convertTalkback)
						: [],
				};
			};
			return apiResult.data.list
				? apiResult.data.list.map(convertTalkback)
				: [];
		}
	);
}
