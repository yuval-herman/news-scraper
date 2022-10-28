import express from "express";
import { getRandomNumbers, sampleRandom } from "../common/helpers";
import { Article, DBTalkback, Score } from "../common/types";
import {
	articleHasTalkbacks,
	articlesMaxId,
	getArticleByGuid,
	getArticleById,
	getArticlesGuidRandomOrder,
	getScoreByName,
	getTalkbacksByArticleGuid,
	getTalkbacksByTopic,
	getTopScores,
	insertScore,
	updateScore,
} from "./db";

const app = express();
const port = 4000;
app.use(express.json());

/**
 * Get amount and topics and return an array of talkbacks related to topics with `amount` length.
 * If there are not enough talkbacks related to `topics` to satisfy `amount` random talkbacks are added.
 */
app.get("/random/talkback/", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const topics: string[] = JSON.parse(req.query.topics?.toString() ?? "[]");
	const exceptArticle = req.query.except;

	const talkbacks = Array<DBTalkback | undefined>(amount);

	const selection = getTalkbacksByTopic(topics);
	const guidArr = getArticlesGuidRandomOrder();
	for (
		let i = 0;
		i < talkbacks.length && (selection.length || guidArr.length);
		i++
	) {
		const insert = () => {
			if (selection.length) {
				talkbacks[i] = selection.pop();
			} else if (guidArr.length)
				talkbacks[i] = sampleRandom(
					getTalkbacksByArticleGuid(guidArr.pop()!)
				)[0];
			else {
				return null;
			}
		};
		while (
			!talkbacks[i] ||
			talkbacks[i]?.articleGUID === exceptArticle ||
			talkbacks
				.slice(0, i)
				.some((t) => t?.articleGUID === talkbacks[i]?.articleGUID)
		) {
			if (insert() === null) {
				res.status(500);
				return;
			}
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
	let talkback: DBTalkback[] | undefined;
	for (let i = 0; i < 10; i++) {
		talkback = sampleRandom(talkbacks, amount);
		if (talkback.some((t) => t.content.length < 100)) break;
	}
	res.json(talkback);
});

/**
 * Get amount and return a random article array.
 * If hasTalkbacks is specified, only return articles with talkbacks.
 */
app.get("/random/article/", (req, res) => {
	const amount = Number(req.query.amount) || 1;
	const hasTalkbacks = req.query.hasTalkbacks === "true";

	const articles = Array<Article>(amount);
	let counter = 0;
	for (let i = 0; i < amount; i++) {
		counter = 0;
		do {
			const rnd = getRandomNumbers(articlesMaxId(), 1)[0];

			articles[i] = getArticleById(rnd);
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
	const article = getArticleByGuid(req.params.id);
	if (!article) res.status(404).send("article not found");
	else res.json(article);
});

app.post("/score", (req, res) => {
	const score: Score = req.body;
	try {
		insertScore(score);
	} catch (error: any) {
		if (error.message.slice(0, 24) !== "UNIQUE constraint failed") {
			res.json(error);
			return;
		}
		const oldScore = getScoreByName(score.name);

		if (
			oldScore.score < score.score &&
			oldScore.difficulty <= score.difficulty
		)
			updateScore(score);
	}
	res.json(getTopScores());
});

app.listen(port, () => {
	console.log(`listening on port ${port}`);
});
