var app = {};
const App = {};

App.url = '/faster5';

App.socket = io();

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
    App.socket.emit('login', {user: App.user});
};

App.loginCallback = function (data) {
    if (data.success) {
        App.user = data.user;
        log(App.user.id + '#' + App.user.name + '<img src="' + App.user.avatar + '" width=50 height=50>');
    }
};

App.search = function () {
    App.socket.emit('search', {user: App.user});
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
    App.socket.emit('play', {user: App.user, room: App.room});
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
    App.socket.emit('answer', data);
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
    App.socket.emit('answerNext', data);
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

var log = function (value) {
    $('#test').prepend('<br>' + value);
};

// register socket
App.socket.on('draw', App.draw);
App.socket.on('login', App.loginCallback);
App.socket.on('search', App.searchCallback);
App.socket.on('play', App.playCallback);
App.socket.on('answer', App.answerCallback);
App.socket.on('answerNext', App.answerNextCallback);
App.socket.on('gameOver', App.gameOverCallback);