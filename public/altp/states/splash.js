var Splash = {};

var music;

var dummyTexts = [
    'ai la trieu phu',
    'cho',
    'meo',
    'ga'
];

Splash.loadScripts = function () {
    for (var prop in STATES) {
        if (STATES.hasOwnProperty(prop)) {
            var scriptName = STATES[prop];
            game.load.script(scriptName, DIR_STATE + scriptName + '.js');
        }
    }
};

Splash.loadAudio = function () {
    for (var prop in AUDIO) {
        if (AUDIO.hasOwnProperty(prop)) {
            var audioName = AUDIO[prop];
            game.load.audio(audioName, DIR_AUDIO + audioName + '.mp3');
        }
    }
};

Splash.loadImages = function () {
    for (var prop in IMAGES) {
        if (IMAGES.hasOwnProperty(prop)) {
            var imageName = IMAGES[prop];
            game.load.image(imageName, DIR_IMAGE + imageName + '.png');
        }
    }
};

Splash.loadFonts = function () {
    // TODO load font here
};

Splash.addGameStates = function () {
    // TODO remove here
    GameInfo = {};
    GameOpponent = {};
    GamePlay = {};
    GameOver = {};

    game.state.add(STATES.LOGIN, GameLogin);
    game.state.add(STATES.INFO, GameInfo);
    game.state.add(STATES.OPPONENT, GameOpponent);
    game.state.add(STATES.PLAY, GamePlay);
    game.state.add(STATES.GAMEOVER, GameOver);
};

Splash.addGameMusic = function () {
    // TODO Add Game music
    music = game.add.audio(AUDIO.ANS_A);
    music.loop = false;
    music.play();
};

Splash.addViews = function () {

    // LOGO: AI LA TRIEU PHU
    //var style = {
    //    font: "32px Arial",
    //    fill: "#FFFFFF",
    //    wordWrap: true,
    //    wordWrapWidth: GAME_WIDTH,
    //    align: "center"
    //};
    //
    //var text = game.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 10, "AI LA TRIEU PHU", style);
    //text.anchor.set(0.5);
    //
    //style = {
    //    font: "24px Arial",
    //    fill: "#FFFFFF",
    //    wordWrap: true,
    //    wordWrapWidth: GAME_WIDTH,
    //    align: "right"
    //};
    //
    //text = game.add.text(GAME_WIDTH - 50, GAME_HEIGHT / 10 + 50, "online", style);
    //text.anchor.set(1);

    var spriteAltp = game.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 10, IMAGES.altp);
    spriteAltp.scale.setTo(0.3, 0.3);
    spriteAltp.position.x = GAME_WIDTH / 2 - spriteAltp.width / 2;

    var spriteOnline = game.add.sprite(GAME_WIDTH - 50, spriteAltp.position.y + spriteAltp.height + 10, IMAGES.online);
    spriteOnline.scale.setTo(0.2, 0.2);
    spriteOnline.position.x = spriteAltp.position.x + spriteAltp.width - spriteOnline.width;

    // TODO add progress percent
    var spriteProgress = game.add.sprite(GAME_WIDTH / 2, spriteOnline.position.y + spriteOnline.height + 50, IMAGES.answer0);
    spriteProgress.scale.setTo(0.5, 0.5);
    spriteProgress.position.x = GAME_WIDTH / 2 - spriteProgress.width / 2;
    
    // TODO draw float-texts
};

/**============== GAME life cycle ================**/

/**
 * init is the very first function called when your State starts up. It's called before preload, create or anything else.
 * If you need to route the game away to another State you could do so here,
 * or if you need to prepare a set of variables or objects before the preloading starts.
 */
Splash.init = function () {
    console.log('splash: init');
};

/**
 * preload is called first. Normally you'd use this to load your game assets (or those needed for the current State)
 * You shouldn't create any objects in this method that require assets that you're also loading in this method,
 * as they won't yet be available.
 */
Splash.preload = function () {
    console.log('splash: preload');

    this.loadScripts();
    this.loadImages();
    this.loadFonts();
    this.loadAudio();
};

/**
 * create is called once preload has completed, this includes the loading of any assets from the Loader.
 * If you don't have a preload method then create is the first method called in your State.
 */
Splash.create = function () {
    console.log('splash: create');
    fillBg();

    this.addGameStates();
    this.addGameMusic();
    this.addViews();

    setTimeout(function () {
        // TODO add transition fade-out
        music.pause();
        //game.state.start(STATES.LOGIN);
    }, 5000);
};

/**
 * This method will be called if the core game loop is paused.
 */
Splash.paused = function () {
    console.log('splash: paused');
};

/**
 * This method will be called when the core game loop resumes from a paused state.
 */
Splash.resume = function () {
    console.log('splash: resume');
};

/**
 * This method will be called when the State is shutdown (i.e. you switch to another state from this one).
 */
Splash.shutdown = function () {
    console.log('splash: shutdown');
};