import { Article as ArticleType } from "../../../../scraper/news-providers/base";
import { DBTalkback } from "../../../../scraper/scraper";
import Article from "../Article/Article";
import Talkback from "../Talkback/Talkback";
import style from "./App.module.scss";

async function jsonFetch(input: RequestInfo | URL, init?: RequestInit) {
	return (await fetch(input, init)).json();
}

function App() {
	const rendered = useRef(false);
	const [talkbacks, setTalkbacks] = useState<DBTalkback[]>([]);
	const [article, setArticle] = useState<ArticleType>();
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
			{article ? <Article article={article} /> : "fetching article"}
			<div className={style.talkbacks}>
				{talkbacks.map((item) => (
					<Talkback key={item.id} talkback={item} />
				))}
			</div>
		</div>
	);
}

export default App;
