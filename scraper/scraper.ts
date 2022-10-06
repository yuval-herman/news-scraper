import Database from "better-sqlite3";
import { appendFileSync, readFileSync } from "fs";
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
		mainTopic,
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
    articleGUID,
	mainTopic
) VALUES (
    @hash,
    @writer,
    @title,
    @content,
    @createDate,
    @positive,
    @negative,
    @parentID,
    @articleGUID,
	@mainTopic
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

		let max: [number, string][] = getTopic(
			(talkback.title + " " + talkback.content).split(" ")
		);
		talkback.mainTopic = JSON.stringify(max.map((i) => i[1]));

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
let frequencyMap: Map<string, number>;
const insertArticles = db.transaction((articles: Article[]) => {
	frequencyMap = frequentWord(articles);
	for (const article of articles) {
		let max: [number, string][] = getTopic(
			(article.contentSnippet + " " + article.title).split(" ")
		);
		article.mainTopic = JSON.stringify(max.map((i) => i[1]));

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

function getTopic(words: string[]) {
	const itemFrequencyMap = Array.from(frequentWord(words).keys()).map(
		(word): [number, string] => [frequencyMap.get(word)!, word]
	);
	let max: [number, string][] = [[0, ""]];
	for (const pair of itemFrequencyMap) {
		if (max[0][0] < pair[0]) max = [pair];
		else if (max[0][0] === pair[0]) max.push(pair);
	}
	return max;
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

const ignoreWords = readFileSync("ignorewords.txt", {
	encoding: "utf-8",
}).split("\n");

function frequentWord(data: Article[] | string[]): Map<string, number> {
	const wordMap = new Map<string, number>();
	const secondTryWords = new Set<string>();
	for (const item of data) {
		if (typeof item === "string") {
			countWords([item]);
			continue;
		}
		countWords(item.title.split(" ").concat(item.contentSnippet.split(" ")));
		for (const talkback of item.talkbacks) {
			countWords(
				talkback.content
					.split(" ")
					.concat((talkback.title ?? "").split(" "))
			);
		}
	}
	countWords(secondTryWords);
	return wordMap;

	function countWords(
		words: string[] | Set<string>,
		secondTry: boolean = false
	) {
		for (let word of words) {
			//filter words
			if (!secondTry) {
				word = word.replace(/[^א-ת]/g, "");
				if (!word || word.length < 2) continue;
				if (ignoreWords.includes(word)) continue;
				if (["ה", "ל", "ב", "ו", "ש"].includes(word.slice(1))) {
					secondTryWords.add(word);
					continue;
				}
			} else {
				const temp = word.slice(1);
				if (wordMap.has(temp)) word = temp;
			}

			const currNum = wordMap.get(word) ?? 0;
			wordMap.set(word, currNum + 1);
		}
	}
}

appendFileSync(
	path.join(__dirname, "scraper-log.log"),
	"scraper initialized - " + new Date().toISOString() + "\n"
);
