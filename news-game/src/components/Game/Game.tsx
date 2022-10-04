import { useCallback, useEffect, useRef, useState } from "react";
import { Article as ArticleType } from "../../../../scraper/news-providers/base";
import { DBTalkback } from "../../../../scraper/scraper";
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
	const fetchData = useCallback(async () => {
		const resTalkbacks: DBTalkback[] = await jsonFetch(
			"/random/talkback?amount=4"
		);
		setTalkbacks(resTalkbacks);
		const { articleGUID } =
			resTalkbacks[Math.floor(Math.random() * resTalkbacks.length)];
		const article = await jsonFetch("/article/" + articleGUID);
		setArticle(article);
	}, []);
	useEffect(() => {
		if (rendered.current) return;
		rendered.current = true;
		fetchData();
	});

	return (
		<div className={style.main}>
			<div className={style["article-div"]}>
				{article ? (
					<Article className={style.article} article={article} />
				) : (
					"fetching article"
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
