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

const app = express();
const port = 4000;

const STATIC_PATH = path.join(__dirname, "../news-game");
app.use(express.static(STATIC_PATH));

app.get("/random/talkback/", (req, res) => {
	const amount = req.query.amount || 1;
	const talkbacks = db
		.prepare(
			"SELECT * FROM talkbacks WHERE parentID is NULL ORDER BY RANDOM() LIMIT " +
				amount
		)
		.all();
	res.json(talkbacks);
});

app.get("/random/article/", (req, res) => {
	const amount = req.query.amount || 1;
	const article = db
		.prepare("SELECT * FROM articles ORDER BY RANDOM() LIMIT " + amount)
		.all();
	res.json(article);
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
