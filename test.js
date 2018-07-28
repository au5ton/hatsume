// test.js

require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
require('au5ton-logger')();
console.setOption('prefix_date',true);
const PlexAPI = require('plex-api');
const os = require('os')

// Create a bot that uses 'polling' to fetch new updates
//const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

process.on('unhandledRejection', r => console.error('unhandledRejection: ',r.stack,'\n',r));


// Custom modules
const database = require('./lib/database');
const content = require('./lib/content');
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

pms.query('/library/sections').then(response => {
    
    //console.log(response.MediaContainer.Directory)
    let sections = sections.MediaContainer.Directory;
    for(let i in sections) {
        if(section[i]['type'] === 'movie') {
            pms.query('/library/sections/'+section[i]['key']).then(response => {
                console.log(response)
            }).catch(err => {
                console.error(err)
            })
        }
        else if(section[i]['type'] === 'show') {
            pms.query('/library/sections/'+section[i]['key']).then(response => {
                console.log(response)
            }).catch(err => {
                console.error(err)
            })
        }
    }

}).catch(err => {
    reject('Error connecting to PMS: ', err)
});