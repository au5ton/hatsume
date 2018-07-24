require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const prettyMs = require('pretty-ms');
const VERSION = require('./package').version;

const START_TIME = new Date();
var BOT_USERNAME;

// Custom modules
const bot_util = require('./lib/bot_util');
const database = require('./lib/database');
const User = require('./lib/classes/User');
const Request = require('./lib/classes/Request');

// Create a bot that uses 'polling' to fetch new updates
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

process.on('unhandledRejection', r => logger.error('unhandledRejection: ',r.stack,'\n',r));

// Basic commands
bot.hears(new RegExp('\/start|\/start@' + BOT_USERNAME), (context) => {
	context.getChat().then((chat) => {
		if(chat.type === 'private') {

			// Give introduction and help with commands
			context.reply('Hello', {
		  	  disable_web_page_preview: true
			});
		}
	}).catch((err) => {
		//
	});
});

bot.hears(new RegExp('\/ping|\/ping@' + BOT_USERNAME), (context) => {
	context.reply('pong');
});
bot.hears(new RegExp('\/uptime|\/uptime@' + BOT_USERNAME), (context) => {
	context.reply(''+prettyMs(new Date() - START_TIME));
});

bot.hears(new RegExp('\/enroll|\/enroll@' + BOT_USERNAME), (context) => {
	database.users.checkFor('telegram_id', context.update.message.from.id).then(info => {
		if(info === 'found') {
			database.users.get('telegram_id', context.update.message.from.id).then(myUser => {
				if(myUser.plex_username === null) {
					if(myUser.chat_state === 0) {
						database.users.setState(myUser.telegram_id, 1).then(info => {
							context.reply('Please send your Plex.tv username (or email if you don\'t have one).');
						}).catch(err => logger.error(err));
					}
					else {
						context.reply('Please send your Plex.tv username (or email if you don\'t have one).');
					}
				}
				else {
					context.reply('You\'re already enrolled.');
				}
			}).catch(err => logger.error(err));;
		}
		else {
			database.users.init(context.update.message.from.id, context.update.message.from.first_name, context.update.message.from.username).then(info => {
				if(info === 'already added') {
					context.reply('You\'re already enrolled.');
				}
				else {
					context.reply('Please send your Plex.tv username (or email if you don\'t have one).');
				}
			});
		}
	});
});

bot.hears(new RegExp('\/unsubscribe|\/unsubscribe@' + BOT_USERNAME), (context) => {
	database.users.remove('telegram_id', context.update.message.from.id).then(info => {
		context.reply('You\'ve been removed from the database. Next time we talk it\'ll be like the first time we spoke.');
	}).catch(err => {
		//
	});
});

bot.on('message', (context) => {
	database.users.getState(context.update.message.from.id).then(chat_state => {
		bot_util.processMessage(context.update.message, chat_state).then((processed) => {
			context.reply(processed.response);
			if(processed.nextState !== null) {
				database.users.setState(context.update.message.from.id,processed.nextState).catch(err => logger.error(err));
			}
		}).catch(err => logger.error(err));
	}).catch(err => {
		logger.log('message err')
	});
})

logger.log('Bot active. Performing startup checks.');

logger.warn('Is our Telegram token valid?');
bot.telegram.getMe().then((r) => {
	//doesn't matter who we are, we're good
	logger.success('Telegram token valid for @',r.username);
	BOT_USERNAME = r.username;
	bot.startPolling();
}).catch((r) => {
	logger.error('Telegram bot failed to start polling:\n',r);
	process.exit();
});