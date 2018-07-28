require('au5ton-logger')();

const database = require('./database');
const plexmediaserver = require('./plex');
const imdb = require('./content');
const compare = require('string-similarity').compareTwoStrings;

const Request = require('./classes/Request');

const _ = {};

/**
 * Returns a list of Requests that have been completed
 */
_.filledRequests = () => {
    return new Promise((resolve, reject) => {
        const FILLED_REQUESTS = []

        let promises = []
        promises.push(plexmediaserver.getAllLocalTVShows())
        promises.push(plexmediaserver.getAllLocalMovies())
        promises.push(database.requests.getAll())

        // When all three complete
        Promise.all(promises).then(responses => {

            // identify the indexes and create aliases
            var shows, movies, requests;
            for(let i in responses) {
                if(responses[i][0] instanceof Request) {
                    requests = responses[i];
                }
                else if(responses[i].type === 'showTitle') {
                    shows = responses[i];
                }
                else if(responses[i].type === 'movie') {
                    movies = responses[i]
                }
            }

            //console.table(movies)
            //console.table(requests)
            //process.exit()

            // movies is a list of either imdb_ids or themoviedb ids
            for(let i = 0; i < movies.length; i++) {
                for(let j in requests) {
                    if(movies[i].startsWith('tt')) {
                        //console.log(movies[i])
                        if(movies[i] === requests[j].imdb_id) {
                            FILLED_REQUESTS.push(requests[j])
                        }
                    }
                    else {
                        if(parseInt(movies[i]) === requests[j].tmdb_id) {
                            FILLED_REQUESTS.push(requests[j])
                        }
                    }
                }
            }

            for(let i = 0; i < shows.length; i++) {
                for(let j in requests) {
                    // 80% similar
                    if(compare(shows[i]['title'], requests[j]['content_name']) > 0.8) {
                        if(shows[i]['start_year'] === requests[j]['start_year']) {
                            FILLED_REQUESTS.push(requests[j])
                        }
                    }
                }
            }

            resolve(FILLED_REQUESTS)

        })
    }).catch(err => {
        console.flag()
        console.error(err)
    })
}

_.stop = () => {
    // The job that gets run when job() stops
}

module.exports = _;