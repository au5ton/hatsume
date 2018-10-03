// test.js

require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
require('au5ton-logger')();
const PlexAPI = require('plex-api');
const os = require('os')

// Create a bot that uses 'polling' to fetch new updates
//const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

process.on('unhandledRejection', r => console.error('unhandledRejection: ',r.stack,'\n',r));


// Custom modules
const database = require('./lib/database');
const content = require('./lib/content');
const plex = require('./lib/plex');
const notify = require('./lib/notify');
const User = require('./lib/classes/User');
const Request = require('./lib/classes/Request');

const app_options = {
    identifier: 'com.github.au5ton.hatsume',
    product: 'hatsume/Node.js',
    version: '1.0',
    deviceName: 'Node.js',
    platform: 'Node.js',
    platformVersion: process.version,
    device: os.platform()
};

let pms = new PlexAPI({
    hostname: process.env.PMS_HOSTNAME,
    port: process.env.PMS_PORT,
    username: process.env.PMS_USERNAME,
    password: process.env.PMS_PASSWORD,
    options: app_options
});

// lookup movie by imdb id

// plex.getAllLocalMovies().then(movies => {
//     console.table(movies)
// })

// plex.getAllLocalTVShows().then(shows => {
//     console.table(shows)
// })

// const _IMDB = require('imdb-api');
// const imdb = new _IMDB.Client({apiKey: process.env.OMDB_API_KEY});
// const _TVDB = require('node-tvdb');
// const tvdb = new _TVDB(process.env.THETVDB_API_KEY);
// const compare = require('string-similarity').compareTwoStrings;

// tvdb.getSeriesByImdbId('tt5249462').then(response => {
//     console.log(response)
// }).catch(err => {
//     console.log(err.response)
// })

// let query = async (key) => {
// 	return await pms.query(key)
// };
// (async function(){
// 	let response = await query('/library/sections')
// 	//console.log(response.MediaContainer.Directory)
// 	let sections = response.MediaContainer.Directory;
// 	//console.log(sections)
// 	for(let i in sections) {
// 		if(sections[i]['type'] === 'show') {
// 			let all_shows = await query('/library/sections/'+sections[i]['key']+'/all')

// 			console.log(all_shows)

			// pms.query().then(response => {

			// 	pms.query(response.MediaContainer.Metadata[0].key).then(response => {
			// 		console.log(response.MediaContainer)
			// 	})
			//     //console.log(response)

			//     let shows = response.MediaContainer.Metadata;
			//     console.log(shows[0])
			//     //console.log(shows[1])
			//     // for(let i in shows) {
			//     //     tvdb.getSeriesByName(shows[i]['title']).then(tvdb_entry => {
			//     //         let dice = compare(shows[i]['title'],tvdb_entry[0].seriesName)
			//     //         if(dice < 1) {
			//     //             console.warn(shows[i]['title']+' <=[ '+dice+' ]=> '+tvdb_entry[0].seriesName)
			//     //         }
			//     //         else {
			//     //             console.log(shows[i]['title']+' <=[ '+dice+' ]=> '+tvdb_entry[0].seriesName)
			//     //         }
			//     //     }).catch(err => {
			//     //         if(err.response.status === 404) {
			//     //             console.warn(shows[i]['title']+' 404')
			//     //         }
			//     //         else {
			//     //             console.error(err)
			//     //         }
			//     //     })
			//     // }

			// }).catch(err => {
			//     console.error(err)
			// })
// 		}
// 	}
// })();



// Erased (2016) anime: tt5249462
// Erased (2017) live-action: tt7573686
// Spider-Man (1967): tt0061301
// Spider-Man (1994): tt0112175

// imdb.get({id: 'tt5249462'}).then(response => {
//     console.log(response['title'] + ' ' + response['start_year'])
//     tvdb.getSeriesByImdbId(response['imdbid']).then(response => {
//         console.log(response)
//     }).catch(err => {
//         console.log(err.response)
//     })

//     //console.log(response)
// })

// content.getTVDBIdFromUrl('https://www.thetvdb.com/series/boku-no-pico').then(id => {
//     console.log(id)
// }).catch(err => {
//     console.error(err)
// })

// function generateInlineKeyboardMarkup(request) {
// 	let keyboard = []
// 	let seasons = request['available_seasons'];
// 	let wanted = request['desired_seasons'];
// 	for(let i in seasons) {
// 		let n = (seasons[i] < 10 ? 'S0'+seasons[i] : 'S'+seasons[i]); // make it 2 characters long for style
// 		if(seasons[i] === 0) {
// 			keyboard.push({
// 				text: (wanted.includes(seasons[i]) ? 'Specials ☑️' : 'Specials ⬜️'),
// 				callback_data: seasons[i]+''
// 			})
// 		}
// 		else {
// 			keyboard.push({
// 				// S01 ☑️
// 				// S01 ⬜️
// 				text: (wanted.includes(seasons[i]) ? n+' ☑️' : n+' ⬜️'),
// 				callback_data: seasons[i]+''
// 			})
// 		}
// 	}
// 	keyboard.push({
// 		text: 'All',
// 		callback_data: 'all'
// 	})
// 	keyboard.push({
// 		text: 'Done',
// 		callback_data: 'done'
// 	})
// 	return [keyboard];
// }

// database.requests.getMultiple('request_id',60).then(r => {
//     console.log(generateInlineKeyboardMarkup(r[0]))
// })

notify.filledRequests().then(filled => {
	console.log(filled)
	for(let i in filled) {
		// Of all the desired seasons, keep all the seasons that are NOT downloaded (remove those that ARE downloaded)
		let remaining_seasons = filled[i]['desired_seasons'].filter((element) => {
			return !filled[i]['downloaded_seasons'].includes(element)
		})
		console.log('remaining:',remaining_seasons)
	}
    process.exit()
})



// (async function(){
// 	console.log(await database.requests.getMultiple('done_composing', true))
// })()
