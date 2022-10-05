import { useState } from "react";
import Game from "../Game/Game";
import style from "./App.module.scss";

enum GameState {
	menu,
	playing,
	instructions,
	about,
}

function App() {
	const [gameState, setGameState] = useState<GameState>(GameState.menu);
	if (gameState === GameState.playing) {
		return (
			<div>
				<button
					style={{ margin: "1rem" }}
					className={style.button}
					onClick={() => setGameState(GameState.menu)}
				>
					חזרה לתפריט
				</button>
				<Game />
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
			<h1 className={style.title}>משחק חדשות ללא שם!</h1>
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
