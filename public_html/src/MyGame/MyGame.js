/*
 * File: MyGame.js 
 * This is the logic of our game. 
 */
/*jslint node: true, vars: true */
/*global gEngine: false, Scene: false, BlueLevel: false, Camera: false, Renderable: false, vec2: false */
/* find out more about jslint: http://www.jslint.com/help.html */

"use strict";  // Operate in Strict mode such that variables must be declared before used!

function MyGame() {
    // audio clips: supports both mp3 and wav formats
    this.kBgClip = "assets/sounds/BGTest.wav";
    this.kCue1 = "assets/sounds/snow_step_wet-02.flac";

    // scene file name
    this.kSceneFile = "assets/scene.json";
    // all squares in the JSON file
    this.mSqSet = [];

    // The camera to view the scene
    this.mCamera = null;
    this.mSmallCamera = null;
    this.mSmallVP = gEngine.ResourceMap.loadSmallVP();

    // For redirect rotation update
    this.mRedirectFlag = false;
}

gEngine.Core.inheritPrototype(MyGame, Scene);

MyGame.prototype.loadScene = function () {
    // load the scene file
    gEngine.TextFileLoader.loadTextFile(this.kSceneFile, gEngine.TextFileLoader.eTextFileType.eJsonFile);

    // loads the audios
    gEngine.AudioClips.loadAudio(this.kBgClip);
    gEngine.AudioClips.loadAudio(this.kCue1);
};


MyGame.prototype.unloadScene = function () {
    // Step A: Game loop not running, unload all assets
    // stop the background audio
    gEngine.AudioClips.stopBackgroundAudio();

    // unload the scene flie and loaded resources
    gEngine.TextFileLoader.unloadTextFile(this.kSceneFile);

    // unload the scene resources
    gEngine.AudioClips.unloadAudio(this.kBgClip);
    //      You know this clip will be used elsewhere in the game
    //      So you decide to not unload this clip!!
    gEngine.AudioClips.unloadAudio(this.kCue1);

    // Step B: starts the next level
    // starts the next level
    var nextLevel = new BlueLevel();  // next level to be loaded
    gEngine.Core.startScene(nextLevel);
};

MyGame.prototype.initialize = function () {
    var sceneParser = new SceneFileParser(this.kSceneFile);
    // Setup the small camera on top
    this.mSmallCamera = new Camera(
        vec2.fromValues(20, 60),  // position of the camera
        20,                       // width of camera
        this.mSmallVP        // viewport (orgX, orgY, width, height)
    );
    this.mSmallCamera.setBackgroundColor([0, 1, 1, 1]);

    // Step A: Read in the camera
    this.mCamera = sceneParser.parseCameraJson();
    // Step B: Read all the squares
    sceneParser.parseSquaresJson(this.mSqSet);

    // now start the bg music ...
    gEngine.AudioClips.playBackgroundAudio(this.kBgClip);
};

// This is the draw function, make sure to setup proper drawing environment, and more
// importantly, make sure to _NOT_ change any state.
MyGame.prototype.draw = function () {
    // Step A: clear the canvas
    gEngine.Core.clearCanvas([0.9, 0.9, 0.9, 1.0]); // clear to light gray

    // Step  B: Activate the drawing Camera
    this.mCamera.setupViewProjection();

    // Step  C: draw everything
    for (var i = 0; i < this.mSqSet.length; i++) {
        this.mSqSet[i].draw(this.mCamera.getVPMatrix());
    }

    this.mSmallCamera.setupViewProjection();
    for (var i = 0; i < this.mSqSet.length; i++) {
        this.mSqSet[i].draw(this.mSmallCamera.getVPMatrix());
    }
};

// The update function, updates the application state. Make sure to _NOT_ draw
// anything from this function!
MyGame.prototype.update = function () {
    var deltaX = 0.11;
    var deltaXX = 1;
    var deltaXXX = 0.5;
    var smCameraVP = this.mSmallCamera.getViewport();
    var bgCameraWC = this.mCamera.getWCCenter();
    var bgCameraWCZoom = this.mCamera.getWCWidth();
    var redRect = this.mSqSet[1].getXform();
    var whiteRect = this.mSqSet[0].getXform();

    if (!this.mRedirectFlag) {
        // Rotate the rectangle
        redRect.incRotationByDegree(-1.1);
        // Move the white rectange from right to left    
        whiteRect.incXPosBy(-deltaX);
        if (whiteRect.getXPos() < 9) {
            whiteRect.setPosition(31, 60);
        }
    } else {
        // Rotate the rectangle
        redRect.incRotationByDegree(1.1);
        // Move the white rectange from left to right
        whiteRect.incXPosBy(deltaX);
        if (whiteRect.getXPos() > 31) {
            whiteRect.setPosition(9, 60);
        }
    }

    // Support The other direction key: J
    if (gEngine.Input.isKeyClicked(gEngine.Input.keys.J)) {
        if (this.mRedirectFlag) {
            this.mRedirectFlag = false;
        } else {
            this.mRedirectFlag = true;
        }
    }

    // Support Transition key: Q
    if (gEngine.Input.isKeyClicked(gEngine.Input.keys.Q)) {
        gEngine.ResourceMap.storeSmallVP(smCameraVP);
        gEngine.GameLoop.stop();
    }

    // Turn off music key: R
    if (gEngine.Input.isKeyClicked(gEngine.Input.keys.R)) {
        gEngine.AudioClips.stopBackgroundAudio();
    }

    // Turn on music key: T
    if (gEngine.Input.isKeyClicked(gEngine.Input.keys.T)) {
        gEngine.AudioClips.playBackgroundAudio(this.kBgClip);
    }


    //-----------------------MOVING SMALL VIEWPORT------------------------------------
    // Supprot movement key for small viewport: A (Go left)
    if (gEngine.Input.isKeyReleased(gEngine.Input.keys.A)) {
        smCameraVP[0] -= 2; // Clearer to see movement if it is a bigger value
        this.mSmallCamera.setViewport(smCameraVP);
    }

    // Supprot movement key for small viewport: D (Go Right)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.D)) {
        smCameraVP[0] += deltaXX;
        this.mSmallCamera.setViewport(smCameraVP);
    }

    // Supprot movement key for small viewport: W (Go up)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.W)) {
        smCameraVP[1] += deltaXX;
        this.mSmallCamera.setViewport(smCameraVP);
    }

    // Supprot movement key for small viewport: S (Go down)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.S)) {
        smCameraVP[1] -= deltaXX;
        this.mSmallCamera.setViewport(smCameraVP);
    }
    //-----------------------MOVING SMALL VIEWPORT------------------------------------



    //-----------------------MOVING BIG WC--------------------------------------
    // Supprot movement key for large WC: C (Go left)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.C)) {
        bgCameraWC[0] -= deltaXXX;
        this.mCamera.setWCCenter(bgCameraWC[0], bgCameraWC[1]);
    }

    // Supprot movement key for large WC: B (Go Right)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.B)) {
        bgCameraWC[0] += deltaXXX;
        this.mCamera.setWCCenter(bgCameraWC[0], bgCameraWC[1]);
    }

    // Supprot movement key for large WC: F (Go up)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.F)) {
        bgCameraWC[1] += deltaXXX;
        this.mCamera.setWCCenter(bgCameraWC[0], bgCameraWC[1]);
    }

    // Supprot movement key for large WC: V (Go down)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.V)) {
        bgCameraWC[1] -= deltaXXX;
        this.mCamera.setWCCenter(bgCameraWC[0], bgCameraWC[1]);
    }
    //-----------------------MOVING BIG WC--------------------------------------



    //-----------------------ZOOMING BIG WC--------------------------------------
    // Supprot zooming in key for large WC: Z (zoom in)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.Z)) {
        bgCameraWCZoom -= deltaXXX;
        this.mCamera.setWCWidth(bgCameraWCZoom);
    }

    // Supprot zooming out key for large WC: X (zoom out)
    if (gEngine.Input.isKeyPressed(gEngine.Input.keys.X)) {
        bgCameraWCZoom += deltaXXX;
        this.mCamera.setWCWidth(bgCameraWCZoom);
    }
    //-----------------------ZOOMING BIG WC--------------------------------------

};