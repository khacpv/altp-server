var app = {};
const App = {};

App.url = '/faster5';

App.socket = io.connect();

App.user = {
    id: '',
    name: '',
    address: '',
    avatar: 'http://thatgrapejuice.net/wp-content/uploads/2014/11/Taylor-Swift-Janet-Jackson-thatgrapejuice.png',
    fbId: ''
};

App.enemy = {
    name: '',
    address: '',
    avatar: '',
    fbId: ''
};

App.question = {
    question: '',
    answers: [],
    answerRight: -1
};

App.room = '';
App.questionIndex = 0;

App.login = function () {
    App.user.name = $('#name').val();
    App.user.address = $('#address').val();
    App.user.fbId = 'YOUR_FB_ID_HERE';
    App.socket.emit('faster5:login', {user: App.user});
};

App.loginCallback = function (data) {
    if (data.success) {
        App.user = data.user;
        log(App.user.id + '#' + App.user.name + '<img src="' + App.user.avatar + '" width=50 height=50>');
    }
};

App.search = function () {
    App.socket.emit('faster5:search', {user: App.user});
    $('#userlist').html('loading...');
};

App.searchCallback = function (data) {
    App.room = data.room;
    App.dummyUsers = data.dummyUsers;
    var user;

    $('#userlist').html('<span>' + App.room.id + '</span>');
    for (var i = 0; i < App.room.users.length; i++) {
        user = App.room.users[i];

        $('#userlist').append('<li>'
            + '<span class="enemy" onclick="App.play()">'
            + user.name
            + '</span>'
            + '<img src="' + user.avatar + '" width=50 height=50>'
            + '</li>');
    }

    for (var j = 0;j<App.dummyUsers.length;j++){
        user = App.dummyUsers[j];

        $('#userlist').append('<li>'
            + '<span class="enemy">'
            + user.name
            + '</span>'
            + '<img src="' + user.avatar + '" width=50 height=50>'
            + '</li>');
    }
};

App.play = function () {
    App.socket.emit('faster5:play', {user: App.user, room: App.room});
};

App.playCallback = function (data) {
    if (data.notReady) {
        log('waiting for other ready');
        return;
    }

    if (data.count || data.count == 0) {
        log(data.count);
        return;
    }

    App.question = data.question;

    $('#question').text(App.question.question);
    $('#answerA span').text('A: ' + App.question.answers[0]);
    $('#answerB span').text('B: ' + App.question.answers[1]);
    $('#answerC span').text('C: ' + App.question.answers[2]);
    $('#answerD span').text('D: ' + App.question.answers[3]);
};

App.answer = function (index) {
    var data = {
        user: App.user,
        room: App.room,
        answerIndex: index
    };
    App.socket.emit('faster5:answer', data);
};

App.answerCallback = function (data) {
    if (data.notAllAnswered) {
        log('waiting for other answer');
        return;
    }

    App.answerRight = data.answerRight;
    App.answerUsers = data.answerUsers;

    log('answerRight: ' + App.answerRight);
    for (var i = 0; i < App.answerUsers.length; i++) {
        log(App.answerUsers[i].name + ' answer ' + App.answerUsers[i].answerIndex);
    }

    var data = {
        user: App.user,
        room: App.room
    };
    App.socket.emit('faster5:answerNext', data);
};

App.answerNextCallback = function (data) {
    App.question = data.question;

    $('#question').text(App.question.question);
    $('#answerA span').text('A: ' + App.question.answers[0]);
    $('#answerB span').text('B: ' + App.question.answers[1]);
    $('#answerC span').text('C: ' + App.question.answers[2]);
    $('#answerD span').text('D: ' + App.question.answers[3]);
};

App.gameOverCallback = function (data) {
    log('game over');
    App.play();
};

App.logout = function () {
    $.ajax({
        url: App.url + '/api/logout',
        dataType: 'jsonp',
        beforeSend: function (xhr) {
            if (localStorage.token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.token);
            }
        }
    })
};

App.pingCallback = function(data){
    log('ping count: '+data.count);
};

App.draw = function (data) {
    if (data.type == "dragstart") {
        App.ctx.beginPath();
        App.ctx.moveTo(data.x, data.y);
    } else if (data.type == "drag") {
        App.ctx.lineTo(data.x, data.y);
        App.ctx.stroke();
    } else {
        App.ctx.stroke();
        App.ctx.closePath();
    }
};

$(function () {
    log(localStorage.token);
    App.ctx = $('canvas')[0].getContext('2d');
    $('body').on('drag dragstart dragend', 'canvas', function (e) {
        var offset = $(this).offset();
        data = {
            x: (e.clientX - offset.left),
            y: (e.clientY - offset.top),
            type: e.handleObj.type
        };
        App.draw(data);
        App.socket.emit('faster5:draw', data);
    });

    App.socket.emit('faster5:ping',{count: 3});
});

var log = function (value) {
    $('#test').prepend('<br>' + value);
};

// register socket
App.socket.on('faster5:draw', App.draw);
App.socket.on('faster5:login', App.loginCallback);
App.socket.on('faster5:search', App.searchCallback);
App.socket.on('faster5:play', App.playCallback);
App.socket.on('faster5:answer', App.answerCallback);
App.socket.on('faster5:answerNext', App.answerNextCallback);
App.socket.on('faster5:gameOver', App.gameOverCallback);
App.socket.on('faster5:ping', App.pingCallback);