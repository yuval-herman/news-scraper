import { Article as ArticleType } from "../../../../scraper/news-providers/base";
import style from "./Article.module.scss";

interface Props {
	article: ArticleType;
	className?: string;
}

function Article(props: Props) {
	const article = props.article;
	return (
		<div
			className={style.main + (props.className ? " " + props.className : "")}
		>
			<p className={style.title}>{article.title}</p>
			<p className={style.content}>{article.contentSnippet}</p>
		</div>
	);
}

export default Article;
