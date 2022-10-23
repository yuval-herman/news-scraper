import express from "express";
import { getRandomNumbers, sampleRandom } from "../common/helpers";
import { Article } from "../common/types";
import {
	articleHasTalkbacks,
	articlesMaxRowid,
	getArticleById,
	getArticleByRowid,
	getArticlesGuidRandomOrder,
	getTalkbacksByArticleGuid,
	getTalkbacksByTopic,
} from "./db";

const app = express();
const port = 4000;

/**
 * Get amount and topics and return an array of talkbacks related to topics with `amount` length.
 * If there are not enough talkbacks related to `topics` to satisfy `amount` random talkbacks are added.
 */
app.get("/random/talkback/", (req, res) => {
	//TODO, FIXME: there is a rare bug when the same talkback can return twice
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

/**
 * Get amount and guid and return random talkbacks from the requested article.
 */
app.get("/random/talkback/:guid", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const talkbacks = getTalkbacksByArticleGuid(req.params.guid);
	res.json(sampleRandom(talkbacks, amount));
});

/**
 * Get amount and return a random article array.
 * If hasTalkbacks is specified, only return articles with talkbacks.
 */
app.get("/random/article/", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const hasTalkbacks = req.query.hasTalkbacks;
	const articles = Array<Article>(amount);
	let counter = 0;
	for (let i = 0; i < amount; i++) {
		counter = 0;
		do {
			articles[i] = getArticleByRowid(
				getRandomNumbers(articlesMaxRowid(), 1)[0]
			);
			counter += 1;
		} while (
			hasTalkbacks &&
			!articleHasTalkbacks(articles[i].guid) &&
			counter < 10
		);
	}
	if (counter > 9) {
		res.sendStatus(500);
	}
	res.json(articles);
});

/**
 * Get id and return requested article
 */
app.get("/article/:id", (req, res) => {
	const article = getArticleById(req.params.id);
	if (!article) res.status(404).send("article not found");
	else res.json(article);
});

app.listen(port, () => {
	console.log(`listening on port ${port}`);
});
