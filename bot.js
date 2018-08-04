require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
require('au5ton-logger')();
const prettyMs = require('pretty-ms');
const VERSION = require('./package').version;
const CronJob = require('cron').CronJob;
const fetch = require('node-fetch')
const querystring = require('querystring')

const START_TIME = new Date();
var BOT_USERNAME;

// Custom modules
const bot_util = require('./lib/bot_util');
const database = require('./lib/database');
const imdb = require('./lib/content');
const plexmediaserver = require('./lib/plex');
const notify = require('./lib/notify');
const User = require('./lib/classes/User');
const Request = require('./lib/classes/Request');

// Create a bot that uses 'polling' to fetch new updates
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
var job = null;

process.on('unhandledRejection', r => console.error('unhandledRejection: ',r.stack,'\n',r));

// Basic commands
bot.hears(new RegExp('\/start|\/start@' + BOT_USERNAME), (context) => {
	context.getChat().then((chat) => {
		if(chat.type === 'private') {

			// Give introduction and help with commands
			context.reply('Hello, I am Hastume. \n'
			+'If you want to make a request for something to be added to Plex, you\'ve come to the right place. '
			+'First things first, I need to verify that you actually have access to it already. '
			+'To start this process, use the /enroll command. '
			+'Once you\'re enrolled, you\'ll be able to make requests with the /makerequest command. '
			+'During any of these operations, you can use the /cancel command to stop and do something else.');
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
						}).catch(err => console.error(err));
					}
					else {
						context.reply('Please send your Plex.tv username (or email if you don\'t have one).');
					}
				}
				else {
					context.reply('You\'re already enrolled.');
				}
			}).catch(err => console.error(err));;
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
			context.reply(processed.response, processed.responseOptions);
			if(processed.nextState !== null) {
				database.users.setState(context.update.message.from.id,processed.nextState).catch(err => console.error(err));
			}

			// Notify channel
			if(processed.pushChannel === true) {
				bot.telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID, processed.channelPayload, processed.responseOptions)
			}

		}).catch(err => console.error(err));
	}).catch(err => {
		//console.error('bot.on(message) failed for some weird reason: ',err)
	});
})

console.log('Bot active. Performing startup checks.');
let promises = [];

promises.push(new Promise((resolve, reject) => {
	console.ind().warn('Is our Telegram token valid?');
	bot.telegram.getMe().then((r) => {
		//doesn't matter who we are, we're good
		console.ind().success('Telegram token valid for @',r.username);
		resolve('passed');
		BOT_USERNAME = r.username;
		bot.startPolling();
	}).catch((r) => {
		resolve('failed')
	});
}));

promises.push(new Promise((resolve, reject) => {
	console.ind().warn('Is our database connection good?');
	database.users.get('telegram_handle','durov').then(user => {
		console.ind().success('Database connection good');
		resolve('passed')
	}).catch(err => {
		console.ind().error('Database connection failed: \n', err)
		resolve('failed')
	})
}))

promises.push(new Promise((resolve, reject) => {
	console.ind().warn('Is our OMDb connection good?');
	imdb.testIMDBConnection().then(tuple => {
		if(tuple.status === 'good') {
			console.ind().success('OMDb connection good.');
			resolve('passed')
		}
		else {
			console.ind().error('OMDb connection failed: \n', tuple.err)
			resolve('failed')
		}
	})
}))

promises.push(new Promise((resolve, reject) => {
	console.ind().warn('Is our TheTVDB connection good?');
	imdb.testTVDBConnection().then(tuple => {
		if(tuple.status === 'good') {
			console.ind().success('TheTVDB connection good.');
			resolve('passed')
		}
		else {
			console.ind().error('TheTVDB connection failed: \n', tuple.err)
			resolve('failed')
		}
	})
}))

promises.push(new Promise((resolve, reject) => {
	console.ind().warn('Is our Plex connection good?');
	plexmediaserver.testConnection().then(tuple => {
		if(tuple.status === 'good') {
			console.ind().success('Plex connection good.');
			resolve('passed')
		}
		else {
			console.ind().error('Plex connection failed: \n', tuple.err)
			resolve('failed')
		}
	})
}))

promises.push(new Promise((resolve, reject) => {
	console.ind().warn('Is our themoviedb.org connection good?')
	// Test with "Finding Nemo" (example from TMDb API)
	fetch('https://api.themoviedb.org/3/find/tt0266543?'+querystring.encode({
		api_key: process.env.THEMOVIEDB_API_KEY,
		external_source: 'imdb_id'
	}))
	.then(res => {
		if(res.status === 200) {
			console.ind().success('TMDb connection good.')
			resolve('passed')
		}
		else {
			console.ind().error('TMDb connection failed.')
			resolve('failed')
		}
	})
}))

Promise.all(promises).then(results => {
	let checks_passed = 0;
	for(let i in results) {
		if(results[i] === 'passed') {
			checks_passed++;
		}
	}
	if(results.length - checks_passed > 0) {
		console.warn(checks_passed+'/'+results.length+' tests passed.')
		console.warn('Exiting...');
		process.exit()
	}
	else {
		console.success(checks_passed+'/'+results.length+' tests passed.')
	}

	// Safe to check
	// Check for satisfied requests every 20 minutes
	// */20 * * * *
	job = new CronJob('*/20 * * * *', () => {
		
		// calculate filled requests
		notify.filledRequests().then(filled => {
			for(let i in filled) {
				bot.telegram.sendMessage(filled[i]['telegram_id'], '⚡️ <b>'+filled[i]['content_name']+(filled[i]['start_year'] === null ? '':' ('+filled[i]['start_year']+')')+' has been added!</b> (＾▽＾)', {
					parse_mode: 'html',
					disable_web_page_preview: true
				})
			}
			for(let i in filled) {
				database.requests.removeOneByIds(filled[i]['telegram_id'], 'content_name', filled[i]['content_name']).then(info => {
					console.log('Removed '+filled[i]['telegram_id']+'/'+filled[i]['content_name']+' from the database')
				})
				.catch(err => {
					console.log('Failed to remove '+filled[i]['telegram_id']+'/'+filled[i]['content_name']+' from the database')
				})
			}
		})
		

	}, notify.stop, true, 'America/Chicago');

	

});