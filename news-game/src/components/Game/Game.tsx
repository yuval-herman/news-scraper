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
	const STAGE_TIME = 15;
	const TOTAL_STAGES = 5;
	const rendered = useRef(false);
	const [talkbacks, setTalkbacks] = useState<DBTalkback[]>([]);
	const [article, setArticle] = useState<ArticleType>();
	const [showCorrect, setShowCorrect] = useState<boolean>(false);
	const [error, setError] = useState<Error>();
	const [retries, setRetries] = useState<number>(0);
	const [time, setTime] = useState<number>(STAGE_TIME);
	const [score, setScore] = useState<number>(0);
	const [stage, setStage] = useState<number>(-1);
	const [scoresTab, setScoresTab] = useState<
		{
			time: number;
			correct: boolean;
		}[]
	>([]);

	// A function to fetch new articles and talkbacks.
	const nextStage = useCallback(async () => {
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
			setTime(STAGE_TIME);
			setStage((prev) => prev + 1);
		} catch (errorObj) {
			setError(errorObj as Error);
		}
	}, []);
	useEffect(() => {
		if (rendered.current) return;
		rendered.current = true;
		nextStage();
	});
	const timeEnd = time <= 0;
	useEffect(() => {
		if (error || showCorrect || stage === TOTAL_STAGES) return;
		if (timeEnd) {
			setShowCorrect(false);
			setScoresTab((prev) => [...prev, { correct: false, time: 0 }]);
			nextStage();
		}
		const id = setInterval(() => setTime((prev) => prev - 0.1), 100);
		return () => clearInterval(id);
	}, [showCorrect, timeEnd]);

	if (error) {
		console.error(error);
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
				<div lang="en" dir="ltr" className={style["error-dump"]}>
					<h4 className={style.title}>ERROR DUMP</h4>
					<p>
						{JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
					</p>
				</div>
				<button
					className={style.button}
					onClick={() => {
						setError(undefined);
						nextStage();
						setRetries((prev) => prev + 1);
					}}
				>
					לנסות שוב?
				</button>
				<p className={style.retries}>{!retries || "retries " + retries}</p>
			</div>
		);
	}

	if (stage === TOTAL_STAGES) {
		let finalScore = 0;
		for (const item of scoresTab) {
			finalScore += (item.time / (STAGE_TIME - 1)) * Number(item.correct);
		}

		return (
			<div className={style["result-screen"]}>
				<h1 className={style.title}>נגמר!</h1>
				<h4 className={style["secondary-title"]}>הנה התוצאות:</h4>
				<ol>
					{scoresTab.map((item) => (
						<li>
							<p>
								{item.correct ? "צדקת!" : "טעות..."} לקח לך{" "}
								{(STAGE_TIME - item.time).toPrecision(2)} שניות להגיע
								לתשובה
							</p>
						</li>
					))}
				</ol>
				<h3>ניקודך הסופי הוא:</h3>
				<h2>
					{finalScore.toPrecision(2)}/{TOTAL_STAGES}
				</h2>
			</div>
		);
	}

	return (
		<div className={style.main}>
			<div className={style.hud}>
				<p className={style.counter}>זמן - {time.toPrecision(3)}</p>
				<p className={style.score}>
					ניקוד {score}/{TOTAL_STAGES}
				</p>
			</div>
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
						nextStage();
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
						onClick={() => {
							if (!article) return;
							setShowCorrect((prev) => !prev);
							let correct = false;
							if (item.articleGUID === article.guid) {
								correct = true;
								setScore((prev) => prev + 1);
							}
							setScoresTab((prev) => [
								...prev,
								{ correct: correct, time: time },
							]);
						}}
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
