// plex.js

require('dotenv').config();
const os = require('os');
const fetch = require('node-fetch');
var xml = require('xml2json');
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
_.checkUsernameHasAccess = (username) => {
    return new Promise((resolve, reject) => {
        
        let pms = new PlexAPI({
            hostname: process.env.PMS_HOSTNAME,
            port: process.env.PMS_PORT,
            username: process.env.PMS_USERNAME,
            password: process.env.PMS_PASSWORD,
            options: app_options
        });

        pms.query('/myplex/account').then(account => {
            fetch('https://plex.tv/pms/friends/all', {
                headers: {
                    'X-Plex-Token': account.MyPlex.authToken,
                    'X-Plex-Product': app_options.product,
                    'X-Plex-Version': app_options.version,
                    'X-Plex-Client-Identifier': app_options.identifier
                }
            })
            .then(res => res.text())
            .then(res => {
                let data = JSON.parse(xml.toJson(res));
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
                        resolve('access_granted');
                    }
                }
                resolve('access_denied');
            }).catch(err => {
                reject('Error connecting to plex.tv: ', err);
            })
        
        }).catch(err => {
            reject('Error connecting to PMS: ', err)
        });
    });
};

_.getUserFromLogin = (username_or_email) => {
    return new Promise((resolve, reject) => {
        
        let pms = new PlexAPI({
            hostname: process.env.PMS_HOSTNAME,
            port: process.env.PMS_PORT,
            username: process.env.PMS_USERNAME,
            password: process.env.PMS_PASSWORD,
            options: app_options
        });

        pms.query('/myplex/account').then(account => {
            //console.log(account.MyPlex);
            fetch('https://plex.tv/pms/friends/all', {
                headers: {
                    'X-Plex-Token': account.MyPlex.authToken,
                    'X-Plex-Product': app_options.product,
                    'X-Plex-Version': app_options.version,
                    'X-Plex-Client-Identifier': app_options.identifier
                }
            })
            .then(res => res.text())
            .then(res => {
                let data = JSON.parse(xml.toJson(res));
                let users = data.MediaContainer.User;
                users.push({
                    incomplete: true, 
                    username: account.MyPlex.username,
                    email: account.MyPlex.username
                });
                for(let i in users) {
                    //console.log('comparing `',username_or_email,'` to `',users[i]['username'],'`')
                    //console.log('comparing `',username_or_email,'` to `',users[i]['email'],'`')
                    if(username_or_email === users[i]['username'] || username_or_email === users[i]['email']) {
                        resolve({status: 'found', payload: users[i]});
                    }
                }
                resolve({status: 'missing', payload: null});
            }).catch(err => {
                reject('Error connecting to plex.tv: ', err);
            })
        
        }).catch(err => {
            reject('Error connecting to PMS: ', err)
        });
    });
}

/**
 * @returns {string[]} titles
 */
_.getAllLocalTVShows = () => {
    return new Promise((resolve, reject) => {

        const LOCAL_TV_IDS = [];

        let pms = new PlexAPI({
            hostname: process.env.PMS_HOSTNAME,
            port: process.env.PMS_PORT,
            username: process.env.PMS_USERNAME,
            password: process.env.PMS_PASSWORD,
            options: app_options
        });

        // Get all library sections
        pms.query('/library/sections').then(response => {
    
            // Traverse all movie sections
            let sections = response.MediaContainer.Directory;
            let promises = []
            for(let i in sections) {
                if(sections[i]['type'] === 'show') {
                    promises.push(pms.query('/library/sections/'+sections[i]['key']+'/all'))
                }
            }

            // when we've finished querying every section for /all/ movies
            Promise.all(promises).then(all_sections => {
                
                // query every movie in every section
                for(let j in all_sections) {
                    let shows = all_sections[j].MediaContainer.Metadata;

                    // query every movie for extra data
                    for(let k in shows) {
                        LOCAL_TV_IDS.push(shows[k]['title'])
                    }
                }

                resolve(LOCAL_TV_IDS)

            }).catch(err => {
                console.flag()
                console.error(err)
                reject(err)
            })
        
        }).catch(err => {
            console.error('Error connecting to PMS: ', err)
            reject(err)
        });
    })
}

/**
 * @returns {string[]} ids
 */
_.getAllLocalMovies = () => {
    return new Promise((resolve, reject) => {

        const LOCAL_MOVIE_IDS = [];

        let pms = new PlexAPI({
            hostname: process.env.PMS_HOSTNAME,
            port: process.env.PMS_PORT,
            username: process.env.PMS_USERNAME,
            password: process.env.PMS_PASSWORD,
            options: app_options
        });

        // Get all library sections
        pms.query('/library/sections').then(response => {
    
            // Traverse all movie sections
            let sections = response.MediaContainer.Directory;
            let promises = []
            for(let i in sections) {
                if(sections[i]['type'] === 'movie') {
                    promises.push(pms.query('/library/sections/'+sections[i]['key']+'/all'))
                }
            }

            // when we've finished querying every section for /all/ movies
            Promise.all(promises).then(all_sections => {
                let promises = []
                
                // query every movie in every section
                for(let j in all_sections) {
                    let movies = all_sections[j].MediaContainer.Metadata;

                    // query every movie for extra data
                    for(let k in movies) {
                        promises.push(pms.query(movies[k]['key']))
                    }
                }

                // when every movie has finished being 
                Promise.all(promises).then(movies_metadata => {
                    //response.MediaContainer.Metadata[0].guid contains imdb id
                    
                    for(let l in movies_metadata) {
                        let guid = movies_metadata[l].MediaContainer.Metadata[0].guid

                        let imdb_regex = /tt\d{7}/gm;
                        let imdb_id = imdb_regex.exec(guid);

                        if(imdb_id !== null) {
                            LOCAL_MOVIE_IDS.push(imdb_id[0])
                        }
                        else if(guid.includes('themoviedb://')) {
                            let tmdb_id = guid.substring(guid.indexOf('themoviedb://')+'themoviedb://'.length, guid.indexOf('?'))
                            LOCAL_MOVIE_IDS.push(tmdb_id)
                        }
                        else {
                            // local asset or unmatched
                            //console.warn(response.MediaContainer.Metadata[0].guid + '  '+ r)
                        }
                    }

                    resolve(LOCAL_MOVIE_IDS)

                }).catch(err => {
                    console.flag()
                    console.error(err)
                    reject(err)
                })
            }).catch(err => {
                console.flag()
                console.error(err)
                reject(err)
            })
        
        }).catch(err => {
            console.error('Error connecting to PMS: ', err)
            reject(err)
        });
    })
}

_.testConnection = () => {
    return new Promise((resolve, reject) => {
        
        let pms = new PlexAPI({
            hostname: process.env.PMS_HOSTNAME,
            port: process.env.PMS_PORT,
            username: process.env.PMS_USERNAME,
            password: process.env.PMS_PASSWORD,
            options: app_options
        });

        pms.query('/myplex/account').then(account => {
            fetch('https://plex.tv/pms/friends/all', {
                headers: {
                    'X-Plex-Token': account.MyPlex.authToken,
                    'X-Plex-Product': app_options.product,
                    'X-Plex-Version': app_options.version,
                    'X-Plex-Client-Identifier': app_options.identifier
                }
            })
            .then(res => res.text())
            .then(res => {
                let data = JSON.parse(xml.toJson(res));
                if(data.MediaContainer) {
                    resolve({status: 'good'});
                }
                else {
                    resolve({err: 'no MediaContainer'})
                }
            }).catch(err => {
                resolve({err: err})
            })
        
        }).catch(err => {
            resolve({err: err})
        });

    });
}

/*



*/

module.exports = _;