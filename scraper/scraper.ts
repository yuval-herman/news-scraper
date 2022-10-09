import Database from "better-sqlite3";
import { appendFileSync } from "fs";
import hash from "object-hash";
import path from "path";
import { Article, Talkback } from "./news-providers/base";
import { getInn } from "./news-providers/inn";
import { getMako } from "./news-providers/mako";
import { getNow14 } from "./news-providers/now14";
import { getWalla } from "./news-providers/walla";
import { getYnet } from "./news-providers/ynet";

appendFileSync(
	path.join(__dirname, "scraper-log.log"),
	"scraper wake - " + new Date().toISOString() + "\n"
);

const db = new Database(path.join(__dirname, "db.db"));

db.prepare("PRAGMA recursive_triggers = true").run();

db.prepare(
	`CREATE TABLE IF NOT EXISTS articles (
	id INTEGER PRIMARY KEY,
    guid UNIQUE,
	title,
   	link,
    pubDate,
    content,
    contentSnippet,
	mainTopic
)`
).run();

db.prepare(
	`CREATE TABLE IF NOT EXISTS talkbacks (
        id INTEGER PRIMARY KEY,
		hash UNIQUE,
        writer,
        title,
        content,
        createDate,
        positive,
        negative,
        parentID INTEGER,
		articleGUID,
		FOREIGN KEY(articleGUID) REFERENCES articles(guid)
)`
).run();

db.prepare(
	`CREATE TRIGGER IF NOT EXISTS replace_talkbacks
	AFTER DELETE
	ON talkbacks
	FOR EACH ROW
	BEGIN
		UPDATE talkbacks
		SET id = old.id
		WHERE id = (SELECT MAX(id) FROM talkbacks);
	END;`
).run();

const insertTalkback = db.prepare(`INSERT or REPLACE INTO talkbacks (
    hash,
    writer,
    title,
    content,
    createDate,
    positive,
    negative,
    parentID,
    articleGUID
) VALUES (
    @hash,
    @writer,
    @title,
    @content,
    @createDate,
    @positive,
    @negative,
    @parentID,
    @articleGUID
)`);

export interface DBTalkback extends Talkback {
	id: number | bigint;
	hash: string;
	parentID?: number | bigint | null;
	children: DBTalkback[];
	articleGUID: string;
	mainTopic: string;
}

const insertTalkbacks = db.transaction((talkbacks: DBTalkback[]) => {
	for (const talkback of talkbacks) {
		if (!talkback.title) talkback.title = null;
		if (!talkback.parentID) talkback.parentID = null;
		const {
			positive: _p,
			negative: _n,
			parentID: _pa,
			children: _c,
			...noLikesTalkback
		} = talkback;
		const obj_hash = hash(noLikesTalkback);
		talkback.hash = obj_hash;
		const id = insertTalkback.run(talkback).lastInsertRowid;
		if (talkback.children.length) {
			insertTalkbacks(
				talkback.children.map((item) => {
					item.parentID = id;
					return item;
				})
			);
		}
	}
});

const insertArticle = db.prepare(`INSERT or IGNORE INTO articles (
    guid,
    title,
    link,
    pubDate,
    content,
    contentSnippet,
	mainTopic
    ) VALUES (
        @guid,
        @title,
        @link,
        @pubDate,
        @content,
        @contentSnippet,
		@mainTopic)`);

const insertArticles = async (articles: Article[]) => {
	for (let i = 0; i < articles.length; i++) {
		try {
			const topics = await getTopics(
				articles[i].title,
				articles[i].contentSnippet
			);
			articles[i].mainTopic = JSON.stringify(topics);
		} catch {
			continue;
		}
	}
	db.transaction((articles: Article[]) => {
		for (const article of articles) {
			insertArticle.run(article);
			const addGUID = (item: Talkback): DBTalkback => {
				(item as DBTalkback).articleGUID = article.guid;
				for (let i = 0; i < item.children.length; i++)
					addGUID(item.children[i]);
				return item as DBTalkback;
			};
			insertTalkbacks(article.talkbacks.map(addGUID));
		}
	})(articles);
};

export interface NemoMultiAlignToken {
	text: string;
	label: string;
	start: number;
	end: number;
}

export interface Token {
	nemo_multi_align_token: NemoMultiAlignToken[];
}

export interface Ents {
	token: Token;
}

export interface Token2 {
	text: string;
	nemo_multi_align_token: string;
}

export interface NEMOBase {
	text: string;
	ents: Ents;
	tokens: Token2[];
}

type NEMOResponse = NEMOBase[];

async function getTopics(content: string, backup?: string): Promise<string[]> {
	content = content.replace(/[^א-ת ":,\n]/g, "");
	const res = (await (
		await fetch(
			"http://localhost:8090/multi_to_single?multi_model_name=token-multi&verbose=0",
			{
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					sentences: content,
					tokenized: false,
				}),
				method: "POST",
			}
		)
	).json()) as NEMOResponse;
	let topics = [
		...new Set(
			res
				.map((line) =>
					line.ents.token.nemo_multi_align_token.map((token) => token.text)
				)
				.flat()
		),
	];

	if (!topics.length && backup) {
		return getTopics(backup);
	}
	return topics;
}

async function poolPromises<T>(
	fns: (() => Promise<T>)[],
	concurrentNum?: number
) {
	const results: T[] = [];
	if (!concurrentNum || concurrentNum < 1) {
		concurrentNum = 4;
	}
	for (let i = 0; i < fns.length; i += concurrentNum) {
		const promises = fns.slice(i, i + concurrentNum).map((fn) => fn());
		results.push(...(await Promise.all(promises)));
	}
	return results;
}

poolPromises([getYnet, getMako, getWalla, getInn, getNow14], 4).then((res) =>
	insertArticles(res.flat())
);

appendFileSync(
	path.join(__dirname, "scraper-log.log"),
	"scraper initialized - " + new Date().toISOString() + "\n"
);
