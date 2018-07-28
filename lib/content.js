// plex.js

require('dotenv').config();
require('au5ton-logger')();
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

_.getRequestFromIMDBId = (imdbIdentifier) => {
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
                        content_name: imdb_entry.title,
                        _imdb_entry: imdb_entry,
                        _tvdb_entry: tvdb_entry
                    }))
                })
                .catch(err => {
                    reject('getcontentfromimdb: cant lookup tvdb from imdb, ', err)
                });
            }
            else {
                resolve(new Request({
                    imdb_id: imdbIdentifier,
                    content_name: imdb_entry.title,
                    _imdb_entry: imdb_entry
                }));
            }
        }).catch(err => {
            //removed from imdb
            resolve(null)
        });

        
    });
}

_.testIMDBConnection = (status) => {
    return new Promise((resolve, reject) => {
        imdb.get({
            id: 'tt0090190'
        }).then((movie) => {
            if(String(movie['imdbid']) === 'tt0090190') {
                resolve({status: 'good'});
            }
            else {
                resolve({err: 'IMDb/OMDb connection is ... weird.'});
            }
        })
    })
}

_.testTVDBConnection = (status) => {
    return new Promise((resolve, reject) => {
        tvdb.getSeriesById(71663).then((response) => {
            if(String(response['id']) === '71663') {
                resolve({status: 'good'});
            }
            else {
                resolve({err: 'TheTVDB connection is ... weird.'});
            }
        }).catch(err => {
            resolve({err: err})
        })
    })
};

module.exports = _;