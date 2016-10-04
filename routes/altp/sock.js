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
const QUESTION_NUMBERS = 15;

const SCORE_TABLE = [
    200, 400, 600, 1000, 2000, //
    3000, 6000, 10000, 14000, 22000, //
    30000, 40000, 60000, 85000, 150000
];

const DEF_LANG = 'vi';

var altp = {
    rooms: [],
    dummyUsers: dummyUsers,
    messages: gameOverMessages,
    socks: {},
    questions: {}
};

altp.init = function (io) {

    // fetch all questions from database into memory
    getAllQuestionFromDb();

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
                        reqUser.lang || DEF_LANG);

                    mongoDb.users.insert(user, function (err, user) {
                        console.log('login:insert:ERR:' + JSON.stringify(err));
                        console.log('login:insert:user:' + JSON.stringify(user));

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

                console.log('search: ' + user.name + ' searching...');

                var exitedRoomId = [];

                // find an available room (has 1 user only)
                for (i = altp.rooms.length - 1; i >= 0; i--) {
                    if (altp.rooms[i].users.length == 1) {  // has 1 user
                        if (altp.rooms[i].users[0].id != user.id) { // not my user
                            console.log('search room: user: ' + user.name + ' totalScore:' + user.totalScore);
                            room = altp.rooms[i];
                            room.users.push(user);
                            break;
                        }
                        else {   // if I'm in the room, mark to clear
                            exitedRoomId.push(i);
                        }
                    } else if (altp.rooms[i].users.length == 2) { // room has 2 user
                        if (altp.rooms[i].users[0].id == user.id || altp.rooms[i].users[1].id == user.id) { // room contain me
                            exitedRoomId.push(i);
                        }
                    }
                }

                // remove old room
                if (room == null) {
                    // clear exited room
                    if (exitedRoomId.length > 0) {
                        for (i = exitedRoomId.length - 1; i >= 0; i--) {
                            console.log('remove room: ' + altp.rooms[exitedRoomId[i]].id);
                            clearRoom(altp.rooms[exitedRoomId[i]]);
                        }
                    }
                }

                // add user to room, reset info
                var processRoom = function (room) {
                    // refresh state users
                    for (i = 0; i < room.users.length; i++) {
                        room.users[i].ready = false;
                        room.users[i].answerIndex = -1;
                        room.users[i].score = 0;
                    }

                    // refresh state of room
                    room.answerRight = 0;
                    room.questionIndex = 0;

                    user.room = room.id;
                    joinRoom(sock, room);

                    var dataSearch = {
                        room: room,
                        dummyUsers: getDummyUsers(NUM_DUMMY_USERS)
                    };

                    console.log('searchCallback: room:' + dataSearch.room.id + ' with total users:' + room.users.length);

                    __io.to(room.id).emit('search', dataSearch);
                };

                // process room
                if (room != null) {
                    clearTimeout(sock.autoBotTimeOut);
                    delete sock.autoBotTimeOut;

                    processRoom(room);
                    return;
                }

                // if room is not exited, create a new one
                var getQuestionCallback = function (questions) {
                    room = new Room('room#' + altp.rooms.length + '#' + user.id, [user], questions);
                    altp.rooms.push(room);

                    console.log('searchCallback: create room: ' + JSON.stringify(room));

                    // TODO add a bot after timeout: change timeout
                    sock.autoBotTimeOut = setTimeout(function () {
                        console.log('searchCallback: add a bot');

                        var botIndex = Math.randomBetween(0, altp.dummyUsers.length - 1);
                        var autoBot = altp.dummyUsers[botIndex];
                        autoBot.isAutoBot = true;
                        room.users.push(autoBot);

                        processRoom(room);
                    }, Math.randomBetween(10, 15) * 1000);  // find user between 10 to 15 seconds

                    processRoom(room);
                };

                // if questions is not loaded to memory -> get from database
                if (altp.questions.loadedToMemory) {
                    getRandomQuestion(getQuestionCallback);
                } else {
                    getRandomQuestionFromDb(getQuestionCallback);
                }
            });
        };

        /**
         * user click play after search
         * @param data = {user.id, room.id}
         * */
        var play = function (data) {
            getUserById(data.user.id, function (err, user) {
                if (user == null) {
                    console.log('err: user not found');
                    sock.emit('err', {err: 'user not found'});
                    return;
                }

                var room = getRoomById(data.room.id);
                var i;
                var isAllReady = true;
                var isPlayWithBot = false;

                // for reconnect
                joinRoom(sock, room);

                console.log('play: ' + user.name + ' ready!');

                for (i = 0; i < room.users.length; i++) {
                    if (room.users[i].id == user.id) {
                        room.users[i].ready = true;
                    }
                    else if (room.users[i].isAutoBot) {
                        isPlayWithBot = true;
                    }
                }

                for (i = 0; i < room.users.length; i++) {
                    if (!room.users[i].ready) {
                        isAllReady = false;
                        break;
                    }
                }

                // if others user is not ready --> show waiting dialog
                if (!isAllReady && !isPlayWithBot) {
                    sock.emit('play', {notReady: true});
                    return;
                }

                // all ready or is play with bot

                var sendPlayCallback = function () {
                    var dataResponse = {
                        question: room.questions[room.questionIndex]
                    };

                    console.log('playCallback: question:' + dataResponse.question.question);

                    __io.to(room.id).emit('play', dataResponse);
                };

                if (!isPlayWithBot) {
                    sendPlayCallback();
                    return;
                }

                // TODO change timeout
                console.log('playCallback: all player should ready after 2000 ms');
                setTimeout(sendPlayCallback, 2000);
            });
        };

        /**
         * user answer an question
         * @param data = {user.id, room.id, answerIndex}
         * */
        var answer = function (data) {
            getUserById(data.user.id, function (err, user) {
                if (user == null) {
                    console.log('err: user not found');
                    sock.emit('err', {err: 'user not found'});
                    return;
                }

                var room = getRoomById(data.room.id);
                var answerIndex = data.answerIndex;

                var answerRightIndex = room.questions[room.questionIndex].answerRight;

                // for reconnect
                joinRoom(sock, room);

                var i;
                var dataResponse;

                //console.log('answer: ' + user.name + ' answered '+data.answerIndex);

                for (i = 0; i < room.users.length; i++) {
                    if (room.users[i].id == user.id) {
                        user.answerIndex = answerIndex;
                        room.users[i].answerIndex = answerIndex;
                    }
                    else if (room.users[i].isAutoBot) {
                        // TODO random bot answer right or wrong?
                        room.users[i].answerIndex = answerRightIndex;
                    }
                }

                var isAllAnswered = true;

                // if have an answerIndex < 0 -> not all answered
                for (i = 0; i < room.users.length; i++) {
                    if (room.users[i].answerIndex < 0) {
                        isAllAnswered = false;
                        break;
                    }
                }

                // calculate gameOver
                if (!isAllAnswered || room.users.length < 2) {
                    console.log('answer: waiting for other answer...');
                    __io.to(room.id).emit('answer', {notAllAnswered: true});
                    return;
                }

                console.log('answer: user ' + room.users[0].name + ' answered: ' + room.users[0].answerIndex);
                console.log('answer: user ' + room.users[1].name + ' answered: ' + room.users[1].answerIndex);

                // user 1 win
                if (answerRightIndex == room.users[0].answerIndex
                    && answerRightIndex != room.users[1].answerIndex) {
                    getUserById(room.users[0].id, function (err, winnerUser) {
                        // auto-bot should not be found from database
                        if (winnerUser) {
                            addScore(winnerUser, room.questionIndex);
                        }

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
                        // auto-bot should not be found from database
                        if (winnerUser) {
                            addScore(winnerUser, room.questionIndex);
                        }

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
                if (user == null) {
                    console.log('err: user not found');
                    sock.emit('err', {err: 'user not found'});
                    return;
                }

                var room = getRoomById(data.room.id);

                // for reconnect
                joinRoom(sock, room);

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

                console.log('answerNext: set answer index to -1');
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
                if (user == null) {
                    console.log('err: user not found');
                    sock.emit('err', {err: 'user not found'});
                    return;
                }

                var room = getRoomById(data.room.id);

                // for reconnect
                joinRoom(sock, room);

                console.log('gameOver: ' + user.name);

                var dataResponse = data;
                dataResponse.answerRight = data.answerRight;
                dataResponse.users = room.users;
                dataResponse.room = room;
                dataResponse.messages = getGameOverMessages('vi');

                for (var i = 0; i < room.users.length; i++) {
                    if (room.users[i].winner && !room.users[i].isAutoBot) {
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

        /**
         * search Opponent or out of time when playing
         * @param data.isPlay true: play screen, false: otherwise
         */
        var quit = function (data) {
            var isPlay = data.isPlay;

            getUserById(data.user.id, function (err, user) {
                var room = getRoomById(data.room.id);

                console.log('quit: user ' + user.name);

                if (!room) {
                    console.log('quit: room removed');
                    return;
                }
                // sub score if a use quit
                if (room.users[0] && room.users[0].id == user.id) {
                    subScore(room.users[0], room.questionIndex);
                } else if (room.users[1]) {
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
            console.log('socket disconnect: ' + JSON.stringify(data));
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
    // TODO check if socket is in room already -> dont need to join again
    var i;
    sock.join(room.id);
    if (!altp.socks[room.id]) {
        altp.socks[room.id] = [];
    }
    var isSockInRoom = false;
    for (i = altp.socks[room.id].length; i >= 0; i--) {
        if (altp.socks[room.id][i] && altp.socks[room.id][i].id == sock.id) {
            isSockInRoom = true;
            break;
        }
    }
    if (!isSockInRoom) {
        console.log('joinRoom: add sock ' + sock.id + ' into room: ' + room.id);
        altp.socks[room.id].push(sock);
    } else {
        console.log('joinRoom: sock ' + sock.id + ' already in room: ' + room.id);
    }
};

/**
 * clear socket in room & room in altp.rooms
 * @param room
 */
var clearRoom = function (room) {
    if (!altp.socks[room.id]) {
        console.log('dont need clear room:' + room.id);
        return;
    }
    var i;

    // leave socket
    var roomSocket = altp.socks[room.id];
    for (i = 0; i < roomSocket.length; i++) {
        console.log('clearRoom: socket:' + roomSocket[i].id + ' leaved room:' + room.id);
        roomSocket[i].leave(room.id);
    }

    delete altp.socks[room.id];

    // remove room
    for (i = altp.rooms.length - 1; i >= 0; i--) {
        if (altp.rooms[i].id == room.id) {
            altp.rooms.splice(i);
            break;
        }
    }

    console.log('roomSock: ' + JSON.stringify(altp.socks[room.id]));
};

/**
 * get dummy user
 * @param numUsers number user want to get
 */
var getDummyUsers = function (numUsers) {
    var random = Math.floor(Math.random() * (altp.dummyUsers.length - numUsers));
    return altp.dummyUsers.slice(random, random + numUsers);
};

/**
 * get game over message to display.
 *
 * @param lang language
 * @returns object message
 */
var getGameOverMessages = function (lang) {
    var random = Math.floor(Math.random() * 10) + 1;
    return {
        win: altp.messages.win[random % altp.messages.win.length],
        lose: altp.messages.lose[random % altp.messages.lose.length],
        draw: altp.messages.draw[random % altp.messages.draw.length]
    };
};

/**
 * add score to user. and set winner = true
 * @return user object
 * */
var addScore = function (user, questionIndex) {
    user.winner = true;
    user.score = SCORE_TABLE[questionIndex];
};

/**
 * subtract score to anchor. and set winner = false
 * */
var subScore = function (user, questionIndex) {
    user.winner = false;
    if (questionIndex <= 1) {
        user.score = 0;
    } else if (questionIndex < 5) {
        user.score = SCORE_TABLE[0];
    } else if (questionIndex < 10) {
        user.score = SCORE_TABLE[4];
    } else {
        user.score = SCORE_TABLE[9];
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
 * get all questions from database
 */
var getAllQuestionFromDb = function () {
    altp.questions.loadedToMemory = false;
    mongoDb.questions.find(function (err, data) {
        console.log('getAllQuestionFromDb: ERR:' + err);
        console.log('getAllQuestionFromDb: size:' + data.length);

        var size = data.length;
        for (var i = 0; i < size; i++) {
            if (!altp.questions[data[i].level]) {
                altp.questions[data[i].level] = [];
            }
            altp.questions[data[i].level].push(data[i]);
        }

        altp.questions.loadedToMemory = true;
    });
};

/**
 * get random 15 questions from memory
 * @param callback
 */
var getRandomQuestion = function (callback) {
    var QUESTION_NUMBERS = 15;
    var questions = [];
    var question;
    var item;
    var index = 0;

    for (var i = 1; i <= QUESTION_NUMBERS; i++) {
        index = Math.randomBetween(0, altp.questions[i].length - 1);
        item = altp.questions[i][index];
        question = new Question(item.question, item.answers, item.answerRight, Math.floor(item.level));
        questions.push(question);
        console.log('from mem: ' + JSON.stringify(item));
    }
    callback(questions);
};

/**
 * get random 15 questions from database
 * @Deprecated
 * */
var getRandomQuestionFromDb = function (callback) {
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

            question.questionIndex = Math.min(QUESTION_NUMBERS, question.questionIndex);

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