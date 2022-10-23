import { useEffect, useRef, useState } from "react";
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
	const STAGE_TIME = 1;
	const TOTAL_STAGES = 5;
	const rendered = useRef(false);
	const timeIndicator = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<Error>();
	const [showCorrect, setShowCorrect] = useState<boolean>(false);
	const [time, setTime] = useState<number>(STAGE_TIME);
	const [stage, setStage] = useState<number>(0);
	const [stagesData, setStagesData] = useState<
		{ article: ArticleType; talkbacks: DBTalkback[] }[]
	>([]);
	const [scoresTab, setScoresTab] = useState<
		{
			time: number;
			correct: boolean;
		}[]
	>([]);

	// Called on first render. Fetches all the data for the game
	useEffect(() => {
		if (rendered.current) return;
		rendered.current = true;
		(async () => {
			const data: { article: ArticleType; talkbacks: DBTalkback[] }[] = [];
			for (let i = 0; i < TOTAL_STAGES; i++) {
				let resArticle: ArticleType = (
					await jsonFetch("/random/article?hasTalkbacks=true")
				)[0];
				let resTalkbacks: DBTalkback[] = await jsonFetch(
					"/random/talkback?amount=3&topics=" + resArticle.mainTopic
				);
				let correctTalkback: DBTalkback = (
					await jsonFetch("/random/talkback/" + resArticle.guid)
				)[0];
				resTalkbacks.push(correctTalkback);

				//randomize correct answer location
				const randIndex = Math.floor(Math.random() * resTalkbacks.length);
				[resTalkbacks[3], resTalkbacks[randIndex]] = [
					resTalkbacks[randIndex],
					resTalkbacks[3],
				];
				data.push({ article: resArticle, talkbacks: resTalkbacks });
			}
			setStagesData(data);
		})().catch((errorObj: Error) => setError(errorObj));
	});

	// Main game loop.
	const timeOut = time <= 0;
	useEffect(() => {
		// Here, returning is practically pausing as it stops the clock.
		if (error || showCorrect || stage === TOTAL_STAGES || !stagesData.length)
			return;
		// Player ran out of time to answer
		if (timeOut) {
			setShowCorrect(false);
			setScoresTab((prev) => [...prev, { correct: false, time: 0 }]);
			setStage((prev) => prev + 1);
		}
		setTime(STAGE_TIME);
		const id = setInterval(() => {
			setTime((prev) => {
				if (timeIndicator.current)
					timeIndicator.current.style.width =
						(prev / STAGE_TIME) * 100 + "%";
				return prev - 0.1;
			});
		}, 100);
		return () => clearInterval(id);
	}, [showCorrect, timeOut, error, stage, stagesData]);

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
			</div>
		);
	}

	// Game is done.
	if (stage === TOTAL_STAGES) {
		let finalScore = 0;

		// Calculate score
		for (const item of scoresTab) {
			finalScore +=
				((item.time + (STAGE_TIME - item.time) / 1.5) / STAGE_TIME) *
				Number(item.correct);
		}

		return (
			<div className={style["result-screen"]}>
				<h1 className={style.title}>נגמר!</h1>
				<h4 className={style["secondary-title"]}>הנה התוצאות:</h4>
				<ol>
					{scoresTab.map((item, i) => (
						<li key={i}>
							{STAGE_TIME - item.time === STAGE_TIME ? (
								<p>לא הספקת לענות...</p>
							) : (
								<p>
									{item.correct ? "צדקת!" : "טעות..."} לקח לך{" "}
									{(STAGE_TIME - item.time).toPrecision(2)} שניות להגיע
									לתשובה
								</p>
							)}
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

	const article: ArticleType | undefined = stagesData[stage]?.article;
	const talkbacks: DBTalkback[] | undefined = stagesData[stage]?.talkbacks;
	return (
		<div className={style.main}>
			<div className={style.hud}>
				<div className={style["time-indicator"]} ref={timeIndicator}></div>
				<p className={style.counter}>זמן - {time.toPrecision(3)}</p>
				<p className={style.score}>
					ניקוד{" "}
					{scoresTab.reduce(
						(prev, curr) => prev + Number(curr.correct),
						0
					)}
					/{TOTAL_STAGES}
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
						setStage((prev) => prev + 1);
						setShowCorrect(false);
					}}
					disabled={!showCorrect}
				>
					הבא!
				</button>
			</div>
			<div className={style.talkbacks}>
				{talkbacks?.map((item) => (
					<Talkback
						onClick={() => {
							if (!article) return;
							setShowCorrect((prev) => !prev);
							setScoresTab((prev) => [
								...prev,
								{
									correct: item.articleGUID === article.guid,
									time: time,
								},
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
