import express from "express";
import { getRandomNumbers, sampleRandom } from "../common/helpers";
import { Article, DBTalkback } from "../common/types";
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
	const amount = Number(req.query.amount) || 1;
	const topics: string[] = JSON.parse(req.query.topics?.toString() ?? "[]");
	const exceptArticle = req.query.except;

	const talkbacks = Array<DBTalkback | undefined>(amount);

	let selection: DBTalkback[] | undefined;
	let guidArr: string[] | undefined;
	if (topics.length) {
		selection = getTalkbacksByTopic(topics);
	} else {
		guidArr = getArticlesGuidRandomOrder();
	}

	for (
		let i = 0;
		i < talkbacks.length && (selection?.length || guidArr?.length);
		i++
	) {
		const insert = () => {
			if (selection && selection.length) {
				talkbacks[i] = selection.pop();
			} else
				talkbacks[i] = sampleRandom(
					getTalkbacksByArticleGuid(guidArr!.pop()!)
				)[0];
		};
		while (
			!talkbacks[i] ||
			talkbacks[i]?.articleGUID === exceptArticle ||
			talkbacks
				.slice(0, i)
				.some((t) => t?.articleGUID === talkbacks[i]?.articleGUID)
		) {
			insert();
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
	const hasTalkbacks = req.query.hasTalkbacks === "true";

	const articles = Array<Article>(amount);
	let counter = 0;
	for (let i = 0; i < amount; i++) {
		counter = 0;
		do {
			const rnd = getRandomNumbers(articlesMaxRowid(), 1)[0];

			articles[i] = getArticleByRowid(rnd);
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
