import Database from "better-sqlite3";
import { appendFileSync } from "fs";
import hash from "object-hash";
import path from "path";
import { Article, DBTalkback, Talkback } from "../common/types";
import { frequentWords, hspellAnalyze } from "./hspell";
import { getInn } from "./news-providers/inn";
import { getIsraelHayom } from "./news-providers/israelHayom";
import { getMako } from "./news-providers/mako";
import { getNow14 } from "./news-providers/now14";
import { getWalla } from "./news-providers/walla";
import { getYnet } from "./news-providers/ynet";

// Log script started
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
		mainTopic,
		articleGUID,
		FOREIGN KEY(articleGUID) REFERENCES articles(guid)
)`
).run();

db.prepare(
	`CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY,
		word UNIQUE,
        amount INTEGER
)`
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
	mainTopic,
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
	@mainTopic,
    @articleGUID
)`);

/**
 * Adds topics to talkbacks and then inserts them into the DB.
 * @param talkbacks a talkback array
 */
const insertTalkbacks = async (talkbacks: DBTalkback[]) => {
	for (let i = 0; i < talkbacks.length; i++) {
		talkbacks[i].mainTopic = "[]";
	}
	db.transaction((talkbacks: DBTalkback[]) => {
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
	})(talkbacks);
};

/**
 * Insert one article into the DB.
 */
const insertArticle = db.prepare(`INSERT or REPLACE INTO articles (
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

/**
 * Adds topics to articles and inserts them to the DB.
 * @param articles articles to insert into the DB
 */
const insertArticles = async (articles: Article[]) => {
	for (let i = 0; i < articles.length; i++) {
		articles[i].mainTopic = "[]";
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

const getAllStatement = db.prepare(
	`
SELECT content, title from articles
UNION ALL
select content, title from talkbacks
`
);
const getAllContent: () => { content: string; title: string }[] =
	getAllStatement.all.bind(getAllStatement);

const insertWords = (words: Map<string, number>) => {
	const insert = db.prepare(`INSERT or replace INTO words (word, amount)
	VALUES (?, ?)`);
	db.transaction((words: Map<string, number>) => {
		for (const word of words) {
			insert.run(word);
		}
	})(words);
};

/**
 * Get an async functions array and run them in specified blocks.
 * Return after all functions have finished.
 * Does not handle errors.
 * @param fns async functions to run
 * @param concurrentNum number of functions to run asynchronously
 */
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

poolPromises(
	[getIsraelHayom, getInn, getMako, getWalla, getYnet, getNow14],
	4
).then(async (res) => {
	let error;
	try {
		await insertArticles(res.flat());
		console.log("calculating frequency");
		const frequencyMap = await frequentWords(
			getAllContent().map((item) => item.content + ". " + item.title + ". ")
		);
		insertWords(frequencyMap);
		console.log("calculating topics");
		console.time("topics");
		const articles: Article[] = db.prepare(`select * from articles`).all();
		const talkbacks: DBTalkback[] = db
			.prepare(`select * from talkbacks`)
			.all();
		computeTopic(articles);
		computeTopic(talkbacks);
		console.timeEnd("topics");
		function computeTopic(data: Article[] | DBTalkback[]) {
			const dataType = "articleGUID" in data[0] ? "talkbacks" : "articles";
			for (const item of data) {
				item.mainTopic = JSON.stringify([
					...new Set(hspellAnalyze(item.content + ". " + item.title)),
				]);
				if (dataType === "talkbacks") insertTalkback.run(item);
				else insertArticle.run(item);
			}
			// reset rowid
			db.prepare(
				`UPDATE ${dataType}
						SET id = (SELECT count(*)
						FROM ${dataType} AS T2
						WHERE T2.id <= ${dataType}.id);`
			).run();
		}
	} catch (error) {
		// Log errors in error file
		appendFileSync(
			path.join(__dirname, "scraper-log.log"),
			"ERROR - " + new Date().toISOString() + "\n"
		);
	} finally {
		// Log scraping finished
		let msg = "scraper initialized - " + new Date().toISOString() + "\n";
		if (error) {
			msg += "\nERROR START\n" + error + "\nERROR END\n";
		}
		appendFileSync(path.join(__dirname, "scraper-log.log"), msg);
	}
});

// Log scraping started without errors
appendFileSync(
	path.join(__dirname, "scraper-log.log"),
	"scraper initialized - " + new Date().toISOString() + "\n"
);
