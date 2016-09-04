var express = require('express');
var mongoDb = require(__appname + '/mongodb/mongodb');
var router = express.Router();


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('altp/altp', {title: 'Ai La Trieu Phu online'});
});

router.get('/users', function (req, res, next) {
    mongoDb.users.find(function (err, users) {
        res.render('altp/users', {title: 'Users', users: users});
    });
});

router.delete('/users/:userId', function (req, res, next) {
    var userId = req.params.userId;

    mongoDb.users.remove({'_id': mongoDb.db.ObjectId(userId)},function(err, result){
        res.send({err: err});
    });
});

router.post('/users/:userId', function(req, res, next){
    var userId = req.params.userId;
    var newUser = req.body.user;
    newUser._id = mongoDb.db.ObjectId(userId);

    mongoDb.users.save(newUser,function(err, result){
        console.log(err);
        res.send({err: err});
    });
});

module.exports = router;