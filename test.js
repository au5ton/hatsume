// test.js

require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);

// Create a bot that uses 'polling' to fetch new updates
//const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

process.on('unhandledRejection', r => logger.error('unhandledRejection: ',r.stack,'\n',r));

const mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MARIADB_HOST,
    user: process.env.MARIADB_USER,
    password: process.env.MARIADB_PASS,
    database: process.env.MARIADB_DB
});

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host : process.env.MARIADB_HOST,
        user : process.env.MARIADB_USER,
        password : process.env.MARIADB_PASS,
        database : process.env.MARIADB_DB
    },
    pool: { min: 0, max: 8}
});

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



// Creating a new user
//INSERT INTO users (telegram_id, telegram_name, telegram_handle, plex_username, accepted_agreement) VALUES(0, 'Pavel Durov', 'durov', 'durov@telegram.org', True)


// bot.on('message', (context) => {
// 	// do something
// 	// context.update.message
// });