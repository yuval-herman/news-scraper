"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYnet = void 0;
const base_1 = require("./base");
function getYnet() {
    return (0, base_1.getRssTalkbacks)("https://www.ynet.co.il/Integration/StoryRss2.xml", (item) => item.link.split("/").at(-1), (id) => `https://www.ynet.co.il/iphone/json/api/talkbacks/list/${id}/end_to_start/1`);
}
exports.getYnet = getYnet;
