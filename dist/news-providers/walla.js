"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalla = void 0;
const base_1 = require("./base");
function getWalla() {
    return (0, base_1.getRssTalkbacks)("https://rss.walla.co.il/feed/1?type=main", (item) => item.link.split("/").at(-1), (id) => `https://dal.walla.co.il/talkback/list/${id}?type=1&page=1`);
}
exports.getWalla = getWalla;
