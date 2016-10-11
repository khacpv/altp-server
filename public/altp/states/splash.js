var Splash = {};

Splash.dummyTexts = [
    {
        text: 'ai la trieu phu',
        x: 10,
        y: 60,
        alpha: 0.2,
        velocity: 0.5
    },
    {
        text: 'online',
        x: 20,
        y: 70,
        alpha: 0.4,
        velocity: 0.6
    },
    {
        text: 'multiplayer',
        x: 60,
        y: 80,
        alpha: 0.2,
        velocity: 0.4
    }
];

/**
 * must be match with file name
 */
Splash.image = {
    altp: 'altp',
    online: 'online',
    answer0: 'answer0'
};

/**
 * must be match with file name
 */
Splash.audio = {
    BACKGROUND_MUSIC: 'background_music',
    BG_MUSIC: 'bgmusic'
};

//============== local variable ======================
Splash.startTime = new Date().getTime();
Splash.percentLoaded = 0;
Splash.textPercent = {};
Splash.floatText = [];

Splash.loadScripts = function () {
    for (var prop in STATES) {
        if (STATES.hasOwnProperty(prop)) {
            var scriptName = STATES[prop];
            game.load.script(scriptName, DIR_STATE + scriptName + '.js');
        }
    }
};

Splash.loadAudio = function (audios) {
    for (var prop in audios) {
        if (audios.hasOwnProperty(prop)) {
            var audioName = audios[prop];
            game.load.audio(audioName, DIR_AUDIO + audioName + '.mp3');
        }
    }
};

Splash.loadImages = function (images) {
    for (var prop in images) {
        if (images.hasOwnProperty(prop)) {
            var imageName = images[prop];
            game.load.image(imageName, DIR_IMAGE + imageName + '.png');
        }
    }
};

Splash.loadFonts = function () {
    // TODO load font here
};

Splash.addGameStates = function () {
    // TODO remove here

    game.state.add(STATES.LOGIN, StateLogin);
    // game.state.add(STATES.INFO, GameInfo);
    // game.state.add(STATES.OPPONENT, GameOpponent);
    // game.state.add(STATES.PLAY, GamePlay);
    // game.state.add(STATES.GAMEOVER, GameOver);
};

Splash.addGameMusic = function () {
    // TODO Add Game musicBackground
    Splash.musicBackground = game.add.audio(Splash.audio.BG_MUSIC);
    Splash.musicBackground.loop = true;
    Splash.musicBackground.play();
};

Splash.addViews = function () {

    // draw AI LA TRIEU PHU text
    var spriteAltp = game.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 10, Splash.image.altp);
    spriteAltp.scale.setTo(0.3, 0.3);
    spriteAltp.position.x = GAME_WIDTH / 2 - spriteAltp.width / 2;

    // draw Online text
    var spriteOnline = game.add.sprite(GAME_WIDTH - 50, spriteAltp.position.y + spriteAltp.height + 10, Splash.image.online);
    spriteOnline.scale.setTo(0.2, 0.2);
    spriteOnline.position.x = spriteAltp.position.x + spriteAltp.width - spriteOnline.width;

    // draw progress percent
    var spriteProgress = game.add.sprite(GAME_WIDTH / 2, spriteOnline.position.y + spriteOnline.height + 50, Splash.image.answer0);
    spriteProgress.scale.setTo(0.5, 0.5);
    spriteProgress.position.x = GAME_WIDTH / 2 - spriteProgress.width / 2;

    // draw text percent
    var style = {
        font: "25px Arial",
        fill: "#FFFFFF",
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH,
        align: "center"
    };
    Splash.textPercent = game.add.text(
        spriteProgress.position.x + spriteProgress.width / 2,
        spriteProgress.position.y + spriteProgress.height / 2 - 2,
        Splash.percentLoaded + "%",
        style);
    Splash.textPercent.anchor.set(0.5);

    // draw float-texts
    style = {
        font: "18px Arial",
        fill: "#FFFFFF",
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH,
        align: "left"
    };
    for (var i = 0; i < Splash.dummyTexts.length; i++) {
        var floatText = game.add.text(
            Splash.dummyTexts[i].x * GAME_WIDTH / 100,
            Splash.dummyTexts[i].y * GAME_HEIGHT / 100,
            Splash.dummyTexts[i].text,
            style);
        floatText.anchor.set(0.5);
        floatText.alpha = Splash.dummyTexts[i].alpha;
        floatText.velocity = Splash.dummyTexts[i].velocity;
        Splash.floatText.push(floatText);
    }
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
    this.loadImages(Splash.image);
    this.loadFonts();
    this.loadAudio(Splash.audio);
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
        //game.state.start(STATES.LOGIN);
    }, 5000);
};

Splash.update = function () {
    // calculate percent loading
    var currentTime = new Date().getTime();
    Splash.percentLoaded = parseInt((currentTime - Splash.startTime) / 1000);
    Splash.textPercent.setText(Splash.percentLoaded + ' %');

    // calculate float texts
    for (var i = 0; i < Splash.floatText.length; i++) {
        Splash.floatText[i].position.x = Splash.floatText[i].position.x + Splash.floatText[i].velocity;
        var delta = Math.abs(GAME_WIDTH - Splash.floatText[i].position.x);
        delta = Math.min(delta, Splash.floatText[i].position.x);
        var deltaAlpha = 20;
        if (delta > deltaAlpha && delta < GAME_WIDTH - deltaAlpha) {
            Splash.floatText[i].alpha = Splash.dummyTexts[i].alpha;
        } else {
            Splash.floatText[i].alpha = delta * Splash.dummyTexts[i].alpha / deltaAlpha;
        }

        if (Splash.floatText[i].position.x >= GAME_WIDTH) {
            Splash.floatText[i].position.x = -Splash.floatText[i].width / 2;
        }
    }
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