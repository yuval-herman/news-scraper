import express from "express";
import path from "path";
import Database from "better-sqlite3";

const isDeployed = Boolean(process.env.NEWS_SCRAPER_DEPLOYED);
const dbPath = isDeployed
	? path.join(__dirname, "../scraper/db.db")
	: path.join(__dirname, "../../scraper/dist/db.db");

const db = new Database(dbPath);
const getArticleById = (id: string) =>
	db.prepare("SELECT * FROM articles WHERE guid = ?").get(id);
const getTalkbacksByArticleGuid = (guid: string) =>
	db
		.prepare(
			`SELECT * FROM talkbacks
			WHERE articleGUID = ? and parentID is NULL;`
		)
		.all(guid);
const getArticleByRowid = (id: string) =>
	db.prepare("SELECT * FROM articles WHERE rowid = ?").get(id);
const getArticlesGuidRandomOrder = (): string[] =>
	db
		.prepare("select DISTINCT articleGUID from talkbacks ORDER by random()")
		.pluck()
		.all();
const articlesMaxRowid = () =>
	db.prepare("SELECT max(rowid) FROM articles").get()["max(rowid)"];
const getTalkbackByRowid = (id: string) =>
	db.prepare("SELECT * FROM talkbacks WHERE rowid = ?").get(id);
const talkbacksMaxRowid = () =>
	db.prepare("SELECT max(rowid) FROM talkbacks").get()["max(rowid)"];

function getRandomNumbers(max: number, amount: number) {
	const numArr = Array(amount);
	for (let i = 0; i < amount; i++) {
		numArr[i] = Math.floor(Math.random() * max) + 1;
	}
	return numArr;
}

function sampleRandom<T>(arr: T[], amount: number = 1) {
	if (amount < 0) amount = 1;
	const resArr: T[] = Array(Math.min(amount, arr.length));
	for (let i = 0; i < amount && arr.length; i++) {
		const randIndex = Math.floor(Math.random() * arr.length);
		resArr[i] = arr.splice(randIndex, 1)[0];
	}
	return resArr;
}

const app = express();
const port = 4000;

const STATIC_PATH = path.join(__dirname, "../news-game");
app.use(express.static(STATIC_PATH));

app.get("/random/talkback/", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const talkbacks = Array(amount);
	const guidArr = getArticlesGuidRandomOrder();

	for (let i = 0; i < talkbacks.length && guidArr.length; i++)
		talkbacks[i] = sampleRandom(getTalkbacksByArticleGuid(guidArr.pop()!))[0];
	res.json(talkbacks);
});

app.get("/random/talkback/:guid", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const talkbacks = getTalkbacksByArticleGuid(req.params.guid);
	res.json(sampleRandom(talkbacks, amount));
});

app.get("/random/article/", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const rowidArr = getRandomNumbers(articlesMaxRowid(), amount);

	const articles = Array(amount);
	for (let i = 0; i < rowidArr.length; i++) {
		articles[i] = getArticleByRowid(rowidArr[i]);
	}
	res.json(articles);
});

app.get("/article/:id", (req, res) => {
	const article = getArticleById(req.params.id);
	if (!article) res.status(404).send("article not found");
	else res.json(article);
});

app.get("*", (_, res) => res.sendFile(path.join(STATIC_PATH, "index.html")));

app.listen(port, () => {
	console.log(`listening on port ${port}`);
});
