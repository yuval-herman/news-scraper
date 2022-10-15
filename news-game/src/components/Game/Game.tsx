import { useCallback, useEffect, useRef, useState } from "react";
import { Article as ArticleType } from "../../../../common/types";
import { DBTalkback } from "../../../../common/types";
import Article from "../Article/Article";
import Talkback from "../Talkback/Talkback";
import style from "./Game.module.scss";

async function jsonFetch(input: RequestInfo | URL, init?: RequestInit) {
	return (await fetch(input, init)).json();
}

function Game() {
	const rendered = useRef(false);
	const [talkbacks, setTalkbacks] = useState<DBTalkback[]>([]);
	const [article, setArticle] = useState<ArticleType>();
	const [showCorrect, setShowCorrect] = useState<boolean>(false);
	const [error, setError] = useState<Error>();

	const fetchData = useCallback(async () => {
		try {
			let article = (await jsonFetch("/random/article"))[0];
			let resTalkbacks: DBTalkback[] = await jsonFetch(
				"/random/talkback?amount=3&topics=" + article.mainTopic
			);
			let correctTalkback: DBTalkback | undefined = (
				await jsonFetch("/random/talkback/" + article.guid)
			)[0];
			while (!correctTalkback) {
				article = (await jsonFetch("/random/article"))[0];
				resTalkbacks = await jsonFetch(
					"/random/talkback?amount=3&topics=" + article.mainTopic
				);
				correctTalkback = (
					await jsonFetch("/random/talkback/" + article.guid)
				)[0];
			}
			resTalkbacks.push(correctTalkback);
			const randIndex = Math.floor(Math.random() * resTalkbacks.length);
			[resTalkbacks[3], resTalkbacks[randIndex]] = [
				resTalkbacks[randIndex],
				resTalkbacks[3],
			]; //randomize correct answer location

			setArticle(article);
			setTalkbacks(resTalkbacks);
		} catch (errorObj) {
			setError(errorObj as Error);
		}
	}, []);
	useEffect(() => {
		if (rendered.current) return;
		rendered.current = true;
		fetchData();
	});

	console.log(talkbacks);

	if (error) {
		return (
			<div className={style.error}>
				<p>קרתה תקלה (×_×;)...</p>
				<p>
					נסו לרענן את העמוד, אם התקלה נשארת, תרגישו חופשי לפתוח issue בדף
					הגיטהאב של האפליקציה!
				</p>
				<p>
					<a href="https://github.com/yuval-herman/news-scraper">
						https://github.com/yuval-herman/news-scraper
					</a>
				</p>
			</div>
		);
	}

	return (
		<div className={style.main}>
			<div className={style["article-div"]}>
				{article ? (
					<Article className={style.article} article={article} />
				) : (
					<p className={style.waiter}>מוריד מאמר...</p>
				)}

				<button
					className={style["next-button"]}
					style={{ opacity: showCorrect ? 1 : 0 }}
					onClick={() => {
						fetchData();
						setShowCorrect(false);
					}}
					disabled={!showCorrect}
				>
					הבא!
				</button>
			</div>
			<div className={style.talkbacks}>
				{talkbacks.map((item) => (
					<Talkback
						onClick={() => setShowCorrect((prev) => !prev)}
						key={item.hash}
						talkback={item}
						isCorrect={article && item.articleGUID === article.guid}
						showCorrect={showCorrect}
					/>
				))}
			</div>
		</div>
	);
}

export default Game;
