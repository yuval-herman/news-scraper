import { useEffect, useRef, useState } from "react";
import { DBTalkback } from "../../../../scraper/scraper";

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
		<div className="App">
			{talkbacks.map((item) => (
				<div key={item.id}>
					<p>{item.writer}</p>
					<p>{item.title}</p>
					<p>{item.content}</p>
				</div>
			))}
		</div>
	);
}

export default App;
