/**
 * App.io.broadcast     - send to all
 * req.io.broadcast     - send to others
 * req.io.emit          - send to me
 * req.io.response(d)   - send http
 * req.io.join(r)    - join room
 * req.io.leave(r)   - leave room
 * req.io.room(r).broadcast(event, data)    - send to other members
 * app.io.room(r).broadcast(e,d)            - send to all members
 *
 * */
var User = require(__appname + '/model/user');
var Question = require(__appname + '/model/question');
var Room = require(__appname + '/model/room');

var mongoDb = require(__appname + '/mongodb/mongodb');

var altp = {
    rooms: [],
    dummyUsers: [
        new User(0, 'lam tam nhu', 'china', 'fb_id_0', 'http://www.nhipsongphunu.com/public/default/content/Images/Lam%20dep/avatar%20-20150311-14030457.jpg'),
        new User(1, 'trieu vy', 'hongkong', 'fb_id_1', 'http://avatar.nct.nixcdn.com/playlist/2013/11/07/2/e/6/4/1383813832087_500.jpg'),
        new User(2, 'michele', 'america', 'fb_id_2', 'http://media.todaybirthdays.com/thumb_x256x256/upload/2015/11/30/michelle-rodriguez.jpg'),
        new User(3, 'arvigne', 'brazin', 'fb_id_3', 'http://images2.fanpop.com/image/photos/9800000/beautiful-face-avril-lavigne-9812919-453-500.jpg')
    ]
};

altp.init = function (io) {
    io.on('connection', function (socket) {
        var sock = socket;

        /**
         * user click login (with FB or username/address)
         * @param data (name,address,fbId)
         * */
        var login = function (data) {
            var reqUser = data.user;

            console.log('login: ' + reqUser.name);

            if (!reqUser || reqUser.name.length == 0) {
                sock.emit('login', {success: false});
                return;
            }
            getUserById(reqUser.id, function (err, user) {
                if (user == null) {
                    user = new User(
                        reqUser.id || (Math.random() * 10000000),
                        reqUser.name || '',
                        reqUser.address || '',
                        reqUser.fbId || -1,
                        reqUser.avatar || '');

                    mongoDb.users.insert(user, function (err, user) {
                        console.log('login:insert:user:' + JSON.stringify(user));
                        console.log('login:insert:err:' + JSON.stringify(err));

                    });
                }
                sock.emit('login', {success: true, user: user});
            });
        };

        /**
         * user click search button. Get 2 users into a room.
         * @param data = {user.id}
         * */
        var search = function (data) {
            console.log(JSON.stringify(data));
            getUserById(data.user.id, function (err, user) {

                if (user == null) {
                    sock.emit('search', {err: 'user not found'});
                    return;
                }

                var room = null;
                var i;

                console.log('search: ' + JSON.stringify(user) + ' searching');

                for (i = 0; i < altp.rooms.length; i++) {
                    if (altp.rooms[i].users.length == 1) {
                        if (altp.rooms[i].users[0].id != user.id) {
                            console.log('user id: ' + altp.rooms[i].users[0].id + ' name:' + altp.rooms[i].users[0].name);
                            room = altp.rooms[i];
                            room.users.push(user);
                            break;
                        }
                    }
                }

                var processRoom = function(room){
                    // refresh state users
                    for (i = 0; i < room.users.length; i++) {
                        room.users[i].ready = false;
                        room.users[i].answerIndex = -1;
                        room.users[i].score = 0;
                    }

                    room.answerRight = 0;
                    room.questionIndex = 0;

                    sock.leave(user.room);
                    user.room = room.id;
                    sock.join(room.id);

                    var dataSearch = {
                        room: room,
                        dummyUsers: altp.dummyUsers
                    };

                    console.log('searchCallback: room:' + dataSearch.room.id + ' with user:' + room.users.length);

                    __io.to(room.id).emit('search', dataSearch);
                };

                if (room != null) {
                    processRoom(room);
                    return;
                }

                // create a new room
                getRandomQuestion(function(questions){
                    room = new Room('room#' + altp.rooms.length, [user], questions);
                    altp.rooms.push(room);

                    console.log('create room: '+ JSON.stringify(room));

                    processRoom(room);
                });
            });
        };

        /**
         * user click play after search
         * @param data = {user.id, room.id}
         * */
        var play = function (data) {
            getUserById(data.user.id, function (err, user) {
                var room = getRoomById(data.room.id);
                var i;
                var isAllReady = true;

                console.log('play: ' + user.name + ' ready!');

                for (i = 0; i < room.users.length; i++) {
                    if (room.users[i].id == user.id) {
                        room.users[i].ready = true;
                        break;
                    }
                }

                for (i = 0; i < room.users.length; i++) {
                    if (!room.users[i].ready) {
                        isAllReady = false;
                        break;
                    }
                }

                // if others user is not ready --> show waiting dialog
                if (!isAllReady) {
                    sock.emit('play', {notReady: true});
                    return;
                }

                var dataResponse = {
                    question: room.questions[room.questionIndex]
                };

                console.log('playCallback: question:' + dataResponse.question.question);

                __io.to(room.id).emit('play', dataResponse);
            });
        };

        /**
         * user answer an question
         * @param data = {user.id, room.id, answerIndex}
         * */
        var answer = function (data) {
            getUserById(data.user.id, function (err, user) {
                var room = getRoomById(data.room.id);
                var answerIndex = data.answerIndex;

                var i;
                var dataResponse;

                //console.log('answer: ' + user.name + ' answered '+data.answerIndex);

                for (var j = 0; j < room.users.length; j++) {
                    if (room.users[j].id == user.id) {
                        user.answerIndex = answerIndex;
                        room.users[j].answerIndex = answerIndex;
                        break;
                    }
                }

                var isAllAnswered = true;

                for (i = 0; i < room.users.length; i++) {
                    if (room.users[i].answerIndex < 0) {
                        isAllAnswered = false;
                        break;
                    }
                }

                if (!isAllAnswered) {
                    __io.to(room.id).emit('answer', {notAllAnswered: true});
                    return;
                }

                console.log('user ' + room.users[0].name + ' answered: ' + room.users[0].answerIndex);
                console.log('user ' + room.users[1].name + ' answered: ' + room.users[1].answerIndex);

                // calculate gameOver
                var answerRightIndex = room.questions[room.questionIndex].answerRight;

                // user 1 win
                if (answerRightIndex == room.users[0].answerIndex
                    && answerRightIndex != room.users[1].answerIndex) {
                    getUserById(room.users[0].id, function (err, winnerUser) {
                        addScore(winnerUser, 100);
                        addScore(room.users[0], 100);

                        room.users[0].winner = true;
                        room.users[1].winner = false;

                        dataResponse = {
                            answerRight: room.questions[room.questionIndex].answerRight,
                            user: user,
                            room: room
                        };

                        gameOver(dataResponse);
                    });
                    return;
                }
                // user 2 win
                else if (answerRightIndex != room.users[0].answerIndex
                    && answerRightIndex == room.users[1].answerIndex) {
                    getUserById(room.users[1].id, function (err, winnerUser) {
                        addScore(winnerUser, 100);
                        addScore(room.users[1], 100);

                        room.users[0].winner = false;
                        room.users[1].winner = true;

                        dataResponse = {
                            answerRight: room.questions[room.questionIndex].answerRight,
                            user: user,
                            room: room
                        };

                        gameOver(dataResponse);
                    });
                    return;
                }
                // draw: both wrong
                else if (answerRightIndex != room.users[0].answerIndex
                    && answerRightIndex != room.users[1].answerIndex) {

                    room.users[0].winner = false;
                    room.users[1].winner = false;

                    dataResponse = {
                        answerRight: room.questions[room.questionIndex].answerRight,
                        user: user,
                        room: room
                    };

                    gameOver(dataResponse);
                    return;
                }

                // next question
                for (i = 0; i < room.users.length; i++) {
                    if (room.questions[room.questionIndex].answerRight == room.users[i].answerIndex) {
                        addScore(room.users[i], 100);
                    }
                }

                dataResponse = {
                    answerRight: room.questions[room.questionIndex].answerRight,
                    answerUsers: room.users
                };

                console.log('answerCallback: answerRight:' + dataResponse.answerRight);

                room.questionIndex++;
                __io.to(room.id).emit('answer', dataResponse);

                // game over
                if (room.questionIndex == room.questions.length) {
                    room.users[0].winner = true;
                    room.users[1].winner = true;

                    setTimeout(function(){
                        data.lastQuestion = true;
                        data.room = room;
                        gameOver(data);
                    }, 5000);
                }
            });
        };

        /**
         * get next question
         * @param data = {user.id, room.id}
         * */
        var answerNext = function (data) {
            getUserById(data.user.id, function (err, user) {
                var room = getRoomById(data.room.id);

                var numUserAnswer = 0;
                var i;
                for (i = 0; i < room.users.length; i++) {
                    if (room.users[i].answerIndex > -1) {
                        numUserAnswer++;
                    }
                }

                // if all users doesn't answer, not fired event callback
                if (numUserAnswer < 2) {
                    return;
                }

                for (i = 0; i < room.users.length; i++) {
                    room.users[i].answerIndex = -1;
                }

                if (room.questionIndex == room.questions.length) {
                    return;
                }

                var dataResponse = {
                    question: room.questions[room.questionIndex]
                };

                console.log('answerNext: ' + user.name + ' get nextQuestion:'+JSON.stringify(dataResponse.question));

                __io.to(room.id).emit('answerNext', dataResponse);
            });
        };

        /**
         * the game over, called by answer()
         * @param data = {user.id, room.id}
         * */
        var gameOver = function (data) {
            getUserById(data.user.id, function (err, user) {
                var room = getRoomById(data.room.id);

                console.log('gameOver: ' + user.name);

                var dataResponse = data;
                dataResponse.answerRight = data.answerRight;
                dataResponse.users = room.users;
                dataResponse.room = room;

                console.log('gameOverCallback: total users: ' + JSON.stringify(dataResponse));

                __io.to(room.id).emit('gameOver', dataResponse);
            });
        };

        var quit = function (data) {
            getUserById(data.user.id, function (err, user) {
                var room = getRoomById(data.room.id);

                // delete current room (one user quit)

                var dataResponse = {
                    user: user,
                    room: room
                };

                __io.to(room.id).emit('quit', dataResponse);
            });
        };

        socket.on('login', login);
        socket.on('search', search);
        socket.on('play', play);
        socket.on('answer', answer);
        socket.on('answerNext', answerNext);
        socket.on('gameOver', gameOver);
        socket.on('quit', quit);
    });
};

/************** UTILITIES **************/

/**
 * add score to user
 * @return user object
 * */
var addScore = function (user, score) {
    user.score += score;
};

/**
 * @param userId id of user
 * @return user object
 * */
var getUserById = function (userId, callback) {
    mongoDb.users.findOne({id: userId}, callback);
};

/**
 * @param roomId id of room
 * @return room object
 * */
var getRoomById = function (roomId) {
    for (var i = 0; i < altp.rooms.length; i++) {
        if (roomId == altp.rooms[i].id) {
            return altp.rooms[i];
        }
    }
    return null;
};

/**
 * get random 15 questions from database
 * */
var getRandomQuestion = function (callback) {
    var QUESTION_NUMBERS = 15;
    var questions = [];
    var random = Math.random();

    console.log('------ random: '+ random);

    // get one question for each level (1... 15)
    for (var i = 1; i <= QUESTION_NUMBERS; i++) {
        var query = {
            "level": i,
            "rnd": {
                $gte: random
            }
        };

        mongoDb.questions.findOne({$query: query, $orderby: {rnd: 1}}, function(err, item){
            var question = new Question('1+1=?',['1','2','3','4'],1,i);

            if(item){
                question = new Question(item.question, item.answers, item.answerRight, Math.floor(item.level)-1);
            }

            questions.push(question);

            console.log('from db: '+ JSON.stringify(item));

            if(questions.length == QUESTION_NUMBERS){
                callback(questions);
            }
        });
    }
};

module.exports = altp;