import { OpenWebApiResult, Comment } from "../types/openweb";
import { getRssWithTalkbacks, Talkback } from "./base";

export function getInn() {
	return getRssWithTalkbacks(
		"https://www.inn.co.il/Rss.aspx?act=.1",
		(item) => item.link!.split("/").at(-1)!,
		async (id: string): Promise<Talkback[]> => {
			const apiResult: OpenWebApiResult = await (
				await fetch("https://api-2-0.spot.im/v1.0.0/conversation/read", {
					credentials: "include",
					headers: {
						"x-spot-id": "sp_wqPYg8lN",
						"x-post-id": "0-" + id,
					},
					body: JSON.stringify({
						conversation_id: "sp_wqPYg8lN_0-" + id,
						count: 999999,
						depth: 99999,
						child_count: 99999,
					}),
					method: "POST",
				})
			).json();
			const convertTalkback = (item: Comment): Talkback => ({
				writer: item.user_display_name,
				content: item.content[0].text,
				createDate: new Date(item.time * 1000).toISOString(),
				negative: item.rank.ranks_down,
				positive: item.rank.ranks_up,
				children: item.replies.length
					? item.replies.map(convertTalkback)
					: [],
			});
			return apiResult.conversation.comments.map(convertTalkback);
		}
	);
}
