import { getRssWithTalkbacks, Talkback } from "./base";

interface Item {
	postId: number;
	index: number;
	subject: string;
	text: string;
	isMobile: boolean;
	username: string;
	date: string;
	dateMs: number;
	replies: Item[];
}

interface ApiResult {
	numMainPosts: number;
	numReplies: number;
	numPages: number;
	mainPosts: Item[];
}

export function getMako() {
	return getRssWithTalkbacks(
		"https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml",
		(item) => item.guid!,
		async (id: string): Promise<Talkback[]> => {
			const apiResult: ApiResult = await await (
				await fetch(
					`https://www.mako.co.il/AjaxPage?jspName=talkbacksInJSONresponse.jsp&vgnextoid=${id}&page=1`
				)
			).json();
			const convertTalkback = (item: Item): Talkback => ({
				title: item.subject,
				writer: item.username,
				content: item.text,
				createDate: new Date(item.dateMs).toISOString(),
				negative: 0,
				positive: 0,
				children: item.replies.length
					? item.replies.map(convertTalkback)
					: [],
			});
			return apiResult.mainPosts.map(convertTalkback);
		}
	);
}
