var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('altp/altp',{title:'Ai La Trieu Phu online'});
});

module.exports = router;