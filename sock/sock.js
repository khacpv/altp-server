var socApp = {
    io: {},
    app: {},
    numUsers: 0
};

socApp.init = function(app, io) {
    this.io = io;
    this.app = app;

    this.io.on('connection', function (socket) {
        console.log('an user connected');

        var addedUser = false;

        socket.on('test', function (data) {
            var count = data.count;
            socket.emit('test', {
                count: count + 1,
                text: 'hello'
            });
        });

        // when the client emits 'new message', this listens and executes
        socket.on('new message', function (data) {
            // we tell the client to execute 'new message'
            socket.broadcast.emit('new message', {
                username: socket.username,
                message: data
            });
        });

        // when the client emits 'add user', this listens and executes
        socket.on('add user', function (username) {
            if (addedUser) return;

            // we store the username in the socket session for this client
            socket.username = username;
            ++socApp.numUsers;
            addedUser = true;
            socket.emit('login', {
                numUsers: socApp.numUsers
            });
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('user joined', {
                username: socket.username,
                numUsers: socApp.numUsers
            });
        });

        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', function () {
            socket.broadcast.emit('typing', {
                username: socket.username
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', function () {
            socket.broadcast.emit('stop typing', {
                username: socket.username
            });
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function () {
            if (addedUser) {
                --socApp.numUsers;

                // echo globally that this client has left
                socket.broadcast.emit('user left', {
                    username: socket.username,
                    numUsers: socApp.numUsers
                });
            }
        });
    });
};

module.exports = socApp;