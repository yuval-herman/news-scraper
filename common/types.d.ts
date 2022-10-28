export interface Talkback {
	writer: string;
	title?: string | null;
	content: string;
	createDate: string;
	positive: number;
	negative: number;
	children: Talkback[];
}

export interface Article {
	guid: string;
	title: string;
	link: string;
	pubDate: string;
	content: string;
	contentSnippet: string;
	mainTopic?: string;
	talkbacks: Talkback[];
}

export interface DBTalkback extends Talkback {
	id: number | bigint;
	hash: string;
	parentID?: number | bigint | null;
	children: DBTalkback[];
	articleGUID: string;
	mainTopic: string | string[];
}

export interface Score {
	name: string;
	score: number;
	difficulty: number;
}
