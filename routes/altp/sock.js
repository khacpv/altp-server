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

var altp = {
    users: [],
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
            var isExist = false;
            var resUser = {};

            for (var i = 0; i < altp.users.length; i++) {
                if (altp.users[i].id === reqUser.id) {
                    isExist = true;
                    resUser = altp.users[i];
                    break;
                }
            }
            if (!isExist) {
                resUser = new User((Math.random() * 10000000) | 0, reqUser.name || '', reqUser.address || '', reqUser.fbId || -1, reqUser.avatar || '');
                altp.users.unshift(resUser); // push to beginning
            }

            sock.emit('login', {success: true, user: resUser});
        };

        /**
         * user click search button. Get 2 users into a room.
         * @param data = {user.id}
         * */
        var search = function (data) {
            var user = getUserById(data.user.id);
            var room = null;

            console.log('search: ' + user.name + ' searching');

            for (var i = 0; i < altp.rooms.length; i++) {
                if (altp.rooms[i].users.length == 1) {
                    room = altp.rooms[i];
                    if (room.users[0].id != user.id) {
                        room.users.push(user);
                    }
                    break;
                }
            }

            user.answerIndex = -1;

            if (room == null) {
                // create a new room
                var questions = [
                    new Question('1+1=?', ['0', '1', '2', '3'], 2, 0),
                    new Question('1+2=?', ['0', '1', '2', '3'], 3, 1),
                    new Question('1+3=?', ['0', '4', '2', '3'], 1, 2),
                    new Question('1+4=?', ['0', '1', '5', '3'], 2, 3),
                    new Question('1+5=?', ['6', '1', '2', '3'], 0, 4)
                ];
                room = new Room('room#' + altp.rooms.length, [user], questions);
                altp.rooms.push(room);
            }

            room.questionIndex = 0;

            sock.leave(user.room);
            user.room = room.id;
            sock.join(room.id);

            var dataSearch = {
                room: room,
                dummyUsers: altp.dummyUsers
            };

            console.log('searchCallback: room#' + dataSearch.room.id);

            __io.to(room.id).emit('search', dataSearch);
        };

        /**
         * user click play after search
         * @param data = {user.id, room.id}
         * */
        var play = function (data) {
            var user = getUserById(data.user.id);
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

            var count = 4;

            var countInterval = setInterval(function () {
                count = count - 1;

                var data = {
                    count: count
                };

                sock.emit('play', data);

                if (count <= 0) {
                    clearInterval(countInterval);
                }
            }, 1000);

            setTimeout(function () {
                var dataResponse = {
                    question: room.questions[room.questionIndex]
                };

                console.log('playCallback: question:' + dataResponse.question.question);

                __io.to(room.id).emit('play', dataResponse);
            }, 4000);
        };

        /**
         * user answer an question
         * @param data = {user.id, room.id, answerIndex}
         * */
        var answer = function (data) {
            var user = getUserById(data.user.id);
            var room = getRoomById(data.room.id);
            var answerIndex = data.answerIndex;

            console.log('answer: ' + user.name + ' answered!');

            for (var j = 0; j < room.users.length; j++) {
                if (room.users[j].id == user.id) {
                    user.answerIndex = answerIndex;
                    room.users[j].answerIndex = answerIndex;
                    break;
                }
            }

            var isAllAnswered = true;

            for (var i = 0; i < room.users.length; i++) {
                if (room.users[i].answerIndex < 0) {
                    isAllAnswered = false;
                    break;
                }
            }

            if (!isAllAnswered) {
                __io.to(room.id).emit('answer', {notAllAnswered: true});
                return;
            }

            var dataResponse = {
                answerRight: room.questions[room.questionIndex].answerRight,
                answerUsers: room.users
            };

            console.log('answerCallback: answerRight:' + dataResponse.answerRight);

            room.questionIndex++;
            __io.to(room.id).emit('answer', dataResponse);

            // game over
            if (room.questionIndex == room.questions.length) {
                gameOver(data);
            }
        };

        /**
         * get next question
         * @param data = {user.id, room.id}
         * */
        var answerNext = function (data) {
            var user = getUserById(data.user.id);
            var room = getRoomById(data.room.id);

            console.log('answerNext: ' + user.name + ' get nextQuestion');

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

            var dataResponse = {
                question: room.questions[room.questionIndex]
            };

            console.log('answerNextCallback: ' + dataResponse.question.question);

            __io.to(room.id).emit('answerNext', dataResponse);
        };

        /**
         * the game over, called by answer()
         * @param data = {user.id, room.id}
         * */
        var gameOver = function (data) {
            var user = getUserById(data.user.id);
            var room = getRoomById(data.room.id);

            console.log('gameOver: ' + user.name);

            for (var k = 0; k < room.users.length; k++) {
                room.users[k].answerIndex = -1;
            }

            room.questionIndex = 0;

            var dataResponse = {
                users: room.users
            };

            console.log('gameOverCallback: total users: ' + dataResponse.users.length);

            __io.to(room.id).emit('gameOver', dataResponse);
        };

        socket.on('login', login);
        socket.on('search', search);
        socket.on('play', play);
        socket.on('answer', answer);
        socket.on('answerNext', answerNext);
        socket.on('gameOver', gameOver);
    });
};

/************** UTILITIES **************/

/**
 * @param userId id of user
 * @return user object
 * */
var getUserById = function (userId) {
    for (var i = 0; i < altp.users.length; i++) {
        if (userId == altp.users[i].id) {
            return altp.users[i];
        }
    }
    return null;
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

module.exports = altp;