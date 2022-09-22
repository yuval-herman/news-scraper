"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMako = void 0;
const base_1 = require("./base");
function getMako() {
    return (0, base_1.getRssWithTalkbacks)("https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml", (item) => item.guid, (id) => `https://www.mako.co.il/AjaxPage?jspName=talkbacksInJSONresponse.jsp&vgnextoid=${id}&page=1`, (talkbacks) => {
        const convertTalkback = (item) => ({
            title: item.subject,
            writer: item.username,
            content: item.text,
            createDate: new Date(item.dateMs),
            negative: 0,
            positive: 0,
            children: item.replies.length
                ? item.replies.map(convertTalkback)
                : [],
        });
        return talkbacks.mainPosts.map(convertTalkback);
    });
}
exports.getMako = getMako;
