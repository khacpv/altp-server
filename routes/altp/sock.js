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

var dummyUsers = require(__appname + '/data/dummy_user');
var gameOverMessages = require(__appname + '/data/gameover_message');

const NUM_DUMMY_USERS = 6;  // 6 search players

var altp = {
    rooms: [],
    dummyUsers: dummyUsers,
    messages: gameOverMessages,
    socks: {}
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
                        reqUser.avatar || '',
                        reqUser.lang || 'vi');

                    mongoDb.users.insert(user, function (err, user) {
                        console.log('login:insert:user:' + JSON.stringify(user));
                        console.log('login:insert:err:' + JSON.stringify(err));

                    });

                    console.log('login: ' + JSON.stringify(user));
                    sock.emit('login', {success: true, user: user});
                }
                else {
                    reqUser.totalScore = user.totalScore;
                    mongoDb.users.update({id: reqUser.id}, reqUser, function (err, result) {
                        if (err) {
                            console.log('update user error:' + err);
                            return;
                        }
                        console.log('update user: ' + JSON.stringify(result));
                        console.log('update user reqUser: ' + JSON.stringify(reqUser));
                        sock.emit('login', {success: true, user: reqUser});
                    });
                }
            });
        };

        /**
         * user click search button. Get 2 users into a room.
         * @param data = {user.id}
         * */
        var search = function (data) {
            getUserById(data.user.id, function (err, user) {

                if (user == null) {
                    sock.emit('search', {err: 'user not found'});
                    return;
                }

                var room = null;
                var i;

                console.log('search: ' + JSON.stringify(user) + ' searching...');

                for (i = 0; i < altp.rooms.length; i++) {
                    if (altp.rooms[i].users.length == 1) {
                        if (altp.rooms[i].users[0].id != user.id) {
                            console.log('search room: 0:' + ' name:' + altp.rooms[i].users[0].name + ' totalScore:' + altp.rooms[i].users[0].totalScore);
                            console.log('search room: user: ' + ' name:' + user.name + ' totalScore:' + user.totalScore);
                            room = altp.rooms[i];
                            room.users.push(user);
                            break;
                        }
                    }
                }

                // remove old room
                if (room == null) {
                    var existRoomId = [];
                    for (i = 0; i < altp.rooms.length; i++) {
                        if (altp.rooms[i].users[0] && altp.rooms[i].users[0].id == user.id) {
                            existRoomId.push(i);
                        }
                        else if (altp.rooms[i].users[1] && altp.rooms[i].users[1].id == user.id) {
                            existRoomId.push(i);
                        }
                    }
                    for (i = existRoomId.length - 1; i >= 0; i--) {
                        console.log('remove room: ' + altp.rooms[existRoomId[i]].id);
                        altp.rooms.splice(existRoomId[i]);
                    }
                }

                var processRoom = function (room) {
                    // refresh state users
                    for (i = 0; i < room.users.length; i++) {
                        room.users[i].ready = false;
                        room.users[i].answerIndex = -1;
                        room.users[i].score = 0;
                    }

                    room.answerRight = 0;
                    room.questionIndex = 0;

                    clearRoom(room);
                    user.room = room.id;
                    joinRoom(sock, room);

                    var dataSearch = {
                        room: room,
                        dummyUsers: getDummyUsers(NUM_DUMMY_USERS)
                    };

                    console.log('searchCallback: room:' + dataSearch.room.id + ' with user:' + room.users.length);

                    __io.to(room.id).emit('search', dataSearch);
                };

                if (room != null) {
                    processRoom(room);
                    return;
                }

                // create a new room
                getRandomQuestion(function (questions) {
                    room = new Room('room#' + altp.rooms.length, [user], questions);
                    altp.rooms.push(room);

                    console.log('searchCallback: create room: ' + JSON.stringify(room));

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

                // for reconnect
                joinRoom(sock,room);

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

                // for reconnect
                joinRoom(sock,room);

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
                    console.log('waiting for other answer...');
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
                        addScore(winnerUser, room.questionIndex);
                        addScore(room.users[0], room.questionIndex);

                        subScore(room.users[1], room.questionIndex);

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
                        addScore(winnerUser, room.questionIndex);
                        addScore(room.users[1], room.questionIndex);

                        subScore(room.users[0], room.questionIndex);

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

                    subScore(room.users[0], room.questionIndex);
                    subScore(room.users[1], room.questionIndex);

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
                        addScore(room.users[i], room.questionIndex);
                    }
                }

                // game over
                if (room.questionIndex == room.questions.length - 1) {
                    console.log('answerCallback: lastQuestion: ' + room.questionIndex);

                    setTimeout(function () {
                        data.lastQuestion = true;
                        data.room = room;
                        gameOver(data);
                    }, 5000);
                } else {
                    dataResponse = {
                        answerRight: room.questions[room.questionIndex].answerRight,
                        answerUsers: room.users
                    };

                    console.log('answerCallback: answerRight:' + dataResponse.answerRight);

                    room.questionIndex++;
                    __io.to(room.id).emit('answer', dataResponse);
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

                // for reconnect
                joinRoom(sock,room);

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


                console.log('set answer index to -1');
                for (i = 0; i < room.users.length; i++) {
                    room.users[i].answerIndex = -1;
                }

                if (room.questionIndex == room.questions.length) {
                    return;
                }

                var dataResponse = {
                    room: room,
                    question: room.questions[room.questionIndex]
                };

                console.log('answerNext: ' + user.name + ' get nextQuestion:' + JSON.stringify(dataResponse.question));

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

                // for reconnect
                joinRoom(sock,room);

                console.log('gameOver: ' + user.name);

                var dataResponse = data;
                dataResponse.answerRight = data.answerRight;
                dataResponse.users = room.users;
                dataResponse.room = room;
                dataResponse.messages = getGameOverMessages('vi');

                for (var i = 0; i < room.users.length; i++) {
                    if (room.users[i].winner) {
                        room.users[i].totalScore += room.users[i].score;

                        mongoDb.users.update({id: room.users[i].id}, room.users[i], {upsert: true}, function (err, data) {
                            console.log('update user: ERR=' + err);
                        });
                    }
                }

                console.log('gameOverCallback: room: ' + JSON.stringify(room));

                __io.to(room.id).emit('gameOver', dataResponse);
            });
        };

        var quit = function (data) {
            var isPlay = data.isPlay;

            getUserById(data.user.id, function (err, user) {
                var room = getRoomById(data.room.id);

                // sub score if a use quit
                if (room.users[0].id == user.id) {
                    subScore(room.users[0], room.questionIndex);
                } else {
                    subScore(room.users[1], room.questionIndex);
                }

                var dataResponse = data;
                dataResponse.answerRight = room.answerRight;
                dataResponse.room = room;
                dataResponse.users = room.users;
                dataResponse.quitUserId = user.id;
                dataResponse.messages = getGameOverMessages('vi');

                __io.to(room.id).emit('quit', dataResponse);

                // delete current room (one user quit)
                if (!isPlay) {
                    for (var i = altp.rooms.length - 1; i >= 0; i--) {
                        if (room.id == altp.rooms[i].id) {
                            console.log('quit: delete room ' + room.id);
                            altp.rooms.splice(i);
                            break;
                        }
                    }
                }

                clearRoom(room);
            });
        };

        var disconnect = function (data) {
            console.log('socket disconnect');
        };

        socket.on('login', login);
        socket.on('search', search);
        socket.on('play', play);
        socket.on('answer', answer);
        socket.on('answerNext', answerNext);
        socket.on('gameOver', gameOver);
        socket.on('quit', quit);
        socket.on('disconnect', disconnect);
    });
};

/************** UTILITIES **************/

/**
 * join socket into room
 * @param sock
 * @param room
 */
var joinRoom = function (sock, room) {
    sock.join(room.id);
    if (!altp.socks[room.id]) {
        altp.socks[room.id] = [];
    }
    altp.socks[room.id].push(sock);
};

/**
 * clear socket in room
 * @param room
 */
var clearRoom = function (room) {
    var roomSocket = altp.socks[room.id];
    for (var i = 0; i < roomSocket.length; i++) {
        roomSocket[i].leave(room.id);
    }
    delete altp.socks[room.id];
};

/**
 * get dummy user
 * @param numUsers number user want to get
 */
var getDummyUsers = function (numUsers) {
    var random = Math.floor(Math.random() * (altp.dummyUsers.length - numUsers));
    var dummyUsers = altp.dummyUsers.slice(random, random + numUsers);
    return dummyUsers;
};

/**
 * get game over message to display.
 *
 * @param lang language
 * @returns object message
 */
var getGameOverMessages = function (lang) {
    var random = Math.floor(Math.random() * 10) + 1;
    var result = {
        win: altp.messages.win[random % altp.messages.win.length],
        lose: altp.messages.lose[random % altp.messages.lose.length],
        draw: altp.messages.draw[random % altp.messages.draw.length]
    };
    return result;
};

/**
 * add score to user. and set winner = true
 * @return user object
 * */
var addScore = function (user, questionIndex) {
    user.winner = true;

    var scoreTable = [
        200, 400, 600, 1000, 2000, //
        3000, 6000, 10000, 14000, 22000, //
        30000, 40000, 60000, 85000, 150000
    ];

    user.score = scoreTable[questionIndex];
};

/**
 * subtract score to anchor. and set winner = false
 * */
var subScore = function (user, questionIndex) {
    user.winner = false;
    if (questionIndex <= 1) {
        user.score = 0;
    } else if (questionIndex < 5) {
        user.score = 200;
    } else if (questionIndex < 10) {
        user.score = 2000;
    } else {
        user.score = 22000;
    }
};

/**
 * @param userId id of user
 * @param callback callback
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

    console.log('------ random: ' + random);

    // get one question for each level (1... 15)
    for (var i = 1; i <= QUESTION_NUMBERS; i++) {
        var query = {
            "level": i,
            "rnd": {
                $gte: random
            }
        };

        mongoDb.questions.findOne({$query: query, $orderby: {rnd: 1}}, function (err, item) {
            var question = new Question('Ngày 22/05/1960, một trận động đất mạnh 9.5 độ richter xảy ra tại quốc gia nào?', ['Chile', 'Nga', 'Hoa Kỳ', 'Indonesia'], 0, i);

            if (item) {
                question = new Question(item.question, item.answers, item.answerRight, Math.floor(item.level));
            }

            questions.push(question);

            console.log('from db: ' + JSON.stringify(item));

            if (questions.length == QUESTION_NUMBERS) {

                questions.sort(function (q1, q2) {
                    return q1.questionIndex - q2.questionIndex;
                });

                callback(questions);
            }
        });
    }
};

module.exports = altp;