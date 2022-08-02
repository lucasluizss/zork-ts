#!/usr/bin/env node

/**
 * ZORK I: The Great Underground Empire
 * Copyright (c) 1981, 1982, 1983 Infocom, Inc. All rights reserved.
 * ZORK is a registered trademark of Infocom, Inc.
 * Revision 88 / Serial number 840726
 * Source at: https://web.mit.edu/marleigh/www/portfolio/Files/zork/transcript.html
 */

import 'dotenv/config';
import fs from 'node:fs';
import { Markup, session, Telegraf, Telegram } from 'telegraf';
import { Message } from 'typegram/message';

import { Part } from './models/Part';
import { ZorkContext } from './models/ZorkContext';
import { TranslationData } from './models/TranslationData';
import similarityService from './services/similarity.service';

const token = process.env.BOT_TOKEN as string;
const mapURI = process.env.MAP_URI as string;
const chatId = process.env.CHAT_ID as string;
const homePageURL = process.env.HOME_PAGE as string;
const userMaximumAttempts = Number(process.env.USER_MAXIMUM_ATTEMPTS) ?? 10;

class Main {
	private userAttempts: number;
	private telegram: Telegram;
	private bot: Telegraf<ZorkContext>;

	private iterator = this.chaptersGenerator();
	private iteratorTemp = this.chaptersGenerator();

	public initialize(): void {
		try {
			this.createInstances();
			this.initializeSession();
			this.startBot();
			this.observableActions();
			this.usefulCommands();
			this.userInput();
			this.launchBot();
			this.listeners();
		} catch (error) {
			this.sendErrorMessage(error);
		}
	}

	private createInstances(): void {
		this.resetUserAttempts();
		this.telegram = new Telegram(token);
		this.bot = new Telegraf<ZorkContext>(token);
	}

	private increaseUserAttempts(): void {
		this.userAttempts++;
	}

	private resetUserAttempts(): void {
		this.userAttempts = 0;
	}

	private get remainingUserAttempts(): number {
		return userMaximumAttempts - this.userAttempts;
	}

	private get maximumAttemptsReachedByTheUser(): boolean {
		return this.userAttempts >= userMaximumAttempts;
	}

	private initializeSession(): void {
		this.bot.use(session());
	}

	private startBot(): void {
		this.bot.start(ctx => {
			this.languageSelection(ctx).catch(error => this.sendErrorMessage(error));
		});
	}

	private async languageSelection(ctx: ZorkContext): Promise<Message.TextMessage> {
		return await ctx.reply(
			`Hi, ${ctx?.from?.first_name}!
			\n🎈 Welcome to Zork - The Unofficial TypeScript Version. 🎈
			\nPlease select your language.\n(For available commands press /help)`,
			Markup.keyboard(['🇧🇷 PT-BR', '🇺🇸 EN-US']).oneTime(true).resize()
		);
	}

	private observableActions(): void {
		this.bot.hears('🇧🇷 PT-BR', ctx => this.changeLanguage(ctx, 'pt'));
		this.bot.hears('🇺🇸 EN-US', ctx => this.changeLanguage(ctx, 'en'));
		this.bot.hears('Play Again', ctx => this.restart(ctx));
	}

	private changeLanguage(ctx: ZorkContext, language: string): void {
		const translation = this.getTranslation(language);
		const currentChapter = ctx?.session?.currentChapter ?? Part.I;
		ctx.session = { answer: '', currentChapter, translation, language };
		this.currentChapter(ctx);
	}

	private getTranslation(language: string): TranslationData {
		const translationFilePath = `${process.cwd()}/src/assets/lang/zork-${language}.json`;
		const translationJSON = fs.readFileSync(translationFilePath, {
			encoding: 'utf-8',
		});
		return JSON.parse(translationJSON);
	}

	private nextChapter(ctx: ZorkContext): void {
		const { done, value: currentPart } = this.iterator.next();

		if (!done) {
			ctx.session.currentChapter = currentPart as Part;
			this.currentChapter(ctx);
		} else {
			this.gameCompleted(ctx);
		}
	}

	private currentChapter(ctx: ZorkContext): void {
		ctx.reply(ctx.session.translation.message[ctx.session.currentChapter]);
		setTimeout(() => ctx.reply(ctx.session.translation.message['What do you do? ']), 500);
	}

	private gameCompleted(ctx: ZorkContext, message?: string): void {
		ctx.replyWithPhoto(mapURI);
		ctx.reply(
			message ?? 'Game completed!',
			Markup.keyboard([['Play Again']])
				.oneTime()
				.resize()
		);
	}

	private *chaptersGenerator(): Generator<Part, void, undefined> {
		yield* [Part.I, Part.II, Part.III, Part.IV, Part.V];
	}

	private usefulCommands(): void {
		this.bot.help(ctx => {
			ctx.reply('Send /start to start the game');
			ctx.reply('Send /restart to restart the game');
			ctx.reply('Send /language select a new idiom');
			ctx.reply('Send /chapter to get the current chapter description');
			ctx.reply('Send /info to get info about the game');
		});

		this.bot.command('restart', ctx => this.restart(ctx));

		this.bot.command('language', ctx => this.languageSelection(ctx));

		this.bot.command('chapter', ctx => this.currentChapter(ctx));

		this.bot.command('info', ctx => {
			ctx.reply(`Hi, ${ctx.from.first_name}! Here are some important infos.`, {
				reply_markup: {
					inline_keyboard: [[{ text: 'How to contribute', url: homePageURL }]],
				},
			});
		});
	}

	private restart(ctx: ZorkContext): void {
		this.iterator = this.iteratorTemp;
		this.currentChapter(ctx);
	}

	private userInput(): void {
		this.bot.on('text', ctx => {
			this.increaseUserAttempts();
			const answer = this.parseUserInput(ctx.message.text);

			const correctInteration =
				ctx.session.translation.interactions[ctx.session.currentChapter][answer];

			if (this.correctAnswer(ctx, answer)) {
				this.resetUserAttempts();
				this.nextChapter(ctx);
			} else if (correctInteration) {
				ctx.reply(correctInteration);

				if (this.isLastChapter(ctx)) {
					this.gameCompleted(ctx, correctInteration);
				}
			} else {
				this.incorrectAnswer(ctx, answer);

				if (this.isLastChapter(ctx) && this.maximumAttemptsReachedByTheUser) {
					this.gameCompleted(ctx, ctx.session.translation.message['Game Over']);
				}
			}
		});
	}

	private incorrectAnswer(ctx: ZorkContext, incorrectAnswer: string): void {
		const [correctAnswer] =
			ctx.session.translation.availableAnswers[ctx.session.currentChapter];

		const percent = (
			similarityService.calculate(correctAnswer, incorrectAnswer) * 100
		).toFixed(2);

		ctx.reply(
			ctx.session.translation.message['Try again']
				.replace('#percent', percent)
				.replace('#attempts', this.remainingUserAttempts)
		);
	}

	private isLastChapter(ctx: ZorkContext): boolean {
		return ctx.session.currentChapter === Part.V;
	}

	private parseUserInput(text: string): string {
		return text
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-zA-Z ]/g, '')
			.toLowerCase()
			.trim();
	}

	private launchBot(): void {
		this.bot.launch();
	}

	private correctAnswer(ctx: ZorkContext, answer: string): boolean {
		return ctx.session.translation.availableAnswers[ctx.session.currentChapter].includes(
			answer
		);
	}

	private sendErrorMessage(error: any): void {
		console.log(error);

		if (chatId) {
			this.telegram.sendMessage(chatId, JSON.stringify(error));
		}
	}

	private listeners(): void {
		process.once('SIGINT', () => this.bot.stop('SIGINT'));
		process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
	}
}

new Main().initialize();
