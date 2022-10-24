import Database from "better-sqlite3";
import { appendFileSync, writeFileSync } from "fs";
import hash from "object-hash";
import path from "path";
import { Article, DBTalkback, Talkback } from "../common/types";
import { frequentWords } from "./hspell";
import { getInn } from "./news-providers/inn";
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

// This trigger runs on talkback delete and
// moves the last talkback in place of the one deleted.
// This is done to remove holes in the sqlite rowid sequence.
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

/**
 * Adds topics to articles and inserts them to the DB.
 * @param articles articles to insert into the DB
 */
const insertArticles = async (articles: Article[]) => {
	console.log("calculating frequency");

	const frequencyMap = await frequentWords(
		articles.map(
			(article) =>
				article.content +
				". " +
				article.talkbacks
					.map((talkback) => talkback.title || talkback.content)
					.join(". ") +
				". "
		)
	);

	console.log("writing to file");

	writeFileSync(
		"temp.txt",
		JSON.stringify(
			[...frequencyMap].sort((a, b) => b[1] - a[1]),
			null,
			3
		)
	);
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

poolPromises([getInn, getMako, getWalla, getYnet, getNow14], 4).then((res) => {
	let error;
	try {
		insertArticles(res.flat());
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
