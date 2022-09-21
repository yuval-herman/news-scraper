"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMako = void 0;
const base_1 = require("./base");
function getMako() {
    return (0, base_1.getRssTalkbacks)("https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml", (item) => item.guid, (id) => `https://www.mako.co.il/AjaxPage?jspName=talkbacksInJSONresponse.jsp&vgnextoid=${id}&page=1`);
}
exports.getMako = getMako;
