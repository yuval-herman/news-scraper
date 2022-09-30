import { DBTalkback } from "../../../../scraper/scraper";
import style from "./Talkback.module.scss";

interface Props {
	talkback: DBTalkback;
	isCorrect?: boolean;
	showCorrect: boolean;
	onClick: () => void;
}

function Talkback(props: Props) {
	const talkback = props.talkback;
	let showCorrectClass = " ";
	if (props.showCorrect) {
		showCorrectClass += props.isCorrect ? style.correct : style.incorrect;
	}
	return (
		<div onClick={props.onClick} className={style.main + showCorrectClass}>
			<p className={style.writer}>{talkback.writer}</p>
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
