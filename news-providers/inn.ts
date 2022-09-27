import { getRssWithTalkbacks, Talkback } from "./base";

interface User {
	id: string;
	display_name: string;
	image_id: string;
	user_name: string;
	registered: boolean;
	points: number;
	online: boolean;
	is_admin: boolean;
	is_community_moderator: boolean;
	is_moderator: boolean;
	is_super_admin: boolean;
	is_journalist: boolean;
	badge_type: string;
	is_muted: boolean;
	sso_data?: any;
	sso_primary_key: string;
	location: string;
}

interface Rank {
	ranks_up: number;
	ranks_down: number;
	ranked_by_current_user: number;
}

interface Content {
	id: string;
	text: string;
	type: string;
}

interface Metadata {
	previous_state: string;
}

interface Comment {
	conversation_id: string;
	root_comment: string;
	parent_id: string;
	depth: number;
	id: string;
	user_id: string;
	written_at: number;
	time: number;
	replies_count: number;
	offset: number;
	has_next: boolean;
	edited: boolean;
	status: string;
	rank: Rank;
	replies: Comment[];
	content: Content[];
	tags: any[];
	deleted: boolean;
	published: boolean;
	rank_score: number;
	stars: number;
	type: string;
	metadata: Metadata;
	flags?: any;
	featured: boolean;
	top_featured: boolean;
	best_score: number;
	user_display_name: string;
	rt_updated_at: number;
	total_replies_count: number;
	user_reputation: number;
	app_bundle_id: string;
	data_best_score: number;
}

interface Conversation {
	conversation_id: string;
	post_id: string;
	sort_by: string;
	messages_count: number;
	replies_count: number;
	comments_count: number;
	online_users_count: number;
	offset: number;
	has_next: boolean;
	comments: Comment[];
	users: User[];
	max_depth: number;
	personal_preferences?: any;
	community_question: string;
	hidden: boolean;
	read_only: boolean;
}

interface ApiResult {
	user: User;
	conversation: Conversation;
	extract_data?: any;
	event?: any;
}

export function getInn() {
	const spotID = "sp_wqPYg8lN";
	return getRssWithTalkbacks(
		"https://www.inn.co.il/Rss.aspx?act=.1",
		(item) => item.link!.split("/").at(-1)!,
		async (id: string): Promise<Talkback[]> => {
			const apiResult: ApiResult = await (
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
