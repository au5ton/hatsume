// User.js

const logger = require('au5ton-logger');

/*
Database schema
Table: users;
+-----------------+-------------+------+-----+---------+-------+
| Field           | Type        | Null | Key | Default | Extra |
+-----------------+-------------+------+-----+---------+-------+
| telegram_id     | int(11)     | YES  |     | NULL    |       |
| telegram_name   | varchar(40) | YES  |     | NULL    |       |
| telegram_handle | varchar(33) | YES  |     | NULL    |       |
| plex_username   | varchar(50) | YES  |     | NULL    |       |
| chat_state      | int(11)     | YES  |     | 0       |       |
+-----------------+-------------+------+-----+---------+-------+
*/

const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};

class User {
    constructor(options) {
        let toCheck = [
            'telegram_id',
            'telegram_name',
            'telegram_handle',
            'plex_username',
            'chat_state'
        ];

        for(let i in toCheck) {
            //logger.log(toCheck[i],': ',options[toCheck[i]]);
            if(non_empty(options[toCheck[i]])) {
                this[toCheck[i]] = options[toCheck[i]];
            }
            else {
                if(toCheck[i] !== 'chat_state') {
                    this[toCheck[i]] = null;
                }
                else {
                    this[toCheck[i]] = 0;
                }
            }
        }
    }
    static validate(User) {
        for(let elem in User) {
            if(User[elem] === null) {
                return false;
            }
            else {
                return true;
            }
        }
    }
}

module.exports = User;