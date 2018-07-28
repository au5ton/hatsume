// plex.js

require('dotenv').config();
require('au5ton-logger')();
const _IMDB = require('imdb-api');
const imdb = new _IMDB.Client({apiKey: process.env.OMDB_API_KEY});
const _TVDB = require('node-tvdb');
const tvdb = new _TVDB(process.env.THETVDB_API_KEY);

// For scraping
const fetch = require('node-fetch')
const querystring = require('querystring')
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

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

                    // themoviedb
                    fetch('https://api.themoviedb.org/3/find/'+imdbIdentifier+'?'+querystring.encode({
                        api_key: process.env.THEMOVIEDB_API_KEY,
                        external_source: 'imdb_id'
                    }))
                    .then(res => res.json())
                    .then(tmdb_entry => {
                        // json => https://developers.themoviedb.org/3/find/find-by-id
                        resolve(new Request({
                            imdb_id: imdbIdentifier,
                            tmdb_id: tmdb_entry.tv_results[0].id,
                            tvdb_id: tvdb_entry[0].id,
                            content_name: tvdb_entry[0].seriesName,
                            is_tv: true,
                            _imdb_entry: imdb_entry,
                            _tvdb_entry: tvdb_entry,
                            _tvdb_url: 'https://www.thetvdb.com/?id='+tvdb_entry[0].id+'&tab=series'
                        }))
                    })
                })
                .catch(err => {
                    if(err.response.status === 404) {
                        resolve({
                            status: 404,
                            imdb_id: imdbIdentifier,
                            _imdb_entry: imdb_entry
                        })
                    }
                    else {
                        reject('getcontentfromimdb: failure')
                    }
                });
            }
            else {
                // themoviedb
                fetch('https://api.themoviedb.org/3/find/'+imdbIdentifier+'?'+querystring.encode({
                    api_key: process.env.THEMOVIEDB_API_KEY,
                    external_source: 'imdb_id'
                }))
                .then(res => res.json())
                .then(tmdb_entry => {
                    // json => https://developers.themoviedb.org/3/find/find-by-id
                    resolve(new Request({
                        imdb_id: imdbIdentifier,
                        tmdb_id: tmdb_entry.movie_results[0].id,
                        content_name: imdb_entry['title'],
                        is_tv: false,
                        _imdb_entry: imdb_entry
                    }))
                })
            }
        }).catch(err => {
            //removed from imdb
            resolve(null)
        });

        
    });
}

_.getRequestFromTVDBUrl = (url) => {
    return new Promise((resolve, reject) => {
        _.getTVDBIdFromUrl(url).then(id => {
            _.getRequestFromTVDBId(id).then(myRequest => {
                myRequest._tvdb_url = url
                resolve(myRequest)
            }).catch(err => {
                if(err.response.status === 404) {
                    resolve({
                        status: 404,
                        tvdb_id: id,
                        _imdb_entry: null,
                        _tvdb_url: url
                    })
                }
            })
        }).catch(err => {
            reject(err)
        })
    })
}

_.getRequestFromTVDBId = (tvdbIdentifier) => {
    return new Promise((resolve, reject) => {
        tvdb.getSeriesById(tvdbIdentifier)
        .then(tvdb_entry => {
            resolve(new Request({
                tvdb_id: tvdb_entry.id,
                content_name: tvdb_entry.seriesName,
                is_tv: true,
                _tvdb_entry: tvdb_entry
            }))
        })
        .catch(err => {
            reject(err)
        });
    })
}

// #series_basic_info > ul > li:nth-child(1) > span
_.getTVDBIdFromUrl = (url) => {
    return new Promise((resolve, reject) => {
        fetch(url)
        .then(res => res.text())
        .then(body => {
            let dom = new JSDOM(body);
            let id = dom.window.document.querySelector('#series_basic_info > ul > li:nth-child(1) > span').textContent
            if(isNaN(parseInt(id))) {
                reject('gettvdbidfromurl: couldnt parseint')
            }
            else {
                resolve(parseInt(id))
            }
        })
        .catch(err => {
            reject(err)
        })
    })
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