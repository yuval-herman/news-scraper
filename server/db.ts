import path from "path";
import Database from "better-sqlite3";

const isDeployed = Boolean(process.env.NEWS_SCRAPER_DEPLOYED);
const dbPath = isDeployed
	? path.join(__dirname, "../scraper/db.db")
	: path.join(__dirname, "../../scraper/dist/db.db");

const db = new Database(dbPath);
export const getArticleById = (id: string) =>
	db.prepare("SELECT * FROM articles WHERE guid = ?").get(id);
export const getTalkbacksByArticleGuid = (guid: string) =>
	db
		.prepare(
			`SELECT * FROM talkbacks
			WHERE articleGUID = ? and parentID is NULL;`
		)
		.all(guid);

export const getTalkbacksByTopic = (topics: string[]) => {
	const data: { mainTopic: string }[] = db
		.prepare(
			`SELECT * from talkbacks
		where mainTopic != '[]' ORDER by random()`
		)
		.all();
	return data.filter((item) =>
		(JSON.parse(item.mainTopic) as string[]).some((item) =>
			topics.includes(item)
		)
	);
};

export const getArticleByRowid = (id: string) =>
	db.prepare("SELECT * FROM articles WHERE rowid = ?").get(id);
export const getArticlesGuidRandomOrder = (): string[] => {
	return db
		.prepare(`SELECT guid from articles ORDER by random()`)
		.pluck()
		.all();
};
export const articlesMaxRowid = () =>
	db.prepare("SELECT max(rowid) FROM articles").get()["max(rowid)"];
export const getTalkbackByRowid = (id: string) =>
	db.prepare("SELECT * FROM talkbacks WHERE rowid = ?").get(id);
export const talkbacksMaxRowid = () =>
	db.prepare("SELECT max(rowid) FROM talkbacks").get()["max(rowid)"];
