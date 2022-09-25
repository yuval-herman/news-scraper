"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default("db.db");
db.prepare(`CREATE TABLE IF NOT EXISTS articles (
    guid PRIMARY KEY,
	title,
   	link,
    pubDate,
    content,
    contentSnippet
)`).run();
// getYnet().then((data) => writeFileSync("ynet.json", JSON.stringify(data)));
// getMako().then((data) => writeFileSync("mako.json", JSON.stringify(data)));
// getWalla().then((data) => writeFileSync("walla.json", JSON.stringify(data)));
