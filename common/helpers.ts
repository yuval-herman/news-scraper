import { pseudoRandomBytes } from "crypto";

/**
 * Generates an array of random integers between 0 and `max`.
 * @param max biggest int to generate
 * @param amount amount of ints to generate
 */
export function getRandomNumbers(max: number | bigint, amount: number) {
	const numArr = Array<number | bigint>(amount);
	for (let i = 0; i < amount; i++) {
		if (typeof max !== "bigint") {
			numArr[i] = Math.floor(Math.random() * max) + 1;
		} else {
			const rndBigInt = pseudoRandomBytes(
				Number(max / 18446744073709551615n)
			).readBigUInt64BE();
			numArr[i] = max < rndBigInt ? max : rndBigInt;
		}
	}
	return numArr;
}

/**
 * Samples `amount` of items from an array.
 * `amount` can be bigger then `arr.length`,
 * the function is not guarantied to return the full array either way.
 * @param arr an array to sample from
 * @param {number} [amount=1] amount of items to sample
 */
export function sampleRandom<T>(arr: T[], amount: number = 1) {
	if (amount < 0) amount = 1;
	const resArr: T[] = Array(Math.min(amount, arr.length));
	for (let i = 0; i < amount && arr.length; i++) {
		const randIndex = Math.floor(Math.random() * arr.length);
		resArr[i] = arr.splice(randIndex, 1)[0];
	}
	return resArr;
}
