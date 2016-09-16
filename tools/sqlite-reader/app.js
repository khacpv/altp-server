var fs = require("fs");
var file = 'altp-kien.sqlite';
var exists = fs.existsSync(file);

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

var mongojs = require('mongojs');
var getConnStr = function() {
	
	var user = 'admin';
	var pass = 'Jnav2De-XvhE';
	var ip = '127.0.0.1';
	var port = '40426';
	var dbName = 'altp';

	return user + ':' + pass + '@' + ip + ':' + port + '/' + dbName;
};
var mongoDb = mongojs(getConnStr(), ['questions']);
var mongoQuestions = mongoDb.collection('questions');

db.serialize(function() {
	var TABLE_NAME = 'Question';
	var questions = [];

	// CREATE
	// if(!exists){
	// 	db.run('CREATE TABLE '+ TABLE_NAME +' (question TEXT, _id INT, level INT, casea TEXT, caseb TEXT, casec TEXT, cased TEXT, truecase INT)');
	// }

	// INSERT
	// var stmt = db.prepare('INSERT INTO '+ TABLE_NAME + ' (question, _id, level, casea, caseb, casec, cased, truecase) VALUES (?,?,?,?,?,?,?,?)');
	// for(var i=0;i<10;i++){
	// 	stmt.run('q',1,0,'a','b','c','d',i);
	// }

	// stmt.finalize();

	// SELECT
	db.each('SELECT _id, question, level, casea, caseb, casec, cased, truecase FROM ' + TABLE_NAME, function(err, row){
		if(!row){
			console.log('can not read db');
			return;
		}

		var item = {
			question: row.question,
			answers: [
				row.casea, row.caseb, row.casec, row.cased
			],
			answerRight: row.truecase -1,
			_id: row._id,
			level: row.level,
			rnd: Math.random()
		};

		if(!row.casea || row.casea.length == 0 || row.casea == ' '){
			
		}

		questions.push(item);

		// INSERT mongodb
		mongoQuestions.insert(item, function(err, itemQuestion){
			console.log('inserted: '+ itemQuestion._id);
		});

	}, function(){
		console.log('finish reading database:' + questions.length +' items');
	});
});

db.close();