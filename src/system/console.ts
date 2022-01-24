import readline from 'readline';

/**
 * clear method
 * @returns undefined
 */
export const clear = () => console.clear();

/**
 * line method
 * @param args anything to customize the output
 * @returns custom line with dashs
 */
export const line = (...args: any) => print(...args, '-'.repeat(70));

/**
 * print method
 * @param message It works in the same way as console.log but in a short sintax
 * @returns undefined
 */
export const print = (...message: any) => console.log(...message);

/**
 * input method
 * @param message It get the user input from the terminal
 * @returns Promise<string>
 */
export const input = (message: string) => {
	return new Promise<string>((resolve, reject) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(message, answer => {
			if (answer) {
				resolve(answer);
			} else {
				reject();
			}

			rl.close();
		});
	});
};
