import path from "path";
import Database from "better-sqlite3";
import { Article, DBTalkback, Score, TopScores } from "../common/types";
import { GameMode } from "../common/globals";

// Db path changes after compilation, thus check if deployed to use new path
const isDeployed = Boolean(process.env.NEWS_SCRAPER_DEPLOYED);
const dbPath = isDeployed
	? path.join(__dirname, "../../scraper/db.db")
	: path.join(__dirname, "../../../scraper/dist/db.db");

const db = new Database(dbPath);

db.prepare(
	`CREATE TABLE IF NOT EXISTS scores (
		score,
		name,
		difficulty,
		UNIQUE(name,difficulty)
	)`
).run();

/**
 * Get article by it's guid.
 * @param guid article guid
 */
export const getArticleByGuid = (guid: string): Article =>
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
				 where mainTopic != '[]'
				 and length(content) < 200 and length(title) < 200`
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
 * Get a article by it's id in the db.
 * @param id sqlite id
 */
export const getArticleById = (id: number | bigint): Article =>
	db.prepare("SELECT * FROM articles WHERE id = ?").get(id);

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
 * Get articles biggest id.
 */
export const articlesMaxId = (): number | bigint =>
	db.prepare("SELECT max(id) FROM articles").get()["max(id)"];

/**
 * Get talkback by it's id.
 * @param id talkback id
 */
export const getTalkbackById = (id: string): DBTalkback =>
	db.prepare("SELECT * FROM talkbacks WHERE id = ?").get(id);

/**
 * Get talkbacks biggest id.
 */
export const talkbacksMaxId = (): number | bigint =>
	db.prepare("SELECT max(id) FROM talkbacks").get()["max(id)"];

export const articleHasTalkbacks = (id: string): 0 | 1 =>
	db
		.prepare("SELECT EXISTS(SELECT NULL FROM talkbacks WHERE articleGUID=?)")
		.pluck()
		.get(id);

export const getTopScores = (): TopScores => {
	const scores: Score[] = db
		.prepare("select * from scores ORDER by score DESC")
		.all();
	const scoresByMode: TopScores = { מהיר: [], רגיל: [] };
	for (const score of scores) {
		scoresByMode[score.gameMode].push(score);
	}
	return scoresByMode;
};
export const getScoreByName = (name: string): Score[] =>
	db.prepare("SELECT * FROM scores WHERE name = ?").get(name);

export const insertScore = (score: Score) =>
	db
		.prepare(
			`INSERT INTO scores (
				score,
				name,
				difficulty
				) VALUES (
				@score,
				@name,
				@difficulty
				)`
		)
		.all(score);

export const updateScore = (score: Score) =>
	db
		.prepare(
			`UPDATE scores SET 
				score = @score,
				difficulty = @difficulty
				where name = @name`
		)
		.run(score);
