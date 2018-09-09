// Request.js

/*
Database schema
table: requests
+--------------+--------------+------+-----+---------+----------------+
| Field        | Type         | Null | Key | Default | Extra          |
+--------------+--------------+------+-----+---------+----------------+
| request_id   | int(11)      | NO   | PRI | NULL    | auto_increment |
| telegram_id  | int(11)      | YES  |     | NULL    |                |
| imdb_id      | varchar(20)  | YES  |     | NULL    |                |
| tvdb_id      | int(11)      | YES  |     | NULL    |                |
| content_name | varchar(255) | YES  |     | NULL    |                |
| is_tv        | tinyint(1)   | YES  |     | NULL    |                |
| tmdb_id      | int(11)      | YES  |     | NULL    |                |
| network      | varchar(50)  | YES  |     | NULL    |                |
| start_year   | int(11)      | YES  |     | NULL    |                |
+--------------+--------------+------+-----+---------+----------------+
*/

const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};

const toCheck = [
    'request_id',
    'telegram_id',
    'imdb_id',
    'tmdb_id',
    'tvdb_id',
    'content_name',
    'is_tv',
    'network',
    'start_year',
    'available_seasons',
    'desired_seasons',
    'downloaded_seasons',
    'done_composing',
    'image',
    '_imdb_entry',
    '_tvdb_entry',
    '_tvdb_url'
];
const boolean_properties = [
    'is_tv',
    'done_composing'
]
const json_properties = [
    'available_seasons',
    'desired_seasons',
    'downloaded_seasons'
]

class Request {
    constructor(options) {
        for(let prop of toCheck) {
            //console.log(prop,': ',options[prop]);
            if(non_empty(options[prop])) {
                if(boolean_properties.includes(prop)) {
                    this[prop] = Boolean(options[prop]);
                }
                else if(json_properties.includes(prop)) {
                    if(typeof options[prop] === 'string') {
                        try {
                            this[prop] = JSON.parse(options[prop])
                        }
                        catch(err) {
                            this[prop] = null
                        }
                    }
                    else if(options[prop] instanceof Array || options[prop] instanceof Object) {
                        this[prop] = options[prop];
                    }
                    else {
                        this[prop] = null;
                    }
                }
                else {
                    if(prop === 'content_name') {
                        this[prop] = options[prop].trim();
                    }
                    else if(typeof options[prop] === 'number' && isNaN(options[prop])) {
                        this[prop] = -1
                    }
                    else {
                        this[prop] = options[prop];
                    }
                }
            }
            else {
                this[prop] = null;
            }
        }
    }
    prune() {
        // Delete private/temporary variables
        let keys = Object.keys(this)
        for(let i in keys) {
            // if the property is private/temporary
            if(keys[i].startsWith('_')) {
                delete this[keys[i]];
            }
            
        }
        delete this['downloaded_seasons']

        for(let prop of json_properties) {
            try {
                this[prop] = (this[prop] instanceof Set ? JSON.stringify(Array.from(this[prop])) : JSON.stringify(this[prop]))
            }
            catch(err) {
                this[prop] = null
            }
        }
    }
    static validate(Request) {
        for(let elem in Request) {
            if(Request[elem] === null) {
                return false;
            }
            else {
                return true;
            }
        }
    }
}

module.exports = Request;