import { useEffect, useRef, useState } from "react";
import { DBTalkback } from "../../../../scraper/scraper";
import Talkback from "../Talkback/Talkback";
import style from "./App.module.scss";

async function jsonFetch(input: RequestInfo | URL, init?: RequestInit) {
	return (await fetch(input, init)).json();
}

function App() {
	const rendered = useRef(false);
	const [talkbacks, setTalkbacks] = useState<DBTalkback[]>([]);
	useEffect(() => {
		if (rendered.current) return;
		rendered.current = true;
		jsonFetch("http://localhost:4000/random/talkback?amount=4").then((res) =>
			setTalkbacks((t) => [...t, ...res])
		);
	});
	console.log(talkbacks);

	return (
		<div className={style.main}>
			<div className={style.talkbacks}>
				{talkbacks.map((item) => (
					<Talkback key={item.id} talkback={item} />
				))}
			</div>
		</div>
	);
}

export default App;
