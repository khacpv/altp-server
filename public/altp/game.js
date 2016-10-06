// phaser
/** state manager: https://github.com/MattMcFarland/phaser-menu-system
 *
 */

/**============== CONSTANTS =====================**/

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const DIR_STATE = 'states/';
const DIR_IMAGE = 'res/image/';
const DIR_AUDIO = 'res/audio/';
const DIR_FONTS = 'res/fonts/';

/**
 * must be match with file name
 */
const STATES = {
    SPLASH: 'splash',
    LOGIN: 'login',
    INFO: 'info',
    OPPONENT: 'opponent',
    PLAY: 'play',
    GAMEOVER: 'gameover'
};

/**
 * must be match with file name
 */
var IMAGES = {
    altp: 'altp',
    online: 'online',
    answer0: 'answer0',
    answer1: 'answer1',
    answer2: 'answer2',
    answer4: 'answer4',
    answer_enemy: 'answer_enemy',
    answer_right: 'answer_right',
    answer_wrong: 'answer_wrong',
    table_question: 'table_question'
    // TODO add more here
};

/**
 * must be match with file name
 */
var AUDIO = {
    ANS_A : 'ans_a',
    ANS_A2: 'ans_a2',
    ANS_B: 'ans_b',
    ANS_B2:'ans_b2',
    ANS_C: 'ans_c',
    ANS_C2: 'ans_c2',
    ANS_D: 'ans_d',
    ANS_D2: 'ans_d2',
    ANS_NOW1: 'ans_now1',
    ANS_NOW2: 'ans_now2',
    ANS_NOW3: 'ans_now3',
    BACKGROUND_MUSIC: 'background_music',
    BACKGROUND_MUSIC_B: 'background_music_b',
    BACKGROUND_MUSIC_C: 'background_music_c',
    BEST_PLAYER: 'best_player',
    BG_MUSIC: 'bgmusic',
    BG_MUSIC_GAMEOVER: 'bgmusic_gameover',
    // TODO add sound here
};

/**
 * must be match with file name
 */
var FONT = {

};

/**============== GAME ENGINE =====================**/

var game;

window.onload = function () {

    game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'game', {
        preload: preload,
        create: create
    });

    function preload() {
        game.load.image('logo', DIR_IMAGE + 'SPLASH.png');
        game.load.image('splash', DIR_IMAGE + '8-SPLASH/SPLASH.png');
        game.load.spritesheet('btn_answers', DIR_IMAGE + '10-SPRITE/btn_answers.png', 512, 100, 4);
        game.load.spritesheet('background', DIR_IMAGE + '9-GAMEOVER/BACKGROUND.png');
        game.load.spritesheet('players', DIR_IMAGE + 'players.png');

        game.load.script(STATES.SPLASH, DIR_STATE + 'splash.js');
    }

    function create() {
        game.state.add(STATES.SPLASH, Splash);
        game.state.start(STATES.SPLASH);
    }
};

/**============== UTILS =====================**/

/**
 * fill bg with gradient
 */
var fillBg = function(){
    game.stage.backgroundColor = '#004B91';

    var out = [];

    var bmd = game.add.bitmapData(GAME_WIDTH, GAME_HEIGHT);
    bmd.addToWorld();

    var c;

    for (var i = 0; i < GAME_HEIGHT * 1.5; i++) {
        c = Phaser.Color.interpolateColor(0x004B91, 0x000000, GAME_HEIGHT, i, 255 * i / GAME_HEIGHT);
        bmd.rect(0, i, GAME_WIDTH, GAME_HEIGHT, Phaser.Color.getWebRGB(c));
        out.push(Phaser.Color.getWebRGB(c));
    }
};