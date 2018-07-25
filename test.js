// test.js

require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);

// Create a bot that uses 'polling' to fetch new updates
//const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

process.on('unhandledRejection', r => logger.error('unhandledRejection: ',r.stack,'\n',r));


// Custom modules
const database = require('./lib/database');
const content = require('./lib/content');
const User = require('./lib/classes/User');
const Request = require('./lib/classes/Request');

// content.getContentInfoFromIMDBId('tt2250912').then(request => {
//     logger.log(request)
//     logger.log(request instanceof Request)
// });

// const mysql = require('mysql');
// var pool = mysql.createPool({
//     connectionLimit: 10,
//     host: process.env.MARIADB_HOST,
//     user: process.env.MARIADB_USER,
//     password: process.env.MARIADB_PASS,
//     database: process.env.MARIADB_DB
// });

// var knex = require('knex')({
//     client: 'mysql',
//     connection: {
//         host : process.env.MARIADB_HOST,
//         user : process.env.MARIADB_USER,
//         password : process.env.MARIADB_PASS,
//         database : process.env.MARIADB_DB
//     },
//     pool: { min: 0, max: 8}
// });

// Getting all users (knex)
// pool.query(knex('users').select('*').toString(), (error, results, fields) => {
//     if (error) throw error;
//     logger.log(results);
// });

// Inserting a new user
// pool.query(knex('users').insert({
//     telegram_id: 2, // or new Date().valueOf()
//     telegram_name: 'John Appleseed',
//     telegram_handle: 'appleseed',
//     plex_username: 'appleseed',
//     accepted_agreement: 0
// }).toString(), (error, results, fields) => {
//     logger.log(results);
// });

// Deleting a user
// pool.query(knex('users').where('telegram_id', 2).del().toString(), (error, results, fields) => {
//     logger.log(results);
// });

// Updating a user
// pool.query(knex('users').where('telegram_id', 2).update({
//     accepted_agreement: true
// }).toString(), (error, results, fields) => {
//     logger.log(results);
// });



// Creating a new user
//INSERT INTO users (telegram_id, telegram_name, telegram_handle, plex_username, accepted_agreement) VALUES(0, 'Pavel Durov', 'durov', 'durov@telegram.org', True)


// bot.on('message', (context) => {
// 	// do something
// 	// context.update.message
// });

// database.users.get('telegram_id',0).then((results) => {
//     logger.log(results);
// }).catch(err => console.log);

// database.users.checkFor('telegram_id',).then((results) => {
//     logger.log(results);
// }).catch(err => console.log);

// database.users.add(new User({
//     telegram_id: 80379146,
//     telegram_name: 'Austin',
//     telegram_handle: 'austinj'
// })).then(info => {
//     logger.success('done');
// }).catch(err => logger.error(err));


// database.requests.getAll().then(requests => {
//     logger.log(requests);
// })

//database.requests.removeOneByIds(80379146, 'tt0000001').then(info => {logger.log(info)})

// database.requests.getOneByIds(0, 'tt0000001').then(request => {
//     logger.log(request);
// })