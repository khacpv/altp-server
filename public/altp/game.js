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

/**============== GAME ENGINE =====================**/

var game;

window.onload = function () {

    game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'game', {
        preload: preload,
        create: create
    });

    function preload() {
        game.load.script(STATES.SPLASH, DIR_STATE + STATES.SPLASH + '.js');
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