// database.js

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
    // Not yet implemented
};
_.users.checkFor = (sqlWhereCondition, sqlWhereValue) => {
    // Not yet implemented
};
_.users.add = (User) => {
    // Not yet implemented
};
_.users.remove = (sqlWhereCondition, sqlWhereValue) => {
    // Not yet implemented
};
_.users.validateUser = (User) => {
    // Not yet implemented
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