"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYnet = void 0;
const rss_parser_1 = __importDefault(require("rss-parser"));
async function getYnet() {
    const parser = new rss_parser_1.default();
    const feed = await parser.parseURL("https://www.ynet.co.il/Integration/StoryRss2.xml");
    const talkbacks = [];
    let counter = 0;
    const totalItems = feed.items.length;
    for (const item of feed.items) {
        counter++;
        console.log(`fetching article ${counter} out of ${totalItems}`);
        console.log("article title: " + item.title);
        const itemID = item.link.split("/").at(-1);
        talkbacks.push({
            ...item,
            talkbacks: (await (await fetch(`https://www.ynet.co.il/iphone/json/api/talkbacks/list/${itemID}/end_to_start/1`)).json()).rss,
        });
    }
    return talkbacks;
}
exports.getYnet = getYnet;
