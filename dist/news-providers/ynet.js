"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYnet = void 0;
const base_1 = require("./base");
function getYnet() {
    return (0, base_1.getRssWithTalkbacks)("https://www.ynet.co.il/Integration/StoryRss2.xml", (item) => item.link.split("/").at(-1), (id) => `https://www.ynet.co.il/iphone/json/api/talkbacks/list/${id}/start_to_end/1`, (talkback) => {
        const convertTalkback = (item) => ({
            writer: item.author,
            title: item.title,
            createDate: "pubDate" in item ? item.pubDate : item.date,
            content: item.text,
            children: [],
            negative: "unlikes" in item ? item.unlikes : 0,
            positive: "likes" in item ? item.likes : 0,
        });
        if (!talkback.rss.channel.item)
            return [];
        const normalized = [];
        const children = [];
        for (const item of talkback.rss.channel.item) {
            if (item.talkback_parent_id) {
                children.push(item);
            }
            else {
                normalized.push(convertTalkback(item));
            }
        }
        for (const talkback of normalized) {
            for (const child of children) {
                const converted = convertTalkback(child.talkback_parent_id);
                if (talkback.content === converted.content &&
                    talkback.createDate === converted.createDate &&
                    talkback.title === converted.title &&
                    talkback.writer === converted.writer)
                    talkback.children.push(convertTalkback(child));
            }
        }
        return normalized;
    });
}
exports.getYnet = getYnet;
