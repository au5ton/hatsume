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

class Request {
    constructor(options) {
        let toCheck = [
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
            'done_composing',
            '_imdb_entry',
            '_tvdb_entry',
            '_tvdb_url'
        ];
        let boolean_properties = [
            'is_tv',
            'done_composing'
        ]

        for(let i in toCheck) {
            //console.log(toCheck[i],': ',options[toCheck[i]]);
            if(non_empty(options[toCheck[i]])) {
                if(boolean_properties.includes(toCheck[i])) {
                    this[toCheck[i]] = Boolean(options[toCheck[i]]);
                }
                else {
                    this[toCheck[i]] = options[toCheck[i]];
                }
            }
            else {
                this[toCheck[i]] = null;
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

        // Turn Set into a JSON string
        this.available_seasons = (this.available_seasons !== null ? JSON.stringify(Array.from(this.available_seasons)) : null);
        this.desired_seasons = (this.desired_seasons !== null ? JSON.stringify(Array.from(this.desired_seasons)) : null);
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