import { spawn } from "child_process";
import { decode, encode } from "iconv-lite";

/**
 * Get a text and return list of base words.
 * @param text text to analyze
 */
export async function hspellAnalyze(text: string): Promise<string[]> {
	const hspell = spawn("hspell", ["-l"]);
	hspell.stdin.write(encode(text, "ISO-8859-8"));
	hspell.stdin.end();
	const hspellOutput: string[] = [];
	for await (const chunk of hspell.stdout) {
		hspellOutput.push(decode(chunk, "ISO-8859-8"));
	}
	return parseHspellOutput(hspellOutput.join(""));
}

/**
 * Get hspell text output and parse it, return a list of words.
 * @param text hspell output
 */
function parseHspellOutput(text: string): string[] {
	const parsed: string[] = [];
	let word;
	const lastLocs: {
		t?: number;
		n?: number;
		bracket?: number;
		space?: number;
	} = {};
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			lastLocs.n = i;
			if (text.slice(i + 1, i + 7) === "שגיאות") break;

			if (text[i + 1] === "\t") {
				lastLocs.t = i + 1;
			} else {
				word = text.slice(lastLocs.t! + 1, lastLocs.bracket);
				if (word === "שונות") {
					for (let k = lastLocs.space! + 2; k < text.length; k++) {
						if (text[k] === "\n") {
							word = text.slice(lastLocs.space! + 1, k);
							break;
						}
					}
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

export async function frequentWords(
	data: string[] | string
): Promise<Map<string, number>> {
	const wordMap = new Map<string, number>();
	const countWords = (analyzed: string[]): void => {
		for (let word of analyzed) {
			wordMap.set(word, (wordMap.get(word) ?? 0) + 1);
		}
	};
	const text = Array.isArray(data) ? data.join("\n") : data;
	countWords((await hspellAnalyze(text)).flat());
	return wordMap;
}
