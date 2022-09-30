import { render, screen } from "@testing-library/react";
import Talkback from "./Talkback";

describe("Talkback component", () => {
	describe("shows talkback details", () => {
		const DBtalkback = {
			id: "be5ec629ca91f658101a212885c13de0bee6a5e8",
			writer: "מושיקו",
			title: "גנץ מזכיר אחר שקיבל תדמית של מאמי ציבורי אבל הביא",
			content:
				'נזק למדינה. גנץ רמטכ"ל כושל במשמרתו נפלו עשרות חיילים על אדמת ישראל מול עזה ולא בלחימה. העיתון דאז עם תמונות של נופלים  מולי.  הוא מארח בביתו רב מחבלים שמשמיץ את ישראל בכל הזדמנות. עדיף שישתוק בתחומים שהוא מביא רק נזק. וזו דעתי',
			createDate: "2022-09-29T08:45:20.000000Z",
			positive: 14,
			negative: 9,
			parentID: null,
			articleGUID: "bk0rgpfgi",
			children: [], //TODO: remove this as this will not appear as a result from server ever
		};
		const talkback = render(<Talkback talkback={DBtalkback} />);
		it("renders writer name", () =>
			expect(talkback.getByText(DBtalkback.writer)).toBeInTheDocument());
		it("renders the title", () =>
			expect(talkback.getByText(DBtalkback.title)).toBeInTheDocument());
		it("renders talkback content", () =>
			expect(talkback.getByText(DBtalkback.content)).toBeInTheDocument());
	});
});
