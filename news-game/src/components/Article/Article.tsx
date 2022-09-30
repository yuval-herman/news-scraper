import { Article as ArticleType } from "../../../../scraper/news-providers/base";
import style from "./Article.module.scss";

interface Props {
	article: ArticleType;
}

function Article(props: Props) {
	const article = props.article;
	return (
		<div className={style.main}>
			<p className={style.title}>{article.title}</p>
			<p className={style.content}>{article.contentSnippet}</p>
		</div>
	);
}

export default Article;
