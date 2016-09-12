var mongojs = require('mongojs');

var Mongo = {};

Mongo.IP = process.env.OPENSHIFT_MONGODB_DB_HOST || '127.0.0.1';
Mongo.PORT = process.env.OPENSHIFT_MONGODB_DB_PORT || '40426';
Mongo.dbName = process.env.OPENSHIFT_APP_NAME || 'altp';
Mongo.user = process.env.OPENSHIFT_MONGODB_DB_USERNAME || 'admin';
Mongo.pass = process.env.OPENSHIFT_MONGODB_DB_PASSWORD || 'Jnav2De-XvhE';

Mongo.connectionString = function () {
    return Mongo.user + ":" +
        Mongo.pass + "@" +
        Mongo.IP + ':' +
        Mongo.PORT + '/' +
        Mongo.dbName;
};

var db = mongojs(Mongo.connectionString(), ['altp','users','questions']);
var altp = db.collection('altp');
var users = db.collection('users');
var questions = db.collection('questions');

Mongo.db = db;
Mongo.altp = altp;
Mongo.users = users;
Mongo.questions = questions;

module.exports = Mongo;