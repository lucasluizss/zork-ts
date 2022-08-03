#!/usr/bin/env node

/**
 * The Levenshtein distance is a string metric for measuring the difference between two sequences.
 * It is the minimum number of single-character edits required to change one word into the other.
 * https://en.wikipedia.org/wiki/Levenshtein_distance
 */

class SimilarityService {
	public calculate(s1 = '', s2 = ''): number {
		let longer = s1;
		let shorter = s2;

		if (s1.length < s2.length) {
			longer = s2;
			shorter = s1;
		}

		const longerLength = longer.length;

		if (longerLength == 0) {
			return 1.0;
		}

		return (longerLength - this.editDistance(longer, shorter)) / longerLength;
	}

	private editDistance(s1: string, s2: string): number {
		s1 = s1.toLowerCase();
		s2 = s2.toLowerCase();

		let costs = new Array();

		for (let i = 0; i <= s1.length; i++) {
			let lastValue = i;

			for (let j = 0; j <= s2.length; j++) {
				if (i == 0) {
					costs[j] = j;
				} else {
					if (j > 0) {
						let newValue = costs[j - 1];

						if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
							newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
						}

						costs[j - 1] = lastValue;
						lastValue = newValue;
					}
				}
			}

			if (i > 0) {
				costs[s2.length] = lastValue;
			}
		}

		return costs[s2.length];
	}
}

export default new SimilarityService();
