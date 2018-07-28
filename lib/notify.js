require('au5ton-logger')();

const database = require('./database');
const plexmediaserver = require('./plex');
const imdb = require('./content');

const _ = {};

_.job = () => {
    // The job that gets periodically run
    //console.log('hello')
}

_.stop = () => {
    // The job that gets run when job() stops
}

module.exports = _;