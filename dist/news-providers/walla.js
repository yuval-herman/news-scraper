"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalla = void 0;
const base_1 = require("./base");
function getWalla() {
    return (0, base_1.getRssWithTalkbacks)("https://rss.walla.co.il/feed/1?type=main", (item) => item.link.split("/").at(-1), (id) => `https://dal.walla.co.il/talkback/list/${id}?type=1&page=1`, (apiResult) => {
        const convertTalkback = (item) => ({
            ...item,
            createDate: new Date(item.createDate),
            children: item.children.length
                ? item.children.map(convertTalkback)
                : [],
        });
        return apiResult.data.list
            ? apiResult.data.list.map(convertTalkback)
            : [];
    });
}
exports.getWalla = getWalla;
