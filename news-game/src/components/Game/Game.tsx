import { useEffect, useRef, useState } from "react";
import {
	Article as ArticleType,
	DBTalkback,
	Score,
} from "../../../../common/types";
import { GameMode } from "../../globals";
import { jsonFetch } from "../../helpers";
import Article from "../Article/Article";
import Talkback from "../Talkback/Talkback";
import style from "./Game.module.scss";

export interface StageData {
	article: ArticleType;
	talkbacks: DBTalkback[];
	time?: number;
	correct?: boolean;
}

export interface GameProps {
	gameMode: GameMode;
	showGlobalScore: (stagesData: Score) => void;
}

function Game(props: GameProps) {
	const STAGE_TIME = props.gameMode === GameMode.normal ? 60 : 10;
	const TOTAL_STAGES = props.gameMode === GameMode.normal ? 10 : 5;
	const rendered = useRef(false);
	const timeIndicator = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<Error>();
	const [showCorrect, setShowCorrect] = useState<boolean>(false);
	const [time, setTime] = useState<number>(STAGE_TIME);
	const [stage, setStage] = useState<number>(0);
	const [stagesData, setStagesData] = useState<StageData[]>([]);

	const needMoreArticles =
		stage >= TOTAL_STAGES - 5 && props.gameMode === GameMode.normal;

	// Called on first render. Fetches all the data for the game
	useEffect(() => {
		if (rendered.current && needMoreArticles === false) return;
		rendered.current = true;
		window.history.pushState(undefined, "");
		(async () => {
			const data: { article: ArticleType; talkbacks: DBTalkback[] }[] = [];
			for (let i = 0; i < TOTAL_STAGES; i++) {
				let resArticle: ArticleType = (
					await jsonFetch("/random/article?hasTalkbacks=true")
				)[0];
				const topics = JSON.parse(resArticle.mainTopic ?? "[]").slice(
					0,
					250
				);
				let resTalkbacks: DBTalkback[] = await jsonFetch(
					`/random/talkback?amount=3&topics=${JSON.stringify(
						topics
					)}&except=${resArticle.guid}`
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
			console.log("fetched");
			setStagesData((prev) => [...prev, ...data]);
		})().catch((errorObj: Error) => setError(errorObj));
	}, [needMoreArticles, TOTAL_STAGES]);

	// Main game loop.
	const timeOut = time <= 0;
	useEffect(() => {
		// Here, returning is practically pausing as it stops the clock.
		if (
			error ||
			showCorrect ||
			stage === stagesData.length ||
			!stagesData.length ||
			(stage === (stagesData.length || TOTAL_STAGES) && !needMoreArticles)
		)
			return;
		// Player ran out of time to answer
		if (timeOut) {
			setShowCorrect(false);
			setStagesData((prev) => {
				prev[stage].correct = false;
				prev[stage].time = 0;
				return prev;
			});
			setStage((prev) => prev + 1);
		}
		if (props.gameMode === GameMode.fast) {
			setTime(STAGE_TIME);
		}
		const id = setInterval(() => {
			setTime((prev) => {
				if (timeIndicator.current)
					timeIndicator.current.style.width =
						(prev / STAGE_TIME) * 100 + "%";
				return prev - 0.1;
			});
		}, 100);
		return () => clearInterval(id);
	}, [
		showCorrect,
		timeOut,
		error,
		stage,
		stagesData,
		STAGE_TIME,
		TOTAL_STAGES,
		needMoreArticles,
		props.gameMode,
	]);

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
	if (stage === (stagesData.length || TOTAL_STAGES) && !needMoreArticles) {
		let finalScore = 0;

		// Calculate score
		for (const item of stagesData) {
			finalScore +=
				((item.time ?? 0 + (STAGE_TIME - (item.time ?? 0)) / 1.5) /
					STAGE_TIME) *
				Number(item.correct);
		}

		return (
			<div className={style["result-screen"]}>
				<h1 className={style.title}>נגמר!</h1>
				<h4 className={style["secondary-title"]}>הנה התוצאות:</h4>
				<ol className={style.list}>
					{stagesData.map((item, i) => (
						<li key={i}>
							{STAGE_TIME - (item.time ?? 0) === STAGE_TIME ? (
								<p>לא הספקת לענות...</p>
							) : (
								<p>
									{item.correct ? "צדקת!" : "טעות..."} לקח לך{" "}
									{(STAGE_TIME - (item.time ?? 0)).toPrecision(2)}{" "}
									שניות להגיע לתשובה
								</p>
							)}
						</li>
					))}
				</ol>
				<h3>ניקודך הסופי הוא:</h3>
				<h2>
					{finalScore.toPrecision(2)}/{TOTAL_STAGES}
				</h2>
				<h3>במצב {props.gameMode}</h3>
				<button
					className={style.button}
					onClick={() =>
						props.showGlobalScore({
							score: finalScore,
							name: "",
							gameMode: props.gameMode,
						})
					}
				>
					ניתן ללחוץ כאן כדי לשלוח את התוצאות לשרת ולראות את הדירוג הכללי
					שלך
				</button>
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
					{stagesData.reduce(
						(prev, curr) => prev + (Number(curr.correct) || 0),
						0
					)}
					/{TOTAL_STAGES}
				</p>
			</div>
			<div className={style["article-div"]}>
				{article ? (
					<Article className={style.article} article={article} />
				) : (
					<p className={style.waiter}>מוריד מאמרים...</p>
				)}

				{props.gameMode === GameMode.fast ? (
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
				) : undefined}
			</div>
			<div className={style.talkbacks}>
				{talkbacks?.map((item: DBTalkback | undefined) => {
					if (!item) {
						return <div>this is an error</div>;
					}
					return (
						<Talkback
							onClick={() => {
								if (!article) return;
								setShowCorrect((prev) => !prev);
								setStagesData((prev) => {
									prev[stage].correct =
										item.articleGUID === article.guid;
									prev[stage].time = time;
									return prev;
								});

								if (props.gameMode === GameMode.normal) {
									setStage((prev) => prev + 1);
									setShowCorrect(false);
								}
							}}
							key={item.hash}
							talkback={item}
							isCorrect={article && item.articleGUID === article.guid}
							showCorrect={showCorrect}
						/>
					);
				})}
			</div>
		</div>
	);
}

export default Game;
