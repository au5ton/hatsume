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
			// Optionally respond with multiple things at once
			for(let i in processed.responses) {
				context.reply(processed.responses[i].text, processed.responses[i].options);
				
				// Notify channel
				if(processed.responses[i].channelPayload !== undefined) {
					bot.telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID, processed.responses[i].channelPayload, processed.responses[i].options)
				}
			}
			
			// You can only send it to one state at a time
			if(processed.nextState !== null) {
				database.users.setState(context.update.message.from.id,processed.nextState).catch(err => console.error(err));
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
	let job = new CronJob('*/20 * * * *', () => {
		
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

	// Query DB every 4 seconds (I'd like to make this shorter, but I'd like to keep no more than one instance running at once)
	let composition_checker = setInterval(() => {
		console.log('doin the thing')
		// React to new compositions
		database.requests.getMultiple('done_composing', false)
		.then(requests => {
			//Keep track of how many each user has, so when one is resolved elsewhere, we can react appropriately here
			//First, we want to count how many the user has for this run
			let users = new Set()
			for(let i in requests) {
				//If the user is defined, increment
				if(persistent[requests[i]['telegram_id']]) {
					persistent[requests[i]['telegram_id']].temp_count += 1
				}
				else {
					persistent[requests[i]['telegram_id']] = compose_default()
				}
				users.add(requests[i]['telegram_id'])
			}
			//console.log(requests)
			console.log(persistent)


			/**
			 * When to send a new message out:
			 * - When the amount of requests being composed changes
			 * EXCEPT WHEN:
			 * - count goes from 1 to 0 (completing all compositions)
			 * - count goes from positive int to positive int (adding additional requests before you've completed the current set, theoretically impossible but let's write good code)
			 */


			// Something in this block causes an infinite loop that breaks this code and I'm way too tired to even come close to diagnosing it
			// Something in this block causes an infinite loop that breaks this code and I'm way too tired to even come close to diagnosing it
			// Something in this block causes an infinite loop that breaks this code and I'm way too tired to even come close to diagnosing it
			// Something in this block causes an infinite loop that breaks this code and I'm way too tired to even come close to diagnosing it
			// Something in this block causes an infinite loop that breaks this code and I'm way too tired to even come close to diagnosing it
			for(let item of users) {
				let last = persistent[item].last_composing_count;
				let now = persistent[item].temp_count;
				let delta = now - last;
				// When the composition count has changed
				if(delta != 0) {
					// Amount of requests has changed: delta > 0 when more, delta < 0 when less
					// Set currently_composing to oldest request (`requests` is always sorted ascending)

					if(last === 1 && now === 0) {
						// Completed the last composition
						//TODO update chat_state to 3
					}
					else if(last > 0 && now > 0) {
						// This shouldn't happen
					}
					else {
						for(let i in requests) {
							if(request[i]['telegram_id'] === item) {
								persistent[item].currently_composing = request[i]
								
								// Interact with the user
								bot.telegram.sendMessage(request[i]['telegram_id'],generateTVCompositionMessage(request[i]),{
									parse_mode: 'html',
									disable_web_page_preview: false,
									reply_markup: generateInlineKeyboardMarkup(request[i])
								})
								.then(info => {
									console.log(info)
								})

								break;
							}
						}
					}
				}
				else if(delta === 0) {
					// No change
				}
			}
			console.log(users)

			// Now we save the value and reset the counter for next time this is called
			for(let item of users) {
				console.log('reset counter??')
				persistent[item].last_composing_count = persistent[item].temp_count;
				persistent[item].temp_count = 0;
			}

			// Now, we've squared everything away with regards to updating the references we're about to work with
			//If a change was made, then we should send another message asking for the next one, no?
		})
		.catch(err => {
			if(err === 'error/requests.getmulitple: results array empty') {
				// nothing out of the ordinary
			}
			else {
				// ok, what fucked up?
			}
		})
	},4000)
});

function generateTVCompositionMessage(request) {
	const empty_char = '&#8203;'
	const television = '📺';
	
	// just like: https://github.com/au5ton/Roboruri/blob/f032f6afad9dcb2b381ac9a4f5ee155c09d17daf/roboruri/bot_util.js#L394-L443
	let message = '';
	if(request['image'] && request['image'].startsWith('http')) {
		message += '\n<a href=\"'+request['image']+'\">'+empty_char+'</a>';
	}
	message += television + ' <b>' + request['content_name'] + '</b>\n';
	message += 'Please tap to check which seasons you\'re interested in. When you\'ve picked all that are applicable, press Done.';
	return message
}
// [[{text: 'specials', data: 'specials'}]]
function generateInlineKeyboardMarkup(request) {
	let keyboard = []
	let seasons = request['available_seasons'];
	let wanted = request['desired_seasons'];
	for(let i in seasons) {
		let n = (season[i] < 10 ? 'S0'+season[i] : 'S'+season[i]); // make it 2 characters long for style
		if(season[i] === 0) {
			keyboard.push({
				text: (wanted.includes(season[i]) ? 'Specials ☑️' : 'Specials ⬜️'),
				data: season[i]
			})
		}
		else {
			keyboard.push({
				// S01 ☑️
				// S01 ⬜️
				text: (wanted.includes(season[i]) ? n+' ☑️' : n+' ⬜️'),
				data: season[i]
			})
		}
	}
	keyboard.push({
		text: 'All',
		data: 'all'
	})
	keyboard.push({
		text: 'Done',
		data: 'done'
	})
	return [keyboard];
}
function compose_default() {
	return {
		last_composing_count: 0,
		temp_count: 0,
		currently_composing: null, // Request object
		change_made: false
	}
}
// In-memory caching of user whereabouts
var persistent = {
	'0': compose_default() //durov
};
//  '{chat_id}/{message_id}' => request_id
var message_to_request = new Map()

bot.on('update', (context) => {
	if(context.update.callback_query) {
		//React to user composition choices
	}
})