import { useCallback, useEffect, useRef, useState } from "react";
import { Article as ArticleType, DBTalkback } from "../../../../common/types";
import Article from "../Article/Article";
import Talkback from "../Talkback/Talkback";
import style from "./Game.module.scss";

/**
 * An alias to (await fetch(input, init)).json()
 * @param input url to fetch
 * @param init fetch options
 */
async function jsonFetch(input: RequestInfo | URL, init?: RequestInit) {
	return (await fetch(input, init)).json();
}

function Game() {
	const rendered = useRef(false);
	const [talkbacks, setTalkbacks] = useState<DBTalkback[]>([]);
	const [article, setArticle] = useState<ArticleType>();
	const [showCorrect, setShowCorrect] = useState<boolean>(false);
	const [error, setError] = useState<Error>();

	// A function to fetch new articles and talkbacks.
	const fetchData = useCallback(async () => {
		try {
			let article = (
				await jsonFetch("/random/article?hasTalkbacks=true")
			)[0];
			let resTalkbacks: DBTalkback[] = await jsonFetch(
				"/random/talkback?amount=3&topics=" + article.mainTopic
			);
			let correctTalkback: DBTalkback = (
				await jsonFetch("/random/talkback/" + article.guid)
			)[0];
			resTalkbacks.push(correctTalkback);

			//randomize correct answer location
			const randIndex = Math.floor(Math.random() * resTalkbacks.length);
			[resTalkbacks[3], resTalkbacks[randIndex]] = [
				resTalkbacks[randIndex],
				resTalkbacks[3],
			];

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
