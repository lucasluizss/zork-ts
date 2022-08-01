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

import { Part } from './models/Part';
import { ZorkContext } from './models/ZorkContext';

const token = process.env.BOT_TOKEN as string;
const mapURI = process.env.MAP_URI as string;
const chatId = process.env.CHAT_ID as string;
const homePageURL = process.env.HOME_PAGE as string;

class Main {
	private telegram: Telegram;
	private bot: Telegraf<ZorkContext>;

	private iterator = this.chaptersGenerator();
	private iteratorTemp = this.chaptersGenerator();

	public initialize() {
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

	private createInstances() {
		this.telegram = new Telegram(token);
		this.bot = new Telegraf<ZorkContext>(token);
	}

	private initializeSession() {
		this.bot.use(session());
	}

	private startBot() {
		this.bot.start(ctx =>
			this.languageSelection(ctx)
				.then(() => this.greetings(ctx))
				.catch(error => this.sendErrorMessage(error))
		);
	}

	private async languageSelection(ctx: ZorkContext) {
		return await ctx.reply(
			`Hi, ${ctx?.from?.first_name}! Please select your language.\n(For available commands press /help)`,
			Markup.keyboard(['🇧🇷 PT-BR', '🇺🇸 EN-US']).oneTime().resize()
		);
	}

	private observableActions() {
		this.bot.hears('🇧🇷 PT-BR', ctx => this.changeLanguage(ctx, 'pt'));
		this.bot.hears('🇺🇸 EN-US', ctx => this.changeLanguage(ctx, 'en'));
		this.bot.hears('Play Again', ctx => this.greetings(ctx));
	}

	private changeLanguage(ctx: ZorkContext, language: string) {
		const translation = this.getTranslation(language);
		const currentChapter = ctx?.session?.currentChapter ?? Part.I;
		ctx.session = { answer: '', currentChapter, translation, language };
		this.currentChapter(ctx);
	}

	private greetings(ctx: ZorkContext) {
		ctx.reply(
			ctx.session.translation.message[
				'Welcome to Zork - The Unofficial TypeScript Version.'
			]
		);
	}

	private getTranslation(language: string) {
		const translationFilePath = `${process.cwd()}/src/assets/lang/zork-${language}.json`;
		const translationJSON = fs.readFileSync(translationFilePath, {
			encoding: 'utf-8',
		});
		return JSON.parse(translationJSON);
	}

	private nextChapter(ctx: ZorkContext) {
		const { done, value: currentPart } = this.iterator.next();

		if (!done) {
			ctx.session.currentChapter = currentPart as Part;
			this.currentChapter(ctx);
		} else {
			this.gameCompleted(ctx);
		}
	}

	private currentChapter(ctx: ZorkContext) {
		ctx.reply(ctx.session.translation.message[ctx.session.currentChapter]);
		setTimeout(() => ctx.reply(ctx.session.translation.message['What do you do? ']), 500);
	}

	private gameCompleted(ctx: ZorkContext) {
		ctx.replyWithPhoto(mapURI);
		ctx.reply(
			'Game completed',
			Markup.keyboard([['Play Again']])
				.oneTime()
				.resize()
		);
	}

	private *chaptersGenerator() {
		yield* [Part.I, Part.II, Part.III, Part.IV, Part.V];
	}

	private usefulCommands() {
		this.bot.help(ctx => {
			ctx.reply('Send /start to start the game');
			ctx.reply('Send /restart to restart the game');
			ctx.reply('Send /language select a new idiom');
			ctx.reply('Send /chapter to get the current chapter description');
			ctx.reply('Send /info to get info about the game');
		});

		this.bot.command('restart', ctx => {
			this.iterator = this.iteratorTemp;
			this.greetings(ctx);
		});

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

	private userInput() {
		this.bot.on('text', ctx => {
			const answer = this.parseUserInput(ctx.message.text);

			const correctInteration =
				ctx.session.translation.interactions[ctx.session.currentChapter][answer];

			if (this.correctAnswer(ctx, answer)) {
				this.nextChapter(ctx);
			} else if (correctInteration) {
				ctx.reply(correctInteration);

				if (this.isLastChapter(ctx)) {
					this.gameCompleted(ctx);
				}
			} else {
				ctx.reply(
					ctx.session.translation.message[
						"Keep trying, your answer still doesn't fit the story..."
					]
				);
			}
		});
	}

	private isLastChapter(ctx: ZorkContext) {
		return ctx.session.currentChapter === Part.V;
	}

	private parseUserInput(text: string) {
		return text
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-zA-Z ]/g, '')
			.toLowerCase()
			.trim();
	}

	private launchBot() {
		this.bot.launch();
	}

	private correctAnswer(ctx: ZorkContext, answer: string) {
		return ctx.session.translation.availableAnswers[ctx.session.currentChapter].includes(
			answer
		);
	}

	private sendErrorMessage(error: any) {
		console.log(error);

		if (chatId) {
			this.telegram.sendMessage(chatId, JSON.stringify(error));
		}
	}

	private listeners() {
		process.once('SIGINT', () => this.bot.stop('SIGINT'));
		process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
	}
}

new Main().initialize();
