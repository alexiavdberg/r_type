let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 320,
    physics: {
        default: 'arcade'
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: true
    }
}

let game = new Phaser.Game(config);
let shipSpeed;
let missileSpeed;
let missile, bullet;
let ennemySpeed;
let spacebar;
let groundEnnemy;
let speedBulletMultiplier;
let numberOfBullets;
let gameState;
let bossImageLives;

function init() {
    shipSpeed = 150;
    ennemySpeed = 100;
    missileSpeed = 100;
    speedBulletMultiplier = 120;
    numberOfBullets = 5;
    gameState = 'startScreen';
    bossImageLives = 5;
}

function preload() {
    this.load.image('player', './assets/images/ship.png');
    this.load.image('ennemy', './assets/images/ennemy.png');
    this.load.image('missile', './assets/images/bullets.png');
    this.load.image('groundEnnemy', './assets/images/groundennemy.png');
    this.load.image('bullet', './assets/images/star2.png');
    this.load.image('boss', './assets/images/boss.gif');
    this.load.image('start', './assets/images/start.png');
    this.load.image('restart', './assets/images/restart.png');
    this.load.image('gameOver', './assets/images/GAME-OVER.png');
    this.load.image('space', './assets/images/space.png');
    this.load.image('rTypeLogo', './assets/images/R-Type_Logo.png');
    this.load.image('tiles', './assets/images/tiles.png');
    
    this.load.audio('explosionSound', './assets/audio/explosion.wav');
    
    this.load.spritesheet('explosionAnimation', './assets/animations/explosion.png', { frameWidth: 128, frameHeight: 128 });
    
    this.load.tilemapTiledJSON('backgroundMap', './assets/tiled/level2.json');
}

function create() {
    // Background tiles
    const map = this.make.tilemap({ key: 'backgroundMap' });
    sciti = map.addTilesetImage('Sci-Fi', 'tiles', 16, 16, 0, 0); // sciti = sci-fi tile
    layer = map.createStaticLayer(0, sciti, 0, 0);
    layer.setCollisionBetween(1, 55000);

    spaceImage = this.add.image(0, 0, 'space');
    spaceImage.setOrigin(0, 0);
    
    rTypeLogo = this.add.image(config.width/2, config.height/2, 'rTypeLogo');
    rTypeLogo.setScale(0.8);
    
    startImage = this.add.image(config.width/2, config.height-config.height/4, 'start').setInteractive();
    startImage.setScale(0.4);
    
    // Ajouter image player
    playerShip = this.physics.add.image(200, config.height/2, 'player');
    playerShip.setVisible(false);

    // Ajouter image ennemy + sa vitesse
    ennemy = this.physics.add.image(900, 200, 'ennemy');

    // Faire tourner ennemy avec un tween
    let tweenEnnemy = this.tweens.add({
        targets : ennemy,
        angle : 360,
        duration : 2000,
        ease : 'Linear',
        loop : -1
    })

    // Ajouter image ennemy ground
    groundEnnemy = this.physics.add.image(375, 275, 'groundEnnemy');
    
    // Ajouter image boss
    bossImage = this.physics.add.image(3200-70, config.height/2, 'boss');
    bossImage.setScale(0.5);
    bossImage.setImmovable(true);
    
    // Initialiser le spacebar pour tirs
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Créer le groupe de missiles
    missiles = this.physics.add.group({
        defaultKey: 'missile',
        maxSize: 50
    })
    
    // Créer le groupe bullet ennemy group
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 50
    })
    
    // Créer l'animation d'explosion
    let explosionAnimation = this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosionAnimation'),
        frameRate: 20,
        repeat: 0,
        hideOnComplete: true
    })

    explosionSound = this.sound.add('explosionSound');
    
    // Initialiser collisions
    this.physics.add.collider(playerShip, ennemy, collisionPlayerShipEnnemy, null, this);
    this.physics.add.collider(ennemy, missiles, collisionEnnemyMissile, null, this);
    this.physics.add.collider(playerShip, bullets, collisionPlayerShipBullet, null, this);
    this.physics.add.collider(playerShip, layer, collisionPlayerShipLayer, null, this);
    this.physics.add.collider(bossImage, missiles, collisionBossMissile, null, this);
    this.physics.add.collider(playerShip, bossImage, collisionPlayerShipBoss, null, this);

    restartImage = this.add.image(-1000, config.height/2, 'restart').setInteractive();
    restartImage.setScale(0.07);

    gameOverImage = this.add.image(-1000, config.height/2, 'gameOver');
    gameOverImage.setScale(0.2);
}

function update() {

    // ############### STARTSCREEN ############### //
    if (gameState === 'startScreen') {
        startImage.on('pointerdown', () => {
            spaceImage.setVisible(false);
            startImage.setVisible(false);
            rTypeLogo.setVisible(false);
            playerShip.setVelocity(shipSpeed, 0);
            ennemy.setVelocity(-ennemySpeed, 0);
            playerShip.setVisible(true);
            
            // Timer shoot missile ground ennemy
            let timerBulletGroundEnnemy = this.time.addEvent({
                delay: 1000,
                callback: groundEnnemyShootBullet,
                callbackScope: this,
                repeat: numberOfBullets - 1
            })
            
            // Changer le gamestate
            gameState = 'scrollGame';
        })
    }

    // ############### SCROLLGAME ############### //
    if (gameState === 'scrollGame') {
        // Pour faire scroller le background et arrêter à la fin du background
        if (this.cameras.main.scrollX<2400) this.cameras.main.scrollX += 2;
    
        // Pour faire arrêter player pour qu'il ne sorte pas de l'écran
        if (playerShip.x > this.cameras.main.scrollX + config.width) playerShip.x = this.cameras.main.scrollX + config.width;
        if (playerShip.x < this.cameras.main.scrollX) playerShip.x = this.cameras.main.scrollX;
    
        // Initialisation touches clavier
        cursors = this.input.keyboard.createCursorKeys();
        if (cursors.right.isDown) playerShip.setVelocity(shipSpeed, 0);
        if (cursors.left.isDown) playerShip.setVelocity(-shipSpeed, 0);
        if (cursors.up.isDown) playerShip.setVelocityY(-shipSpeed);
        if (cursors.down.isDown) playerShip.setVelocityY(shipSpeed);
    
        // Lancer les tirs ennemy avec spacebar
        if (Phaser.Input.Keyboard.JustDown(spacebar)){
            let missile = missiles.get();
            if (missile) {
                missile.setPosition(playerShip.x + playerShip.width/2, playerShip.y + playerShip.height/2);
                missile.setVelocity(shipSpeed + missileSpeed, 0);
        }}
    
        // Faire réapparaitre ennemy de l'autre côté de l'écran
        if (ennemy.x < 0 - this.cameras.main.scrollX) ennemy.setPosition(this.cameras.main.scrollX + config.width + ennemy.width, Phaser.Math.Between(ennemy.height, config.height - ennemy.height));

        if (this.cameras.main.scrollX > 2400) gameState = 'bossGame';
    }
            
    
    // ############### BOSSGAME ############### //
    if (gameState === 'bossGame') {
        // Initialisation touches clavier
        cursors = this.input.keyboard.createCursorKeys();
        if (cursors.right.isDown) playerShip.setVelocity(shipSpeed, 0);
        if (cursors.left.isDown) playerShip.setVelocity(-shipSpeed, 0);
        if (cursors.up.isDown) playerShip.setVelocityY(-shipSpeed);
        if (cursors.down.isDown) playerShip.setVelocityY(shipSpeed);
    
        // Lancer les tirs ennemy avec spacebar
        if (Phaser.Input.Keyboard.JustDown(spacebar)){
            let missile = missiles.get();
            if (missile) {
                missile.setPosition(playerShip.x + playerShip.width/2, playerShip.y + playerShip.height/2);
                missile.setVelocity(shipSpeed + missileSpeed, 0);
        }}
    
        // Pour faire arrêter player à droite de l'écran pour qu'il ne sorte pas de l'écran
        if (playerShip.x < this.cameras.main.scrollX) playerShip.x = this.cameras.main.scrollX;
     
        // Collision player|ennemy
        if (Phaser.Geom.Intersects.RectangleToRectangle(
            bossImage.getBounds(), 
            missile.getBounds())) {
                let explosionAnim = this.add.sprite(bossImage.x, bossImage.y, 'explosionAnimation');
                explosionAnim.play('explode');   
                explosionSound.play();
            }

    // ############### WINGAME ############### //
    if (gameState === 'winGame') {
        alert('wingame');
    }

    // ############### LOSEGAME ############### //
    if (gameState === 'loseGame') {
        
    }
}}

// Détruire missile + faire réapparaitre ennemy on collision
function collisionEnnemyMissile(_ennemy, _missile) {
    let explosionAnim = this.add.sprite(_ennemy.x, _ennemy.y, 'explosionAnimation');
    explosionAnim.play('explode'); 
    if (gameState === 'scrollGame') {
        _ennemy.setPosition(this.cameras.main.scrollX, Phaser.Math.Between(120, 240));
        _ennemy.setVelocity(-ennemySpeed, 0);
    }
    else {
        _ennemy.setPostion(-1000, -1000);
    }
    _missile.destroy();   
    explosionSound.play();
}

// Collision player|ennemy
function collisionPlayerShipEnnemy(_playerShip, _ennemy) {
    _ennemy.destroy();
    let explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y, 'explosionAnimation');
    explosionAnim.play('explode');
    explosionSound.play();
    _playerShip.setPosition(-1000, -1000);
    gameOver(this);
}

// Collision player|bullet
function collisionPlayerShipBullet(_playerShip, _bullet) {
    _bullet.destroy();
    let explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y, 'explosionAnimation');
    explosionAnim.play('explode');
    explosionSound.play();
    _playerShip.setPosition(-1000, -1000);
    gameOver(this);
}

// Ground ennemy tire bullet vers player
function groundEnnemyShootBullet() {
    let bullet = bullets.get();
    if (bullet) {
        if (bullet) {
            bullet.setPosition(groundEnnemy.x, groundEnnemy.y-6);
            let shootX = playerShip.x-groundEnnemy.x;
            let shootY = playerShip.y-groundEnnemy.y;
            vectorLength = Math.sqrt(shootX*shootX + shootY*shootY);
            bullet.setVelocity(speedBulletMultiplier * shootX/vectorLength, speedBulletMultiplier * shootY/vectorLength);
        }
    }
}

// Collision player|map
function collisionPlayerShipLayer(_playerShip, _layer) {
    let explosionAnim = this.add.sprite(playerShip.x, playerShip.y, 'explosionAnimation');
    explosionAnim.play('explode');   
    explosionSound.play();
    _playerShip.setPosition(-1000, -1000);
    gameOver(this);
}

// Collision player|boss
function collisionPlayerShipBoss(_playerShip, _boss) {
    let explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y, 'explosionAnimation');
    explosionAnim.play('explode');
    explosionSound.play();
    _playerShip.setPosition(-1000, -1000);
    gameOver(this);
}

// Collision missile|boss
function collisionBossMissile(_boss, _missile) {
    _missile.destroy();
    let explosionAnim = this.add.sprite(_boss.x, _boss.y, 'explosionAnimation');
    explosionAnim.play('explode');  
    explosionSound.play();
    bossImageLives--;        
    if (bossImageLives <= 0) {
        gameState = 'winGame';
        bossImage.destroy();
        playerShip.setVelocityX(100);
    }
}

function gameOver(scene) {
    playerShip.setPosition(-1000, -1000);
    gameOverImage.setPosition(scene.cameras.main.scrollX + config.width/2, config.height/2);
    restartImage.setPosition(scene.cameras.main.scrollX + config.width/2, config.height - config.height/5);
    gameState = 'loseGame';
}