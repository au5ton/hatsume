// plex.js

const _ = {};


// Not yet implemented
_.checkUsernameHasAccess = (username) => {
    return new Promise((resolve, reject) => {
        if(username === 'fakeusername') {
            resolve('access_denied');
        }
        else {
            resolve('access_granted');
        }
    });
};

module.exports = _;