import express from "express";
import path from "path";
import {
	getArticlesGuidRandomOrder,
	getTalkbacksByTopic,
	getTalkbacksByArticleGuid,
	articlesMaxRowid,
	getArticleByRowid,
	getArticleById,
} from "./db";
import { getRandomNumbers, sampleRandom } from "../common/helpers";

const app = express();
const port = 4000;

const STATIC_PATH = path.join(__dirname, "../../news-game");
app.use(express.static(STATIC_PATH));

app.get("/random/talkback/", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const topics: string[] = JSON.parse(req.query.topics?.toString() ?? "[]");

	const talkbacks = Array(amount);
	let guidArr = getArticlesGuidRandomOrder();
	let selection;
	if (topics.length) {
		selection = getTalkbacksByTopic(topics);
	}

	for (let i = 0; i < talkbacks.length && guidArr.length; i++) {
		talkbacks[i] = sampleRandom(
			selection || getTalkbacksByArticleGuid(guidArr.pop()!)
		)[0];
		while (!talkbacks[i]) {
			talkbacks[i] = sampleRandom(
				getTalkbacksByArticleGuid(guidArr.pop()!)
			)[0];
		}
	}
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
