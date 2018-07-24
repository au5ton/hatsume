// plex.js

require('dotenv').config();
const logger = require('au5ton-logger');
const _IMDB = require('imdb-api');
const imdb = new _IMDB.Client({apiKey: process.env.OMDB_API_KEY});
const _TVDB = require('node-tvdb');
const tvdb = new _TVDB(process.env.THETVDB_API_KEY);

const Request = require('./classes/Request');
/*
    'request_id',
    'telegram_id',
    'imdb_id',
    'tvdb_id',
    'content_name' 
*/

const _ = {};

_.getContentInfoFromIMDBId = (imdbIdentifier) => {
    return new Promise((resolve, reject) => {

        imdb.get({
            id: imdbIdentifier
        }).then(imdb_entry => {
            if(imdb_entry.type === 'series') {
                tvdb.getSeriesByImdbId(imdbIdentifier)
                .then(tvdb_entry => {
                    resolve(new Request({
                        imdb_id: imdbIdentifier,
                        tvdb_id: tvdb_entry[0].id,
                        content_name: imdb_entry.title
                    }))
                })
                .catch(err => {
                    reject('getcontentfromimdb: cant lookup tvdb from imdb, ', err)
                });
            }
            else {
                resolve(new Request({
                    imdb_id: imdbIdentifier,
                    content_name: imdb_entry.title
                }));
            }
        }).catch(err => {
            resolve(null)
        });

        
    });
}


module.exports = _;