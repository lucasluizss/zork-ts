import readline from 'readline';
import { FgGreen, FgRed, FgYellow, Reset } from './constants';

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
 * printLine method
 * @param message It works in the same way as console.log but in a short sintax with a new line
 * @returns undefined
 */
export const printLine = (...message: any) => print('\n', ...message, '\n');

/**
 * alert method
 * @param message It works in the same way as print but in a short sintax and yellow text
 * @returns undefined
 */
export const alert = (...message: any) => {
	line(FgYellow);
	print(...message);
	line();
	print(Reset);
};

/**
 * success method
 * @param message It works in the same way as print but in a short sintax and red text
 * @returns undefined
 */
export const danger = (...message: any) => {
	line(FgRed);
	print(...message);
	line();
	print(Reset);
};

/**
 * success method
 * @param message It works in the same way as print but in a short sintax and green text
 * @returns undefined
 */
export const success = (...message: any) => {
	line(FgGreen);
	print(...message);
	line();
	print(Reset);
};

/**
 * input method
 * @param message It get the user input from the terminal
 * @returns Promise<string>
 */
export const input = (message: string) => {
	return new Promise<string>((resolve, _) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(message, answer => {
			resolve(answer ?? '');
			rl.close();
		});
	});
};
