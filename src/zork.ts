import {
	Reset,
	BgMagenta,
	FgWhite,
	DeadOptions,
	ConfirmOptions,
	DeadMessage,
} from './system/constants';
import { Part } from './system/part';
import {
	print,
	printLine,
	alert,
	success,
	input,
	line,
	clear,
	danger,
} from './system/console';

const [, , lang] = process.argv;
const translation = require(`./assets/lang/zork-${lang ?? 'en'}.json`);
const { interactions, message, availableAnswers } = translation;

class Zork {
	private answer: string;
	private chapters = new Array(Part.I, Part.II, Part.III, Part.IV, Part.V);

	constructor() {
		this.showGreetings();
	}

	private showGreetings() {
		line(BgMagenta, FgWhite);
		print(message['Welcome to Zork - The Unofficial TypeScript Version.']);
		line();
		print(Reset);
	}

	private clearAnswer = () => (this.answer = null);

	private correctAnswer = (chapter: Part) =>
		availableAnswers[chapter].includes(this.answer);

	private async askToLeave() {
		const confirm = await input(message['Do you want to continue? (Y/N) ']);

		if (ConfirmOptions.includes(confirm)) {
			clear();
			await this.play();
		} else {
			process.exit();
		}
	}

	public async play() {
		for (let currentPart of this.chapters) {
			let isDead: boolean;

			while (!this.correctAnswer(currentPart)) {
				printLine(message[currentPart]);
				// TODO: Show a tip after trying a couple of times (count/if)

				this.answer = (await input(message['What do you do? '])).toLocaleLowerCase();

				isDead = DeadOptions.includes(this.answer);

				if (isDead) {
					danger(message[DeadMessage]);
					await this.askToLeave();
				}

				if (interactions[currentPart][this.answer]) {
					success(interactions[currentPart][this.answer]);
				} else if (!this.correctAnswer(currentPart)) {
					alert(message["Keep trying, your answer still doesn't fit the story..."]);
				}
			}

			this.clearAnswer();
		}

		await this.askToLeave();
	}
}

export default async () => {
	try {
		await new Zork().play();
	} catch (error) {
		danger(error);
	}
};
