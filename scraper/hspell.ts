import { spawn } from "child_process";
import { decode, encode } from "iconv-lite";

const hspell = spawn("hspell", ["-l"]);

/**
 * Get a text and return list of base words.
 * @param text text to analyze
 */
export function hspellAnalyze(text: string): Promise<string[]> {
	hspell.stdin.write(encode(text, "ISO-8859-8"));
	hspell.stdin.write(Buffer.from([0]));
	return new Promise((resolve) => {
		hspell.stdout?.on("data", (data: Buffer) => {
			resolve(parseHspellOutput(decode(data, "ISO-8859-8")));
		});
	});
}

/**
 * Get hspell text output and parse it, return a list of words.
 * @param text hspell output
 */
function parseHspellOutput(text: string): string[] {
	const parsed: string[] = [];
	let word;
	const lastLocs: { t?: number; bracket?: number; space?: number } = {};
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			if (text.slice(i + 1, i + 7) === "שגיאות") break;

			if (text[i + 1] === "\t") {
				lastLocs.t = i + 1;
			} else {
				word = text.slice(lastLocs.t! + 1, lastLocs.bracket);
				if (word === "שונות") {
					word = text.slice(lastLocs.space! + 1, lastLocs.t! - 1);
				}
				parsed.push(word);
			}
		} else if (text[i] === "(") {
			lastLocs.bracket = i;
		} else if (text[i] === " ") {
			lastLocs.space = i;
		}
	}
	return parsed;
}

/**
 * Stops the hspell program.
 * The current script will not exit until calling this function.
 */
export function stopHspell() {
	hspell.stdin.end();
}
