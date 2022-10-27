import { useEffect, useRef, useState } from "react";
import Game, { GameProps } from "../Game/Game";
import style from "./App.module.scss";

enum GameState {
	menu,
	playing,
	instructions,
	about,
}

type difficultyName = "easy" | "medium" | "hard";

type Difficulty = {
	[key in difficultyName]: GameProps;
};

const difficultyOptions: Difficulty = {
	easy: { difficulty: "קלה", stageTime: 40, totalStages: 5 },
	medium: { difficulty: "בינונית", stageTime: 30, totalStages: 5 },
	hard: { difficulty: "קשה", stageTime: 20, totalStages: 7 },
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
	const titleRef = useRef<HTMLHeadingElement>(null);

	// This animates the title with translations combined with css `transition: all`
	useEffect(() => {
		if (!titleRef.current) return;
		let transitionStrength = {
			rotate: 10,
			translate: 10,
		};
		const id = setInterval(() => {
			if (!titleRef.current) return;
			titleRef.current.style.rotate =
				Math.random() * transitionStrength.rotate + "deg";
			titleRef.current.style.translate =
				Math.random() * transitionStrength.translate -
				0.5 * transitionStrength.translate +
				"px " +
				(Math.random() * transitionStrength.translate -
					0.5 * transitionStrength.translate +
					"px");
			titleRef.current.style.scale = Math.random() * 110 + 120 + "%";
			transitionStrength.rotate *= Math.round(Math.random()) || -1;
			transitionStrength.translate *= Math.round(Math.random()) || -1;
		}, 600);
		return () => clearInterval(id);
	});
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
					<div className={style["text-box"]}>
						<h4>בחרו רמת קושי</h4>
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
				<Game {...difficultyOptions[difficulty]} />
			</div>
		);
	}
	if (gameState === GameState.about) {
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
	}
	return (
		<div className={style.main}>
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
