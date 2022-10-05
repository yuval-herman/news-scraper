import { MouseEvent, useEffect, useState } from "react";
import { DBTalkback } from "../../../../scraper/scraper";
import style from "./Talkback.module.scss";

interface Props {
	talkback: DBTalkback;
	isCorrect?: boolean;
	showCorrect: boolean;
	onClick: () => void;
}

function Talkback(props: Props) {
	const [articleLink, setArticleLink] = useState<string>();
	const talkback = props.talkback;
	useEffect(() => {
		fetch(`/article/${talkback.articleGUID}`).then((r) =>
			r.json().then((article) => setArticleLink(article.link))
		);
	}, [talkback.articleGUID]);
	function onClick(event: MouseEvent) {
		if ((event.target as HTMLElement).nodeName === "A") return;
		props.onClick();
	}
	let showCorrectClass = " ";
	if (props.showCorrect) {
		showCorrectClass += props.isCorrect ? style.correct : style.incorrect;
	}
	return (
		<div onClick={onClick} className={style.main + showCorrectClass}>
			<div className={style.head}>
				<p className={style.writer}>{talkback.writer}</p>
				<a
					href={articleLink}
					className={style.link}
					rel="noreferrer"
					target="_blank"
				>
					Link to original article
				</a>
			</div>
			<p className={talkback.content ? style.title : style.content}>
				{talkback.title}
			</p>
			{talkback.content ? (
				<p className={style.content}>{talkback.content}</p>
			) : undefined}
		</div>
	);
}

export default Talkback;
