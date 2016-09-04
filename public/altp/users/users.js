var deleteUserById = function (userId) {
    $.ajax({
        url: '/altp/users/' + userId,
        type: 'DELETE',
        success: function (result) {
            console.log('delete ' + userId + ' err:' + result.err);
        }
    });
};

var updateUserById = function (userId) {
    var user = {
        "_id":"57cb96e466937905738b3926",
        "id":"user1",
        "name":"user1"+ new Date().getMilliseconds(),
        "avatar":"http://thatgrapejuice.net/wp-content/uploads/2014/11/Taylor-Swift-Janet-Jackson-thatgrapejuice.png",
        "address":"ha noi",
        "fbId":"YOUR_FB_ID_HERE",
        "room":"","score":0,
        "totalScore":0
    };

    $.ajax({
        url: '/altp/users/' + userId,
        type: 'POST',
        data: {user: user},
        success: function (result) {
            console.log('update ' + userId + ' err:' + result.err);
        }
    })
};