import { useState } from "react";
import Game from "../Game/Game";
import style from "./App.module.scss";

enum GameState {
	playing,
}

function App() {
	const [gameState, setGameState] = useState<GameState>();
	if (gameState === GameState.playing) {
		return <Game />;
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
				<button className={style.button}>הוראות</button>
			</div>
		</div>
	);
}

export default App;
