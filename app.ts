import { writeFileSync } from "fs";
import { getMako } from "./news-providers/mako";
import { getWalla } from "./news-providers/walla";
import { getYnet } from "./news-providers/ynet";

import Database from "better-sqlite3";
const db = new Database("db.db");

db.prepare(
	`CREATE TABLE IF NOT EXISTS articles (
    guid PRIMARY KEY,
	title,
   	link,
    pubDate,
    content,
    contentSnippet
)`
).run();
getYnet().then((data) => writeFileSync("ynet.json", JSON.stringify(data)));
// getMako().then((data) => writeFileSync("mako.json", JSON.stringify(data)));
// getWalla().then((data) => writeFileSync("walla.json", JSON.stringify(data)));
