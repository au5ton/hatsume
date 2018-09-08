// database.js

require('au5ton-logger')();

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
| is_tv        | tinyint(1)   | YES  |     | NULL    |                |
| tmdb_id      | int(11)      | YES  |     | NULL    |                |
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

_.users.get = (sqlWhereKey, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('users').select().where(sqlWhereKey,sqlWhereValue).toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else if(results.length === 0) {
                reject('error/users.get: results array empty');
            }
            else {
                resolve(new User(results[0]));
            }
        })
    });
};
_.users.checkFor = (sqlWhereKey, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        _.users.get(sqlWhereKey,sqlWhereValue).then((results) => {
            resolve('found')
        }).catch(err => {
            console.log 
            if (err === 'error/users.get: results array empty') {
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
                reject('error/users.getall: results array empty');
            }
            else {
                let ray = [];
                for(let i in results) {
                    ray.push(new User(results[i]));
                }
                resolve(ray);
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
_.users.remove = (sqlWhereKey, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('users').where(sqlWhereKey,sqlWhereValue).del().toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        })
    });
};
_.users.validate = (sqlWhereKey, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        _.users.get(sqlWhereKey, sqlWhereValue)
        .then(myUser => resolve(User.validate(myUser)))
        .catch(err => reject(err))
    });
};
_.users.update = (sqlWhereKey, sqlWhereValue, new_properties) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('users').where(sqlWhereKey, sqlWhereValue).update(new_properties).toString(), (error, results, fields) => {
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
*/

_.requests.add = (myRequest) => {
    myRequest.prune(); // remove _imdb_tvdb entry
    return new Promise((resolve, reject) => {
        // check for duplicate
        _.requests.checkForOneByIds(myRequest['telegram_id'], myRequest['content_name']).then(status => {
            if(status === 'missing') {
                pool.query(knex('requests').insert(myRequest).toString(), (error, results, fields) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve({
                            status: 'good',
                            request: myRequest
                        })
                    }
                });
            }
            else {
                // do nothing if a dupe is trying to be added
                resolve({
                    status: 'duplicate',
                    request: myRequest
                })
            }
        }).catch(err => reject(err));
    })
};
_.requests.removeMultiple = (sqlWhereKey, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('requests').where(sqlWhereKey,sqlWhereValue).del().toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        })
    });
};
_.requests.removeOneByIds = (telegram_id, key, value) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('requests').where('telegram_id', telegram_id).andWhere(key,value).del().toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        })
    });
};
/**
 * 
 * @param {string} sqlWhereKey 
 * @param {*} sqlWhereValue 
 * @returns {Request[]} requests
 */
_.requests.getMultiple = (sqlWhereKey, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('requests').select().where(sqlWhereKey,sqlWhereValue).toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else if(results.length === 0) {
                //reject('error/requests.getmultiple: results array empty');
                resolve([])
            }
            else {
                let ray = [];
                for(let i in results) {
                    ray.push(new Request(results[i]));
                }
                resolve(ray);
            }
        });
    });
};
/**
 * @returns {Requests[]} requests
 */
_.requests.getAll = () => {
    return new Promise((resolve, reject) => {
        pool.query(knex('requests').select('*').toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else if(results.length === 0) {
                reject('error/requests.getall: results array empty');
            }
            else {
                let ray = [];
                for(let i in results) {
                    ray.push(new Request(results[i]));
                }
                resolve(ray);
            }
        });
    });
};
/**
 * 
 * @param {number} telegram_id 
 * @param {string} imdb_id 
 * @returns {Request} request
 */
_.requests.getOneByIds = (telegram_id, content_name) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('requests').select().where('telegram_id', telegram_id).andWhere('content_name',content_name.trim()).toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else if(results.length === 0) {
                reject('error/requests.getonebyids: results array empty');
            }
            else {
                resolve(new Request(results[0]));
            }
        })
    });
};
/**
 * 
 * @param {number} telegram_id 
 * @param {string} imdb_id 
 * @returns {string} 'found'||'missing'
 */
_.requests.checkForOneByIds = (telegram_id, content_name) => {
    return new Promise((resolve, reject) => {
        _.requests.getOneByIds(telegram_id,content_name).then((results) => {
            resolve('found')
        }).catch(err => {
            if (err === 'error/requests.getonebyids: results array empty') {
                resolve('missing')
            }
            else {
                reject(err);
            }
        });
    });
};
/**
 * 
 * @param {string} sqlWhereKey 
 * @param {*} sqlWhereValue 
 * @returns {string} 'found'||'missing'
 */
_.requests.checkMultiple = (sqlWhereKey, sqlWhereValue) => {
    return new Promise((resolve, reject) => {
        _.requests.getMultiple(sqlWhereKey,sqlWhereValue).then((results) => {
            if(results.length > 0) {
                resolve('found')
            }
            else {
                resolve('missing')
            }
        }).catch(err => {
            reject(err);
        });
    });
};
_.requests.checkThreePairs = (sqlWhereKeyA, sqlWhereValueA, sqlWhereKeyB, sqlWhereValueB, sqlWhereKeyC, sqlWhereValueC) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('requests').select().where(sqlWhereKeyA,sqlWhereValueA).andWhere(sqlWhereKeyB,sqlWhereValueB).andWhere(sqlWhereKeyC,sqlWhereValueC).toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else if(results.length === 0) {
                resolve('missing')
            }
            else {
                resolve('found')
            }
        });
    });
}
_.requests.cancelAllCompositions = (telegram_id) => {
    //Technically misusing my own function
    return new Promise((resolve, reject) => {
        _.requests.removeOneByIds(telegram_id, 'done_composing', false)
        .then(info => {
            resolve(info)
        })
        .catch(err => {
            reject(err)
        })
    });
};
_.requests.update = (sqlWhereKey, sqlWhereValue, new_properties) => {
    return new Promise((resolve, reject) => {
        pool.query(knex('requests').where(sqlWhereKey, sqlWhereValue).update(new_properties).toString(), (error, results, fields) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        });
    });
};

module.exports = _;