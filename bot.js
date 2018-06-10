require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const prettyMs = require('pretty-ms');
const VERSION = require('./package').version;

const START_TIME = new Date();
var BOT_USERNAME;

// Custom modules
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
	database.users.init(context.update.message.from.id, context.update.message.from.first_name, context.update.message.from.username).then(info => {
		if(info === 'already added') {
			context.reply('You\'re already enrolled.');
		}
		else {
			context.reply('You\'ve been added to the database.');
		}
	});
});

bot.hears(new RegExp('\/one|\/one@' + BOT_USERNAME), (context) => {
	database.users.setState(context.update.message.from.id, 1).then(info => {
		context.reply('state set to one');
	}).catch(err => {
		//
	});
});
bot.hears(new RegExp('\/two|\/two@' + BOT_USERNAME), (context) => {
	database.users.setState(context.update.message.from.id, 2).then(info => {
		context.reply('state set to two');
	}).catch(err => {
		//
	});
});

bot.on('message', (context) => {
	// do something
	// context.update.message
});

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