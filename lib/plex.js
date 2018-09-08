// plex.js

require('dotenv').config();
const os = require('os');
const fetch = require('node-fetch');
const xml = require('xml2json');
require('au5ton-logger')();
const PlexAPI = require('plex-api');

const app_options = {
    identifier: 'com.github.au5ton.hatsume',
    product: 'hatsume/Node.js',
    version: '1.0',
    deviceName: 'Node.js',
    platform: 'Node.js',
    platformVersion: process.version,
    device: os.platform()
};

const _ = {};

// Not yet implemented
_.checkUsernameHasAccess = async function(username) {

    let pms = new PlexAPI({
        hostname: process.env.PMS_HOSTNAME,
        port: process.env.PMS_PORT,
        username: process.env.PMS_USERNAME,
        password: process.env.PMS_PASSWORD,
        options: app_options
    });
    try {
        var account = await pms.query('/myplex/account')
    }
    catch(err) {
        throw {status: 'Error connecting to PMS: ', err: err}
    }
    
    let headers = {
        'X-Plex-Token': account.MyPlex.authToken,
        'X-Plex-Product': app_options.product,
        'X-Plex-Version': app_options.version,
        'X-Plex-Client-Identifier': app_options.identifier
    };
    try {
        var friends = await (await fetch('https://plex.tv/pms/friends/all', {headers: headers})).text()
    }
    catch(err) {
        throw {status: 'Error connecting to plex.tv: ', err: err}
    }
    let data = JSON.parse(xml.toJson(friends));
    let users = data.MediaContainer.User;
    users.push({
        incomplete: true, 
        username: account.MyPlex.username.toLowerCase(),
        email: account.MyPlex.username.toLowerCase()
    });
    for(let i in users) {
        //console.log('comparing `',username,'` to `',users[i]['username'],'`')
        //console.log('comparing `',username,'` to `',users[i]['email'],'`')
        if(username.toLowerCase() === users[i]['username'].toLowerCase() || username.toLowerCase() === users[i]['email'].toLowerCase()) {
            return 'access_granted';
        }
    }
    return 'access_denied';
};

_.getUserFromLogin = async function(username_or_email) {

    let pms = new PlexAPI({
        hostname: process.env.PMS_HOSTNAME,
        port: process.env.PMS_PORT,
        username: process.env.PMS_USERNAME,
        password: process.env.PMS_PASSWORD,
        options: app_options
    });
    try {
        var account = await pms.query('/myplex/account')
    }
    catch(err) {
        throw {status: 'Error connecting to PMS: ', err: err}
    }
    
    let headers = {
        'X-Plex-Token': account.MyPlex.authToken,
        'X-Plex-Product': app_options.product,
        'X-Plex-Version': app_options.version,
        'X-Plex-Client-Identifier': app_options.identifier
    };
    try {
        var friends = await (await fetch('https://plex.tv/pms/friends/all', {headers: headers})).text()
    }
    catch(err) {
        throw {status: 'Error connecting to plex.tv: ', err: err}
    }
    let data = JSON.parse(xml.toJson(friends));
    let users = data.MediaContainer.User;
    users.push({
        incomplete: true, 
        username: account.MyPlex.username.toLowerCase(),
        email: account.MyPlex.username.toLowerCase()
    });
    for(let i in users) {
        //console.log('comparing `',username,'` to `',users[i]['username'],'`')
        //console.log('comparing `',username,'` to `',users[i]['email'],'`')
        if(username_or_email.toLowerCase() === users[i]['username'].toLowerCase() || username_or_email.toLowerCase() === users[i]['email'].toLowerCase()) {
            return {status: 'found', payload: users[i]};
        }
    }
    return {status: 'missing', payload: null};

}

/**
 * @returns {string[]} {title, network, start_year}
 */
_.getAllLocalTVShows = async function() {

    const LOCAL_TV_IDS = [];
    LOCAL_TV_IDS.type = 'showTitle';

    let pms = new PlexAPI({
        hostname: process.env.PMS_HOSTNAME,
        port: process.env.PMS_PORT,
        username: process.env.PMS_USERNAME,
        password: process.env.PMS_PASSWORD,
        options: app_options
    });
    try {
        var sections = (await pms.query('/library/sections')).MediaContainer.Directory
    }
    catch(err) {
        throw {status: 'Error connecting to PMS: ', err: err}
    }
    for(let i in sections) {
        if(sections[i]['type'] === 'show') {
            let shows = (await pms.query('/library/sections/'+sections[i]['key']+'/all')).MediaContainer.Metadata
            for(let j in shows) {
                let metadata = (await pms.query(shows[j]['key'])).MediaContainer
                let downloaded_seasons = [];
                let season_metadata = metadata.Metadata
                // if(metadata['parentTitle'] === 'Fear the Walking Dead') {
                //     console.log('show:', shows[j])
                //     console.log('Meta:', metadata)
                //     console.log('dir:',metadata.Directory)
                //     console.log('meta:',metadata.Metadata)
                // }
                for(let k in season_metadata) {
                    // the `index` value will always represent the value of that season, even if the earliest season downloaded isn't 1 or 0
                    downloaded_seasons.push(season_metadata[k]['index'])
                }
                LOCAL_TV_IDS.push({ 
                    title: shows[j]['title'],
                    network: shows[j]['studio'],
                    start_year: shows[j]['year'],
                    downloaded_seasons: downloaded_seasons
                })
            }
        }
    }

    return LOCAL_TV_IDS
}

/**
 * @returns {string[]} ids
 */
_.getAllLocalMovies = async function() {

    const LOCAL_MOVIE_IDS = [];
    LOCAL_MOVIE_IDS.type = 'movie'

    let pms = new PlexAPI({
        hostname: process.env.PMS_HOSTNAME,
        port: process.env.PMS_PORT,
        username: process.env.PMS_USERNAME,
        password: process.env.PMS_PASSWORD,
        options: app_options
    });

    try {
        let sections = (await pms.query('/library/sections')).MediaContainer.Directory
        //console.log(sections)
        for(let i in sections) {
            if(sections[i]['type'] === 'movie') {
                let movies = (await pms.query('/library/sections/'+sections[i]['key']+'/all')).MediaContainer.Metadata
                for(let j in movies) {
                    let metadata = await pms.query(movies[j]['key'])
                    let guid = metadata.MediaContainer.Metadata[0].guid
                    let imdb_regex = /tt\d{7}/gm;
                    let imdb_id = imdb_regex.exec(guid);

                    if(imdb_id !== null) {
                        LOCAL_MOVIE_IDS.push(imdb_id[0])
                    }
                    else if(guid.includes('themoviedb://')) {
                        let tmdb_id = guid.substring(guid.indexOf('themoviedb://')+'themoviedb://'.length, guid.indexOf('?'))
                        LOCAL_MOVIE_IDS.push(tmdb_id)
                    }

                }
            }
        }
    }
    catch(err) {
        throw err;
    }
    
    return LOCAL_MOVIE_IDS;
}

_.testConnection = async function() {
    let pms = new PlexAPI({
        hostname: process.env.PMS_HOSTNAME,
        port: process.env.PMS_PORT,
        username: process.env.PMS_USERNAME,
        password: process.env.PMS_PASSWORD,
        options: app_options
    });

    let account = await pms.query('/myplex/account')
    try {
        var response = await fetch('https://plex.tv/pms/friends/all', {
            headers: {
                'X-Plex-Token': account.MyPlex.authToken,
                'X-Plex-Product': app_options.product,
                'X-Plex-Version': app_options.version,
                'X-Plex-Client-Identifier': app_options.identifier
            }
        })
        var friends = await response.text()
    }
    catch(err) {
        throw {err: err}
    }
    
    let data = JSON.parse(xml.toJson(friends))
    if(data.MediaContainer) {
        return {status: 'good'};
    }
    else {
        return {err: 'no MediaContainer'}
    }
}

module.exports = _;