import { MouseEvent, useEffect, useState } from "react";
import { DBTalkback } from "../../../../common/types";
import { removeHTML } from "../../helpers";
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
	// Gets the article link after displaying the talkback and every time the talkback changes.
	useEffect(() => {
		fetch(`/article/${talkback.articleGUID}`).then((r) =>
			r.json().then((article) => setArticleLink(article.link))
		);
	}, [talkback.articleGUID]);

	function onClick(event: MouseEvent) {
		// Ignore clicks on the article link.
		if ((event.target as HTMLElement).nodeName === "A") return;
		// Ignore clicks if showing answers.
		if (props.showCorrect) return;

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
				{props.showCorrect ? (
					<a
						href={articleLink}
						className={style.link}
						rel="noreferrer"
						target="_blank"
					>
						Link to original article
					</a>
				) : undefined}
			</div>
			{talkback.title ? (
				<p className={talkback.content ? style.title : style.content}>
					{talkback.title}
				</p>
			) : undefined}
			{talkback.content ? (
				<p
					className={
						style.content +
						(talkback.content.length > 500 ||
						(talkback.title && talkback.title?.length > 500)
							? " " + style["content-long"]
							: "")
					}
				>
					{removeHTML(talkback.content)}
				</p>
			) : undefined}
		</div>
	);
}

export default Talkback;
