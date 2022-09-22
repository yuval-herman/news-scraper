"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRssWithTalkbacks = void 0;
const rss_parser_1 = __importDefault(require("rss-parser"));
async function getRssWithTalkbacks(rssURL, extractID, getTalkbacksUrl, normalizeTalkbacks) {
    const parser = new rss_parser_1.default();
    const feed = await parser.parseURL(rssURL);
    const itemWithTalkbacks = [];
    let counter = 0;
    const totalItems = feed.items.length;
    for (const item of feed.items) {
        counter++;
        console.log(`fetching article ${counter} out of ${totalItems}`);
        console.log("article title: " + item.title);
        const itemID = extractID(item);
        const talkbacks = await (await fetch(getTalkbacksUrl(itemID))).json();
        itemWithTalkbacks.push({
            ...item,
            talkbacks: normalizeTalkbacks(talkbacks),
        });
    }
    return itemWithTalkbacks;
}
exports.getRssWithTalkbacks = getRssWithTalkbacks;
