import path from "path";
import Database from "better-sqlite3";
import { Article, DBTalkback } from "../common/types";

// Db path changes after compilation, thus check if deployed to use new path
const isDeployed = Boolean(process.env.NEWS_SCRAPER_DEPLOYED);
const dbPath = isDeployed
	? path.join(__dirname, "../../scraper/db.db")
	: path.join(__dirname, "../../../scraper/dist/db.db");

const db = new Database(dbPath);

/**
 * Get article by it's guid.
 * @param guid article guid
 */
export const getArticleById = (guid: string): Article =>
	db.prepare("SELECT * FROM articles WHERE guid = ?").get(guid);

/**
 * Get all talkbacks on an article by the article guid.
 * @param guid article guid
 */
export const getTalkbacksByArticleGuid = (guid: string): DBTalkback[] =>
	db
		.prepare(
			`SELECT * FROM talkbacks
			WHERE articleGUID = ? and parentID is NULL;`
			// Don't return talkbacks with parentID so that we won't
			// get unclear text (a reply to another talkback)
		)
		.all(guid);

/**
 * Get all talkbacks related to topic array shuffled randomly.
 * @param reqTopics an array of topics to search for
 */
export const getTalkbacksByTopic = (reqTopics: string[]): DBTalkback[] => {
	const rankingWords = new Map<string, number>(
		db
			.prepare(
				`select word, amount from words WHERE amount > 5 AND word IN (${reqTopics
					.map(() => "?")
					.join(",")})`
			)
			.raw()
			.all(reqTopics)
	);

	const data = (
		db
			.prepare(
				`SELECT * from talkbacks
		     where mainTopic != '[]'`
			)
			.all() as DBTalkback[]
	)
		.map((i) => {
			const mainTopic = Array.isArray(i.mainTopic)
				? i.mainTopic
				: (JSON.parse(i.mainTopic) as string[]);
			return {
				...i,
				mainTopic: mainTopic,
				score: calcWordsScore(mainTopic),
			};
		})
		.sort((a, b) => {
			return a.score - b.score;
		});

	function calcWordsScore(words: string[]): number {
		const score: number[] = [];
		let size = 0;
		for (const curr of words) {
			const num = 1 / (rankingWords.get(curr) ?? Infinity);
			score.push(num);
			if (num) size++;
		}
		return score.reduce((p, c) => (p + c) * (size / 9));
	}

	return data;
};

/**
 * Get a article by it's rowid in the db.
 * @param id sqlite rowid
 */
export const getArticleByRowid = (id: number | bigint): Article =>
	db.prepare("SELECT * FROM articles WHERE rowid = ?").get(id);

/**
 * Get all articles guid's in random order.
 */
export const getArticlesGuidRandomOrder = (): string[] => {
	return db
		.prepare(`SELECT guid from articles ORDER by random()`)
		.pluck()
		.all();
};

/**
 * Get articles biggest rowid.
 */
export const articlesMaxRowid = (): number | bigint =>
	db.prepare("SELECT max(rowid) FROM articles").get()["max(rowid)"];

/**
 * Get talkback by it's rowid.
 * @param id talkback rowid
 */
export const getTalkbackByRowid = (id: string): DBTalkback =>
	db.prepare("SELECT * FROM talkbacks WHERE rowid = ?").get(id);

/**
 * Get talkbacks biggest rowid.
 */
export const talkbacksMaxRowid = (): number | bigint =>
	db.prepare("SELECT max(rowid) FROM talkbacks").get()["max(rowid)"];

export const articleHasTalkbacks = (id: string): 0 | 1 =>
	db
		.prepare("SELECT EXISTS(SELECT NULL FROM talkbacks WHERE articleGUID=?)")
		.pluck()
		.get(id);
