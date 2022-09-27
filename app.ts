import { appendFileSync, writeFileSync } from "fs";
import { getMako } from "./news-providers/mako";
import { getWalla } from "./news-providers/walla";
import { getYnet } from "./news-providers/ynet";
import Database from "better-sqlite3";
import { Article, Talkback } from "./news-providers/base";
import path from "path";

appendFileSync(
	path.join(__dirname, "scraper-log.log"),
	"scraper wake - " + new Date().toISOString() + "\n"
);

const db = new Database("db.db");

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
        id INTEGER PRIMARY KEY,
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
    writer,
    title,
    content,
    createDate,
    positive,
    negative,
    parentID,
    articleGUID
) VALUES (
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
	parentID?: number | bigint | null;
	children: DBTalkback[];
	articleGUID: string;
}

const insertTalkbacks = db.transaction((talkbacks: DBTalkback[]) => {
	for (const talkback of talkbacks) {
		if (!talkback.title) talkback.title = null;
		if (!talkback.parentID) talkback.parentID = null;

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

getYnet().then((data) => insertArticles(data));
getMako().then((data) => insertArticles(data));
getWalla().then((data) => insertArticles(data));
appendFileSync(
	path.join(__dirname, "scraper-log.log"),
	"scraper initialized - " + new Date().toISOString() + "\n"
);
