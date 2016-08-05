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
        altp.sock = socket;

        socket.on('login', altp.login);
        socket.on('search', altp.search);
    });
};

var log = function () {
    console.log('total users: ' + altp.users.map(function (user) {
            return user.name;
        }).join(','));
};

/**
 * user click login (with FB or username/address)
 * @param data (name,address,fbId)
 * */
altp.login = function (data) {
    var reqUser = data.user;
    console.log('reqUsername: ' + reqUser.name);
    if (!reqUser || reqUser.name.length == 0) {
        altp.sock.emit('login', {success: false});
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

    altp.sock.emit('login', {success: true, user: resUser});

    log();
};

/**
 * user click search button. Get 2 users into a room.
 * @param data = {user.id}
 * */
altp.search = function (data) {
    var user = getUserById(data.user.id);
    var room = null;

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
            new Question('1+1=?', ['0', '1', '2', '3'], 2),
            new Question('1+2=?', ['0', '1', '2', '3'], 3),
            new Question('1+3=?', ['0', '4', '2', '3'], 1),
            new Question('1+4=?', ['0', '1', '5', '3'], 2),
            new Question('1+5=?', ['6', '1', '2', '3'], 0)
        ];
        room = new Room('room#' + altp.rooms.length, [user], questions);
        altp.rooms.push(room);
    }

    room.questionIndex = 0;

    altp.sock.leave(user.room);
    user.room = room.id;
    altp.sock.join(room.id);

    var dataSearch = {
        room: room,
        dummyUsers: altp.dummyUsers
    };

    __io.to(room.id).emit('search', dataSearch);
};

var getUserById = function (userId) {
    for (var i = 0; i < altp.users.length; i++) {
        if (userId == altp.users[i].id) {
            return altp.users[i];
        }
    }
    return null;
};

var getRoomById = function (roomId) {
    for (var i = 0; i < altp.rooms.length; i++) {
        if (roomId == altp.rooms[i].id) {
            return altp.rooms[i];
        }
    }
    return null;
};

module.exports = altp;