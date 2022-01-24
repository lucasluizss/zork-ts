import {
	Reset,
	BgWhite,
	FgRed,
	FgYellow,
	DeadOptions,
	ConfirmOptions,
} from './system/constants';
import { Part } from './system/part';
import { print, input, line, clear } from './system/console';

const [, , lang] = process.argv;
const translation = require(`./assets/lang/zork-${lang ?? 'en'}.json`);
const { history, message, rightAnswer } = translation;

class Zork {
	private answer: string;

	constructor() {
		this.showGreetings();
	}

	private showGreetings() {
		line(BgWhite, FgRed);
		print(
			'\t',
			message['Welcome to Zork - The Unofficial TypeScript Version.']
		);
		line(BgWhite, FgRed);
		print(Reset);
	}

	public start = () => this.partI();

	private clearAnswer = () => (this.answer = null);

	private async partI() {
		while (!rightAnswer[Part.I].includes(this.answer)) {
			line();
			print(
				Reset,
				message[
					'You are standing in an open field west of a white house, with a boarded front door.'
				]
			);
			print(message['(A secret path leads southwest into the forest.)']);
			print(message['There is a Small Mailbox.']);

			this.answer = (
				await input(message['What do you do? '])
			).toLocaleLowerCase();

			if (history[this.answer]) {
				line(FgYellow);
				print(history[this.answer]);
			}
		}

		this.clearAnswer();
		await this.partII();
	}

	private async partII() {
		while (!rightAnswer[Part.II].includes(this.answer)) {
			line();
			print(
				Reset,
				message[
					'This is a forest, with trees in all directions. To the east, there appears to be sunlight.'
				]
			);

			this.answer = (
				await input(message['What do you do? '])
			).toLocaleLowerCase();

			if (history[this.answer]) {
				line(FgYellow);
				print(history[this.answer]);
			}
		}

		this.clearAnswer();
		await this.partIII();
	}

	private async partIII() {
		while (!rightAnswer[Part.III].includes(this.answer)) {
			line();
			print(
				Reset,
				message[
					'You are in a clearing, with a forest surrounding you on all sides. A path leads south.'
				]
			);
			print(message['There is an open grating, descending into darkness.']);

			this.answer = (
				await input(message['What do you do? '])
			).toLocaleLowerCase();

			if (history[this.answer]) {
				line(FgYellow);
				print(history[this.answer]);
			}
		}

		this.clearAnswer();
		await this.partIV();
	}

	private async partIV() {
		let isDead: boolean;

		while (!rightAnswer[Part.IV].includes(this.answer)) {
			line();
			print(
				Reset,
				message[
					'You are in a tiny cave with a dark, forbidding staircase leading down.'
				]
			);
			print(message['There is a skeleton of a human male in one corner.']);

			this.answer = (
				await input(message['What do you do? '])
			).toLocaleLowerCase();

			if (history[this.answer]) {
				line(FgYellow);
				print(history[this.answer]);

				isDead = DeadOptions.includes(this.answer);

				if (isDead) {
					const confirm = await input(
						message['Do you want to continue? (Y/N) ']
					);

					if (ConfirmOptions.includes(confirm)) {
						await this.partI();
						break;
					} else {
						process.exit();
					}
				}
			}
		}

		this.clearAnswer();
		await this.partV();
	}

	private async partV() {
		while (rightAnswer[Part.V] !== this.answer) {
			line();
			print(
				Reset,
				message[
					'You are in a clearing, with a forest surrounding you on all sides. A path leads south.'
				]
			);
			print(message['There is an open grating, descending into darkness.']);

			this.answer = (
				await input(message['What do you do? '])
			).toLocaleLowerCase();

			if (history[this.answer]) {
				line(FgYellow);
				print(history[this.answer]);
			}
		}

		const confirm = await input(message['Do you want to continue? (Y/N) ']);

		if (ConfirmOptions.includes(confirm)) {
			clear();
			await this.partI();
		} else {
			process.exit();
		}
	}
}

export default async () => {
	await new Zork().start();
};
