// database.js

const logger = require('au5ton-logger');

// Custom modules
const User = require('./classes/User');
const Request = require('./classes/Request');


const mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MARIADB_HOST,
    user: process.env.MARIADB_USER,
    password: process.env.MARIADB_PASS,
    database: process.env.MARIADB_DB
});

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host : process.env.MARIADB_HOST,
        user : process.env.MARIADB_USER,
        password : process.env.MARIADB_PASS,
        database : process.env.MARIADB_DB
    },
    pool: { min: 0, max: 8}
});


const _ = {};
_.users = {};
_.requests = {};

// database schema
/*
Table: users;
+--------------------+-------------+------+-----+---------+-------+
| Field              | Type        | Null | Key | Default | Extra |
+--------------------+-------------+------+-----+---------+-------+
| telegram_id        | int(11)     | YES  |     | NULL    |       |
| telegram_name      | varchar(40) | YES  |     | NULL    |       |
| telegram_handle    | varchar(33) | YES  |     | NULL    |       |
| plex_username      | varchar(50) | YES  |     | NULL    |       |
| accepted_agreement | tinyint(1)  | NO   |     | 0       |       |
+--------------------+-------------+------+-----+---------+-------+

table: requests
+--------------+--------------+------+-----+---------+----------------+
| Field        | Type         | Null | Key | Default | Extra          |
+--------------+--------------+------+-----+---------+----------------+
| request_id   | int(11)      | NO   | PRI | NULL    | auto_increment |
| telegram_id  | int(11)      | YES  |     | NULL    |                |
| imdb_id      | varchar(20)  | YES  |     | NULL    |                |
| tvdb_id      | int(11)      | YES  |     | NULL    |                |
| content_name | varchar(255) | YES  |     | NULL    |                |
+--------------+--------------+------+-----+---------+----------------+
*/

// User functions
/* 
users.checkFor (whereCond, whereVal) => Promise/boolean
users.get (whereCond, whereVal) => Promise/User
users.add(User) => Promise/status
users.remove(whereCond, whereVal) => Promise/status
users.validateUser(User) => Promise/status
*/

_.users.get = (sqlWhereCondition, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('users').select().where(sqlWhereCondition,sqlWhereValue).toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else if(results.length === 0) {
                reject('error: results array empty');
            }
            else {
                resolve(new User(results[0]));
            }
        })
    });
};
_.users.checkFor = (sqlWhereCondition, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        _.users.get(sqlWhereCondition,sqlWhereValue).then((results) => {
            resolve('found')
        }).catch(err => {
            if (err === 'error: results array empty') {
                resolve('missing')
            }
            else {
                reject(err);
            }
        });
    });
};
_.users.getAll = () => {
    return new Promise((resolve, reject) => {
        pool.query(knex('users').select('*').toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else if(results.length === 0) {
                reject('error: results array empty');
            }
            else {
                for(let i in results) {
                    let ray = [];
                    ray.push(new User(results[i]));
                    resolve(ray);
                }
            }
        });
    });
};
_.users.add = (myUser) => {
    return new Promise((resolve, reject) => {
        // check for duplicate
        _.users.checkFor('telegram_id',myUser['telegram_id']).then(status => {
            if(status === 'missing') {
                pool.query(knex('users').insert(myUser).toString(), (error, results, fields) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(results);
                    }
                });
            }
            else {
                // do nothing if a dupe is trying to be added
                resolve('already added')
            }
        }).catch(err => reject(err));
    })
};
_.users.remove = (sqlWhereCondition, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('users').where(sqlWhereCondition,sqlWhereValue).del().toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        })
    });
};
_.users.validate = (sqlWhereCondition, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        _.users.get(sqlWhereCondition, sqlWhereValue)
        .then(myUser => resolve(User.validate(myUser)))
        .catch(err => reject(err))
    });
};
_.users.update = (sqlWhereCondition, sqlWhereValue, new_properties) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('users').where(sqlWhereCondition, sqlWhereValue).update(new_properties).toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        });
    });
};
_.users.setState = (telegram_id, newState) => {
    return _.users.update('telegram_id', telegram_id, {chat_state: newState});
};
_.users.getState = (telegram_id) => {
    return new Promise((resolve, reject) => {
        _.users.get('telegram_id',telegram_id).then(myUser => {
            resolve(myUser.chat_state);
        }).catch(err => reject(err));
    })
};
_.users.init = (telegram_id, telegram_name, telegram_handle) => {
    return _.users.add(new User({
        telegram_id: telegram_id,
        telegram_name: telegram_name,
        telegram_handle: telegram_handle,
        chat_state: 1
    }));
};


// Requests functions
/*
requests.add(Request) => Promise/status
request.get(whereCond, whereVal) => Promise/Request
request.remove(whereCond, whereVal) => Promise/status
*/

_.requests.add = (Request) => {
    // Not yet implemented
};
_.requests.remove = (sqlWhereCondition, sqlWhereValue) => {
    // Not yet implemented
};
_.requests.get = (sqlWhereCondition, sqlWhereValue) => {
    // Not yet implemented
};

module.exports = _;