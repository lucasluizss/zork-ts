class ConfigurationService {
	public get token(): string {
		return process.env.BOT_TOKEN as string;
	}

	public get mapURI(): string {
		return process.env.MAP_URI as string;
	}

	public get chatId(): string {
		return process.env.CHAT_ID as string;
	}

	public get homePageURL(): string {
		return process.env.HOME_PAGE as string;
	}

	public get userMaximumAttempts(): number {
		return parseInt(process.env.USER_MAXIMUM_ATTEMPTS ?? '5') ?? 5;
	}
}

export default new ConfigurationService();
