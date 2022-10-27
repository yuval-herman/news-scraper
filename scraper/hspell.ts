import { existsSync, readFileSync } from "fs";
import path from "path";

const wordMap = new Map<string, string>();
let reset = true;
let curr = "";
let words_path = path.join(__dirname, "../hspell_files/nouns.txt");
if (!existsSync(words_path)) words_path = path.join(__dirname, "nouns.txt");
for (const word of readFileSync(words_path)
	.toString()
	.match(/(^[א-ת]+|-------)/gm)!) {
	if (word === "-------") {
		reset = true;
	} else if (reset) {
		curr = word;
		wordMap.set(curr, curr);
		reset = false;
	} else {
		wordMap.set(word, curr);
	}
}

/**
 * Get a text and return list of base words.
 * @param text text to analyze
 */
export function hspellAnalyze(text: string): string[] {
	return text
		.match(/[א-ת]+/g)
		?.map((i) => wordMap.get(i))
		.filter(Boolean) as string[];
}

/**
 * Get hspell text output and parse it, return a list of words.
 * @param text hspell output
 */
function parseHspellOutput(text: string): string[] {
	return text.match(/[א-ת"]+(?=\(ע,|\(ת,)/g)!;
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
	countWords(hspellAnalyze(text).flat());
	return wordMap;
}
