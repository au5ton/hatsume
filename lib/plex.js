// plex.js

require('dotenv').config();
const os = require('os');
const fetch = require('node-fetch');
var xml = require('xml2json');
const logger = require('au5ton-logger');
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
                    username: account.MyPlex.username,
                    email: account.MyPlex.username
                });
                for(let i in users) {
                    //logger.log('comparing `',username,'` to `',users[i]['username'],'`')
                    //logger.log('comparing `',username,'` to `',users[i]['email'],'`')
                    if(username === users[i]['username'] || username === users[i]['email']) {
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
                    //logger.log('comparing `',username,'` to `',users[i]['username'],'`')
                    //logger.log('comparing `',username,'` to `',users[i]['email'],'`')
                    if(username_or_email === users[i]['username'] || username === users[i]['email']) {
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

module.exports = _;