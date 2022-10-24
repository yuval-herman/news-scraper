import axios from "axios";
import { Talkback } from "../../common/types";
import { OpenWebApiResult, Comment } from "../types/openweb";
import { getRssWithTalkbacks } from "./base";

export function getNow14() {
	return getRssWithTalkbacks(
		"https://www.now14.co.il/feed/",
		(item) => item.guid.split("?p=")[1],
		async (id: string): Promise<Talkback[]> => {
			const apiResult: OpenWebApiResult = await (
				await axios.post(
					"https://api-2-0.spot.im/v1.0.0/conversation/read",
					{
						count: 999999,
						depth: 99999,
						child_count: 99999,
					},
					{
						headers: {
							"User-Agent": undefined,
							"x-spot-id": "sp_1saykBRP",
							"x-post-id": id,
						},
					}
				)
			).data;
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
