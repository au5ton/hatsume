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
            'tvdb_id',
            'content_name',
            'is_tv',
            '_imdb_entry',
            '_tvdb_entry',
            '_tvdb_url'
        ];

        for(let i in toCheck) {
            //console.log(toCheck[i],': ',options[toCheck[i]]);
            if(non_empty(options[toCheck[i]])) {
                if(toCheck[i] === 'is_tv') {
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
        delete this['_imdb_entry'];
        delete this['_tvdb_entry'];
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