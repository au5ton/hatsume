// test.js

require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const os = require('os');
const fetch = require('node-fetch');
var xml = require('xml2json');

// Create a bot that uses 'polling' to fetch new updates
//const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

process.on('unhandledRejection', r => logger.error('unhandledRejection: ',r.stack,'\n',r));


// Custom modules
const database = require('./lib/database');
const User = require('./lib/classes/User');
const Request = require('./lib/classes/Request');

const PlexAPI = require("plex-api");

const app_options = {
    identifier: 'com.github.au5ton.hatsume',
    product: 'hatsume/Node.js',
    version: '1.0',
    deviceName: 'Node.js',
    platform: 'Node.js',
    platformVersion: process.version,
    device: os.platform()
};

var client = new PlexAPI({
    hostname: process.env.PMS_HOSTNAME,
    port: process.env.PMS_PORT,
    username: process.env.PMS_USERNAME,
    password: process.env.PMS_PASSWORD,
    options: app_options
});

client.query('/myplex/account').then(function (result) {
    //logger.log(result)
    
    fetch('https://plex.tv/pms/friends/all', {
        headers: {
            'X-Plex-Token': result.MyPlex.authToken,
            'X-Plex-Product': app_options.product,
            'X-Plex-Version': app_options.version,
            'X-Plex-Client-Identifier': app_options.identifier
        }
    })
    .then(res => res.text())
    .then(res => {
        let data = JSON.parse(xml.toJson(res));
        let users = data.MediaContainer.User;
        for(let i in users) {
            logger.log(users[i]['username'])
        }
    })

}, function (err) {
	console.error("Could not connect to server", err);
});

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
