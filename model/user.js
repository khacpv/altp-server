var User = function(id, name, address, fbId, avatar){
    this._id = '';
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.address = address;
    this.fbId = fbId;
    this.room = '';     // current room id
    this.score = 0;
    this.totalScore = 0;

    this.toString = function () {
        return this.id + '#' + name;
    }
};

module.exports = User;