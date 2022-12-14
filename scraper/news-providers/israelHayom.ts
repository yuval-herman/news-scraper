import axios from "axios";
import { Article, Talkback } from "../../common/types";
import { Comment, OpenWebApiResult } from "../types/openweb";
import { getRssWithTalkbacks } from "./base";

export function getIsraelHayom() {
	return getRssWithTalkbacks(
		"https://www.israelhayom.co.il/rss.xml",
		(item) => item.link.split("/").at(-1)!,
		async (id: string): Promise<Talkback[]> => {
			const apiResult: OpenWebApiResult = await (
				await axios.post(
					"https://api-2-0.spot.im/v1.0.0/conversation/read",
					{
						count: 99999999,
						depth: 9999999,
						child_count: 999999,
					},
					{
						headers: {
							"User-Agent": undefined,
							"x-spot-id": "sp_cFyMERzX",
							"x-post-id": "n" + 13237713,
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
		},
		(article: SpecArticle) => ({
			...article,
			content: article["content:encodedSnippet"] ?? article.content,
		})
	);
}

interface SpecArticle extends Article {
	"content:encodedSnippet"?: string;
}
