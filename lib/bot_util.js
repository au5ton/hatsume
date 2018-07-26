// bot_util.js

const logger = require('au5ton-logger');

const database = require('./database');
const plexmediaserver = require('./plex');
const imdb = require('./content');

const _ = {};

// returns (response, nextState)
_.processMessage = (message, chat_state) => {
    return new Promise((resolve, reject) => {
        var cmd = null;
        if(_.isCommand(message)) {
            cmd = _.getCommand(message);
        }

        if(message.chat.type === 'private') {
            // See: `img/chat_state diagram.png`
            switch(chat_state) {
                case 0: {
                    //[idle], user hasn't enrolled or cancelled their enrollment process
                    
                    /** Redundant, see bot.js **/
                    /** This can't happen here because we don't store Telegram users 
                     * in the database until they opt-in, therefore we can't retrieve a chat_state **/
                    // if(cmd === '/enroll') {
                    //     //telegram_id, telegram_name, telegram_handle
                    //     resolve({
                    //         response: 'Please send your Plex.tv username (or email if you don\'t have one).',
                    //         nextState: 1
                    //     });
                    //     break;
                    // }
                    if(cmd === '/makerequest') {
                        resolve({
                            response: 'Before making a request, you must verify that you have access to the Plex server by providing your Plex username with the /enroll command.',
                            nextState: null
                        });
                        break;
                    }
                    break;
                }
                case 1: {
                    //attempting to enroll, expecting a Plex username
                    if(cmd === '/cancel') {
                        resolve({
                            response: 'Enrollment process cancelled.',
                            nextState: 0
                        });
                        break;
                    }
                    
                    plexmediaserver.getUserFromLogin(message.text.trim()).then(result => {
                        // if a user was retreived with the provided username_or_email
                        if(result.status === 'found') {
                            
                            //asynchronously check if anyone is registered with this username_or_email already
                            let promises = [];
                            promises.push(database.users.checkFor('plex_username',result.payload['username']));
                            promises.push(database.users.checkFor('plex_username',result.payload['email']));
                            
                            Promise.all(promises).then(checks => {
                                for(let i in checks) {
                                    //if someone was already registered with this username
                                    if(checks[i] === 'found') {
                                        resolve({
                                            response: 'That Plex.tv username is already in use. Please try another or use /cancel to cancel.',
                                            nextState: null,
                                        });
                                    }
                                }
                                //if the username_or_email is valid and hasn't been used before
                                database.users.update('telegram_id', message.from.id, {
                                    plex_username: message.text.trim()
                                }).then(info => {
                                    resolve({
                                        response: 'Your Plex.tv username is valid and has been confirmed. You may now use /makerequest to make requests for content additions.',
                                        nextState: 2
                                    });
                                }).catch(err => logger.error(err));
                            });
                        }
                        else {
                            resolve({
                                response: 'That Plex.tv username was not valid. Please try again or use /cancel to cancel.',
                                nextState: null,
                            });
                        }
                    }).catch(err => {
                        logger.error(err)
                    })

                    break;
                }
                case 2: {
                    //user is authenticated, [idleing] and waiting to make a formal request

                    if(cmd === '/makerequest') {
                        resolve({
                            response: 'Send a link to the content you\'re interested in on imdb.com. (You can send multiple links in one message) \nExample: https://www.imdb.com/title/tt0213338/',
                            responseOptions: {
                                disable_web_page_preview: true
                            },
                            nextState: 3
                        });
                    }

                    break;
                }
                case 3: {
                    //attempting to request, expecting an @imdb message, an imdb link, or thetvdb link
                    
                    if(cmd === '/cancel') {
                        resolve({
                            response: 'Request cancelled.',
                            nextState: 2
                        });
                    }

                    let links = _.getContentLinks(message);
                    if(links.length === 0) {
                        resolve({
                            response: 'I couldn\'t find any links in that message. Try again or use /cancel.',
                            nextState: null
                        });
                        break;
                    }

                    let valid_ids = [];
                    for(let i in links) {
                        let u = new URL(links[i]);
                        if(u.hostname === 'www.imdb.com' || u.hostname === 'imdb.com') {
                            //(regex.exec(str))[0] => 'tt2560140'
                            //bad.exec(str) => null
                            let regex = /tt\d{7}/gm;
                            let r = regex.exec(links[i]);
                            if(r !== null) {
                                valid_ids.push(r[0]);
                            }
                        }
                    }
                    if(valid_ids.length === 0) {
                        resolve({
                            response: 'That IMDb url isn\'t a link to a movie or tv show. Try again or use /cancel.',
                            nextState: null
                        });
                        break;
                    }
                    else {

                        let promises = [];
                        for(let i in valid_ids) {
                            promises.push(imdb.getRequestFromIMDBId(valid_ids[i]));
                        }
                        Promise.all(promises).then(requests => {
                            let str = '';
                            let sufficient = false; //flag to see if any of links were valid
                            for(let i in requests) {
                                if(requests[i] !== null) {

                                    // Specify who is making the requests
                                    requests[i]['telegram_id'] = message.from.id;

                                    // Make a pretty string
                                    sufficient = true;
                                    str += '<i>'+requests[i]['content_name']+' ('+requests[i]['_imdb_entry']['_year_data']+')'+'</i>'+', \n';
                                }
                            }
                            for(let i = requests.length; i >= 0; i--) {
                                if(requests[i] === null) {
                                    requests.splice(i, 1); // remove element from array
                                }
                            }
                            if(sufficient) {

                                // Submit to database
                                let promises = [];
                                for(let i in requests) {
                                    promises.push(database.requests.add(requests[i]));
                                }
                                Promise.all(promises).then(info => {
                                    // all were added to the database
                                    // Repond to the user
                                    str = str.substring(0,str.length-3); //remove ', \n'
                                    resolve({
                                        response: 'Done! Requested: \n\n'+str+'\n\nI\'ll send you a message whenever these item(s) get added. (＾◡＾)',
                                        responseOptions: {
                                            parse_mode: 'html'
                                        },
                                        pushChannel: true,
                                        channelPayload: message.from.first_name+' requests: \n'+str,
                                        nextState: 2
                                    })
                                }).catch(err => {
                                    //if *any* fail
                                })

                                // 

                                
                            }
                            else {
                                resolve({
                                    response: 'Those IMDb url(s) may be a real links, but I can\'t get any information about them right now. Try again or use /cancel.',
                                    nextState: null
                                });
                            }
                        })

                        break;
                    }
                }
            }
        }

    });
};

// Synchronous function determines if message is a command or not
_.isCommand = (message) => {
    for(let e in message.entities) {
        if(message.entities[e].type === 'bot_command') {
            return true;
        }
    }
    return false;
};

// Only gets first command
_.getCommand = (message) => {
    for(let i = 0; i < message.entities.length; i++) {
        if(message.entities[i].type === 'bot_command') {
            return _.getEntity(message, i)['entity_text'];
        }
    }
    return null;
}

// Returns MessageEntity with extra property `entity_text` from offset and length
// https://core.telegram.org/bots/api#messageentity
_.getEntity = (message, index) => {
    let ent = message.entities[index];
    ent.entity_text = message.text.substring(ent.offset, ent.offset + ent.length);
    return ent;
};

// Returns array
_.getContentLinks = (message) => {
    //logger.log(message)
    let links = [];
    for(let e in message.entities) {
        if(message.entities[e].type === 'text_link') {
            links.push(message.entities[e].url);
        }
        if(message.entities[e].type === 'url') {
            links.push((_.getEntity(message, e))['entity_text']);
        }
    }
    return links;
}



module.exports = _;