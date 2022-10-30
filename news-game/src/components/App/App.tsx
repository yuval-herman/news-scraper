import React, { useEffect, useRef, useState } from "react";
import { Score } from "../../../../common/types";
import newspaper1 from "../../assets/newspaper1.svg";
import newspaper2 from "../../assets/newspaper2.svg";
import newspaper3 from "../../assets/newspaper3.svg";
import newspaper4 from "../../assets/newspaper4.svg";
import newspaper5 from "../../assets/newspaper5.svg";
import { jsonPost } from "../../helpers";
import Game, { diffScore, GameProps } from "../Game/Game";
import style from "./App.module.scss";

const papers = [
	newspaper1,
	newspaper2,
	newspaper3,
	newspaper4,
	newspaper5,
	newspaper1,
	newspaper2,
	newspaper3,
	newspaper4,
	newspaper5,
	newspaper1,
	newspaper2,
	newspaper3,
	newspaper4,
	newspaper5,
];

enum GameState {
	menu,
	playing,
	instructions,
	about,
	globalScore,
	setName,
}

type difficultyName = "easy" | "medium" | "hard";

type Difficulty = {
	[key in difficultyName]: Omit<GameProps, "showGlobalScore">;
};

const difficultyOptions: Difficulty = {
	easy: { difficulty: 0, stageTime: 40, totalStages: 5 },
	medium: { difficulty: 1, stageTime: 30, totalStages: 5 },
	hard: { difficulty: 2, stageTime: 20, totalStages: 7 },
};

/**
 * Contains the entire App.
 * Displays menu on startup.
 */
function App() {
	// I opted for an enum-based state management instead of heavy weights like react-router
	// for simplicities sake, the project is very light in views so I dimmed it unnecessary.
	const [gameState, setGameState] = useState<GameState>(GameState.menu);
	const [difficulty, setDifficulty] = useState<difficultyName>();
	const [score, setScore] = useState<Score>();
	const [playerName, setPlayerName] = useState<string>();
	const [topScores, setTopScores] = useState<Score[]>();
	const titleRef = useRef<HTMLHeadingElement>(null);
	const papersRef = useRef<HTMLImageElement[]>([]);
	const handler = (idx: number) => (e: React.FormEvent<HTMLImageElement>) => {
		const next = papersRef.current[idx + 1];
		if (next) {
			next.focus();
		}
	};
	// This animates the title with translations combined with css `transition: all`
	useEffect(() => {
		if (!titleRef.current) return;
		let transitionStrength = {
			rotate: 10,
			translate: 10,
		};
		for (let i = 0; i < papersRef.current.length; i++) {
			papersRef.current[i].style.top = Math.random() * 120 - 120 + "vh";
			papersRef.current[i].style.left = Math.random() * 100 + "vw";
			papersRef.current[i].style.rotate = Math.random() * 360 + "deg";
		}
		const papersInterval = setInterval(() => {
			for (let i = 0; i < papersRef.current.length; i++) {
				let loc: number =
					parseFloat(papersRef.current[i].style.top || "0") + 10;

				if (loc >= 110) {
					loc = -20;
					papersRef.current[i].style.display = "none";
					papersRef.current[i].style.rotate = Math.random() * 360 + "deg";
					papersRef.current[i].style.left = Math.random() * 100 + "vw";
				} else {
					papersRef.current[i].style.display = "unset";
				}
				papersRef.current[i].style.top = loc + "vh";
			}
		}, 1000);
		const titleInterval = setInterval(() => {
			if (!titleRef.current) return;
			let transform = "";
			transform +=
				"rotate(" + Math.random() * transitionStrength.rotate + "deg) ";
			transform +=
				"translate(" +
				(Math.random() * transitionStrength.translate -
					0.5 * transitionStrength.translate) +
				"px, " +
				(Math.random() * transitionStrength.translate -
					0.5 * transitionStrength.translate +
					"px) ");
			transform += "scale(" + (Math.random() * 110 + 120) + "%)";

			titleRef.current.style.transform = transform;
			transitionStrength.rotate *= Math.round(Math.random()) || -1;
			transitionStrength.translate *= Math.round(Math.random()) || -1;
		}, 600);

		return () => {
			clearInterval(papersInterval);
			clearInterval(titleInterval);
		};
	}, []);
	// Remove difficulty settings when returning to menu.
	useEffect(() => setDifficulty(undefined), [gameState]);
	// Change state to menu when returning via browser back button.
	useEffect(() => {
		const onPopState = () => setGameState(GameState.menu);
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	if (gameState === GameState.playing) {
		if (!difficulty) {
			return (
				<div className={style.main}>
					<div className={style["difficulty-selection"]}>
						<h4 className={style.title}>בחרו רמת קושי</h4>
						<button
							className={style.button}
							onClick={() => setDifficulty("easy")}
						>
							קלה
						</button>
						<button
							className={style.button}
							onClick={() => setDifficulty("medium")}
						>
							בינונית
						</button>
						<button
							className={style.button}
							onClick={() => setDifficulty("hard")}
						>
							קשה
						</button>
					</div>
				</div>
			);
		}
		return (
			<div>
				<button
					style={{ margin: "1rem" }}
					className={style.button}
					onClick={() => setGameState(GameState.menu)}
				>
					חזרה לתפריט
				</button>
				<Game
					{...difficultyOptions[difficulty]}
					showGlobalScore={(playScore) => {
						setScore(playScore);
						setGameState(GameState.globalScore);
					}}
				/>
			</div>
		);
	} else if (gameState === GameState.about) {
		return (
			<div className={style.main}>
				<div className={style["text-box"]}>
					<p>המשחק נבנה ב❤ ע"י יובל הרמן.</p>
					<p>
						המשחק בנוי בעזרת טכנולוגיית ריאקט, sqlite, node וtypescript.
					</p>
					<p>
						לעוד פרטים עלי להלן{" "}
						<a href="https://www.linkedin.com/in/yuvalherman99/">
							דף הלינקדאין שלי
						</a>
						.
					</p>
					<p>
						לעוד פרטים על המשחק{" "}
						<a href="https://github.com/yuval-herman/news-scraper">
							להלן דף הגיטהאב שלו
						</a>
						.
					</p>
					<button
						className={style.button}
						onClick={() => setGameState(GameState.menu)}
					>
						חזרה לתפריט
					</button>
				</div>
			</div>
		);
	} else if (gameState === GameState.instructions) {
		return (
			<div className={style.main}>
				<div className={style["text-box"]}>
					<p>המשחק די פשוט!</p>
					<p>במסך יוצגו 2 אלמנטים עיקריים: המאמר, והתגובות.</p>
					<p>
						עליכם לקרוא את המאמר ולנחש איזו תגובה מהתגובות שייכת במקור
						למאמר.
					</p>
					<p>
						<strong>שימו לב!</strong> המאמרים והתגובות כולם אמיתיים
						ופורסמו באתרי חדשות שונים, אם ראיתם כתבה או תגובה ותהיתם מה
						הסיפור המלא, לאחר לחיצה על התגובה שבחרתם יפיעו על התגובות
						קישורים למאמרים המקוריים.
					</p>
					<p>
						חישוב הניקוד הסופי מתחשב גם בזמן שלקח לכם למצוא את התשובה אז
						כדי שתזדרזו!
					</p>
					<button
						className={style.button}
						onClick={() => setGameState(GameState.menu)}
					>
						חזרה לתפריט
					</button>
				</div>
			</div>
		);
	} else if (gameState === GameState.globalScore) {
		if (!playerName) {
			setGameState(GameState.setName);
		}
		if (!topScores) {
			return (
				<div className={style["text-box"]}>
					<p className={style.waiter}>מוריד מידע...</p>;
				</div>
			);
		}

		return (
			<div className={style.main}>
				<div className={style["text-box"]}>
					{score ? (
						<div>
							<h3>התוצאות שלך({playerName}) הן:</h3>
							<h4>
								{score?.score.toPrecision(2)} ברמת קושי{" "}
								{diffScore[score?.difficulty ?? 0]}
							</h4>
						</div>
					) : undefined}
					<ol>
						{topScores.map((gScore) => (
							<li>
								{gScore.name} קיבל {gScore.score.toPrecision(2)} ברמת
								קושי {diffScore[gScore.difficulty]}
							</li>
						))}
					</ol>
					<button
						style={{ margin: "1rem" }}
						className={style.button}
						onClick={() => setGameState(GameState.menu)}
					>
						חזרה לתפריט
					</button>
				</div>
			</div>
		);
	} else if (gameState === GameState.setName) {
		return (
			<div className={style.main}>
				<div className={style["text-box"]}>
					<div>
						<p>התוצאות שלך הולכות להישלח לשרת, מה שמך?</p>
						<input
							type="text"
							placeholder="ישראל ישראלי"
							value={playerName}
							onChange={(event) =>
								setPlayerName(event.currentTarget.value)
							}
							className={style.input}
						/>
					</div>
					<button
						className={style.button}
						style={{ marginTop: "1rem" }}
						onClick={() => {
							if (!playerName) {
								alert(
									"חובה למלא שם כדי לראות את התוצאות של שאר השחקנים"
								);
								return;
							}
							jsonPost("/score", { ...score!, name: playerName }).then(
								setTopScores
							);
							setGameState(GameState.globalScore);
						}}
					>
						שלח
					</button>
				</div>
			</div>
		);
	}
	return (
		<div className={style.main}>
			<div>
				{papers.map((p, i) => (
					<img
						key={i}
						className={style.falling}
						src={p}
						ref={(el) => (papersRef.current[i] = el!)}
						alt=""
						onChange={handler(i)}
					/>
				))}
			</div>
			<div>
				<h1 className={style.title} ref={titleRef}>
					מה אתה אומר?!
				</h1>
				<h3>משחק הדעות הישראלי</h3>
			</div>
			<div className={style.buttons}>
				<button
					className={style.button}
					onClick={() => setGameState(GameState.playing)}
				>
					להתחלה!
				</button>
				<button
					className={style.button}
					onClick={() => setGameState(GameState.globalScore)}
				>
					טבלת ניקוד
				</button>
				<button
					className={style.button}
					onClick={() => setGameState(GameState.instructions)}
				>
					הוראות
				</button>

				<button
					className={style.button}
					onClick={() => setGameState(GameState.about)}
				>
					אודות
				</button>
			</div>
		</div>
	);
}

export default App;
