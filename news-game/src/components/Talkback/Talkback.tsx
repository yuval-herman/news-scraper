import { DBTalkback } from "../../../../scraper/scraper";
import style from "./Talkback.module.scss";

interface Props {
	talkback: DBTalkback;
}

function Talkback(props: Props) {
	const talkback = props.talkback;
	return (
		<div className={style.main}>
			<p className={style.title}>{talkback.title}</p>
			<p className={style.writer}>{talkback.writer}</p>
			<main className={style.content}>{talkback.content}</main>
		</div>
	);
}

export default Talkback;
