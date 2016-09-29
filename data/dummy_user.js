var User = require(__appname + '/model/user');

var dummyUsers = [];

dummyUsers.push(new User(0, 'Bằng Kiều', 'china', 'fb_id_0', 'http://www.nhipsongphunu.com/public/default/content/Images/Lam%20dep/avatar%20-20150311-14030457.jpg'));
dummyUsers.push(new User(1, 'Hoài Linh', 'hongkong', 'fb_id_1', 'http://avatar.nct.nixcdn.com/playlist/2013/11/07/2/e/6/4/1383813832087_500.jpg'));
dummyUsers.push(new User(2, 'Obama', 'america', 'fb_id_2', 'http://media.todaybirthdays.com/thumb_x256x256/upload/2015/11/30/michelle-rodriguez.jpg'));
dummyUsers.push(new User(3, 'Lý Hùng', 'camarun', 'fb_id_2', 'http://media.todaybirthdays.com/thumb_x256x256/upload/2015/11/30/michelle-rodriguez.jpg'));
dummyUsers.push(new User(4, 'Cẩm Ly', 'america', 'fb_id_2', 'http://media.todaybirthdays.com/thumb_x256x256/upload/2015/11/30/michelle-rodriguez.jpg'));
dummyUsers.push(new User(5, 'son tùng MTP', 'america', 'fb_id_2', 'http://media.todaybirthdays.com/thumb_x256x256/upload/2015/11/30/michelle-rodriguez.jpg'));

module.exports = dummyUsers;