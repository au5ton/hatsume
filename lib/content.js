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
                .then(e => {
                    tvdb.getSeriesAllById(e['id'])
                    .then(tvdb_entry => {

                        // Retrieve all seasons
                    let available_seasons = new Set()
                    for(let i in tvdb_entry.episodes) {
                        available_seasons.add(tvdb_entry.episodes[i].airedSeason)
                    }
                    // this is wasteful for memory maybe but I need it sorted
                    available_seasons = Array.from(available_seasons).sort()
                    // themoviedb
                    fetch('https://api.themoviedb.org/3/find/'+imdbIdentifier+'?'+querystring.encode({
                        api_key: process.env.THEMOVIEDB_API_KEY,
                        external_source: 'imdb_id'
                    }))
                    .then(res => res.json())
                    .then(tmdb_entry => {
                        // json => https://developers.themoviedb.org/3/find/find-by-id

                        if(tmdb_entry.tv_results.length > 0) {

                            _.getBestArtworkTMDb('tv', tmdb_entry.tv_results[0].id).then(image_url => {
                                resolve(new Request({
                                    imdb_id: imdbIdentifier,
                                    tmdb_id: tmdb_entry.tv_results[0].id, // should fix #12
                                    tvdb_id: tvdb_entry[0].id,
                                    content_name: tvdb_entry[0].seriesName,
                                    is_tv: true,
                                    network: tvdb_entry[0].network,
                                    start_year: (new Date(tvdb_entry[0].firstAired)).getFullYear(),
                                    available_seasons: available_seasons,
                                    desired_seasons: [],
                                    image: image_url,
                                    _imdb_entry: imdb_entry,
                                    _tvdb_entry: tvdb_entry,
                                    _tvdb_url: 'https://www.thetvdb.com/?id='+tvdb_entry[0].id+'&tab=series'
                                }))
                            })
                        }
                        else {
                            resolve(new Request({
                                imdb_id: imdbIdentifier,
                                tmdb_id: null,
                                tvdb_id: tvdb_entry[0].id,
                                content_name: tvdb_entry[0].seriesName,
                                is_tv: true,
                                network: tvdb_entry[0].network,
                                start_year: (new Date(tvdb_entry[0].firstAired)).getFullYear(),
                                available_seasons: available_seasons,
                                desired_seasons: [],
                                _imdb_entry: imdb_entry,
                                _tvdb_entry: tvdb_entry,
                                _tvdb_url: 'https://www.thetvdb.com/?id='+tvdb_entry[0].id+'&tab=series'
                            })) 
                        }
                    })

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

                    if(tmdb_entry.movie_results.length > 0) {
                        _.getBestArtworkTMDb('movie', tmdb_entry.movie_results[0].id).then(image_url => {
                            resolve(new Request({
                                imdb_id: imdbIdentifier,
                                tmdb_id: tmdb_entry.movie_results[0].id,
                                content_name: imdb_entry['title'],
                                start_year: (isNaN(parseInt(imdb_entry['year'])) ? null : parseInt(imdb_entry['year'])),
                                is_tv: false,
                                image: image_url,
                                _imdb_entry: imdb_entry
                            }))
                        })  
                    }
                    else {
                        resolve(new Request({
                            imdb_id: imdbIdentifier,
                            content_name: imdb_entry['title'],
                            start_year: (isNaN(parseInt(imdb_entry['year'])) ? null : parseInt(imdb_entry['year'])),
                            is_tv: false,
                            _imdb_entry: imdb_entry
                        }))
                    }
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

                // themoviedb
                fetch('https://api.themoviedb.org/3/find/'+id+'?'+querystring.encode({
                    api_key: process.env.THEMOVIEDB_API_KEY,
                    external_source: 'tvdb_id'
                }))
                .then(res => res.json())
                .then(tmdb_entry => {
                    // json => https://developers.themoviedb.org/3/find/find-by-id

                    if(tmdb_entry.tv_results.length > 0) {
                        myRequest.tmdb_id = tmdb_entry.tv_results[0].id
                        _.getBestArtworkTMDb('tv', tmdb_entry.tv_results[0].id).then(image_url => {
                            myRequest.image = image_url
                            resolve(myRequest)
                        })
                    }
                    else {
                        resolve(myRequest)
                    }
                    
                })

            }).catch(err => {
                console.log(err)
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
        tvdb.getSeriesAllById(tvdbIdentifier)
        .then(tvdb_entry => {
            let available_seasons = new Set()
            for(let i in tvdb_entry.episodes) {
                available_seasons.add(tvdb_entry.episodes[i].airedSeason)
            }
            // this is wasteful for memory maybe but I need it sorted
            available_seasons = Array.from(available_seasons).sort()
            resolve(new Request({
                tvdb_id: tvdb_entry.id,
                content_name: tvdb_entry.seriesName,
                is_tv: true,
                network: tvdb_entry.network,
                start_year: (new Date(tvdb_entry.firstAired)).getFullYear(),
                available_seasons: available_seasons,
                desired_seasons: [],
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

/**
 * 
 * @param {string} type <movie||tv>
 * @param {string} tmdb_id 
 */
_.getBestArtworkTMDb = (type, tmdb_id) => {
    // example: https://image.tmdb.org/t/p/original/wQKwrZc8Mtuyaqx2HcIxWi7FOGp.jpg
    // docs: https://developers.themoviedb.org/3/tv/get-tv-images

    const base_url = 'https://image.tmdb.org/t/p/original';

    return new Promise((resolve, reject) => {
        fetch('https://api.themoviedb.org/3/'+type+'/'+tmdb_id+'/images?'+querystring.encode({
            api_key: process.env.THEMOVIEDB_API_KEY
        }))
        .then(res => res.json())
        .then(entry => {
            if(!entry.posters) {
                reject('failed somehow')
            }
            let best_area = 0;
            let best_img = null;
            for(let image of entry.posters) {
                if(best_area < image.height * image.width) {
                    best_img = image.file_path;
                }
                best_area = Math.max(image.height * image.width, best_area);
            }
            resolve(base_url+best_img)
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
        tvdb.getSeriesAllById(71663).then((response) => {
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