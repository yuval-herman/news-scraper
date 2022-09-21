import { getRssTalkbacks } from "./base";

export function getMako() {
	return getRssTalkbacks(
		"https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml",
		(item) => item.guid!,
		(id) =>
			`https://www.mako.co.il/AjaxPage?jspName=talkbacksInJSONresponse.jsp&vgnextoid=${id}&page=1`
	);
}
