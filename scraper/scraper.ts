import hash from "object-hash";
import { appendFileSync, writeFileSync } from "fs";
import { getMako } from "./news-providers/mako";
import { getWalla } from "./news-providers/walla";
import { getYnet } from "./news-providers/ynet";
import Database from "better-sqlite3";
import { Article, Talkback } from "./news-providers/base";
import path from "path";
import { getInn } from "./news-providers/inn";
import { getNow14 } from "./news-providers/now14";

appendFileSync(
	path.join(__dirname, "scraper-log.log"),
	"scraper wake - " + new Date().toISOString() + "\n"
);

const db = new Database(path.join(__dirname, "db.db"));

db.prepare(
	`CREATE TABLE IF NOT EXISTS articles (
    guid PRIMARY KEY,
	title,
   	link,
    pubDate,
    content,
    contentSnippet
)`
).run();

db.prepare(
	`CREATE TABLE IF NOT EXISTS talkbacks (
        id PRIMARY KEY,
        writer,
        title,
        content,
        createDate,
        positive,
        negative,
        parentID INTEGER,
        articleGUID NOT NULL
)`
).run();

const insertTalkback = db.prepare(`INSERT or IGNORE INTO talkbacks (
    id,
    writer,
    title,
    content,
    createDate,
    positive,
    negative,
    parentID,
    articleGUID
) VALUES (
    @id,
    @writer,
    @title,
    @content,
    @createDate,
    @positive,
    @negative,
    @parentID,
    @articleGUID
)`);

interface DBTalkback extends Talkback {
	id: string;
	parentID?: string | null;
	children: DBTalkback[];
	articleGUID: string;
}

const insertTalkbacks = db.transaction((talkbacks: DBTalkback[]) => {
	for (const talkback of talkbacks) {
		if (!talkback.title) talkback.title = null;
		if (!talkback.parentID) talkback.parentID = null;
		const id = hash(talkback);
		talkback.id = id;
		insertTalkback.run(talkback);
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
    contentSnippet
    ) VALUES (
        @guid,
        @title,
        @link,
        @pubDate,
        @content,
        @contentSnippet)`);

const insertArticles = db.transaction((articles: Article[]) => {
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
});

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
