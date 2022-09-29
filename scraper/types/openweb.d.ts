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

export interface Comment {
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

export interface OpenWebApiResult {
	user: User;
	conversation: Conversation;
	extract_data?: any;
	event?: any;
}
