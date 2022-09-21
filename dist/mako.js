"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rss_parser_1 = __importDefault(require("rss-parser"));
async function getMako() {
    const parser = new rss_parser_1.default();
    const feed = await parser.parseURL("https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml");
    const talkbacks = [];
    let counter = 0;
    const totalItems = feed.items.length;
    for (const item of feed.items) {
        counter++;
        console.log(`fetching article ${counter} out of ${totalItems}`);
        console.log("article title: " + item.title);
        const itemID = item.guid;
        talkbacks.push({
            ...item,
            talkbacks: await (await fetch(`https://www.mako.co.il/AjaxPage?jspName=talkbacksInJSONresponse.jsp&vgnextoid=${itemID}&page=1`)).json(),
        });
    }
    return talkbacks;
}
