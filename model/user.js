var User = function(id, name, address, fbId, avatar){
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.address = address;
    this.fbId = fbId;
    this.room = '';     // current room

    this.toString = function () {
        return this.id + '#' + name;
    }
};

module.exports = User;