// Constante qui configure le jeu
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    
    physics: {
        default: 'arcade',
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    audio: {
        disableWebAudio: true,
    }
};

// Créer un nouveau jeu Phaser sur base de la variable config définie ci-dessus
const game = new Phaser.Game(config);

// Variables globales :
let spaceship, keys, ennemy1, tirs, tirsPlayer, explosionAnimation, lastTir, ennemy2Animation, ennemy2Move, ennemies2;

/*--------------------------------------- PRELOAD ---------------------------------------*/
function preload() {
    // Preloader les images :
    // player/spaceship
    this.load.image(
        'spaceship',
        './assets/spaceship.png'
    );
    // les tirs (ennemis et joueurs)
    this.load.image(
        'tir',
        './assets/tir.png'
    );
    this.load.image(
        'tirAllie',
        './assets/tirAllie.png'
    );
    // ennemy1
    this.load.image(
        'ennemy1',
        './assets/alien.png'
    );
    // explosion
    this.load.spritesheet(
        'boom', 
        './assets/explosion.png',
        {
            frameWidth: 128,
            frameHeight: 128
        }
    );
    // son explosion
    this.load.audio(
        'explosionSound',
        './assets/explosion.wav'
    );
    // ennemi 2 qui bouge
    this.load.spritesheet(
        'ennemy2',
        './assets/ennemy.png',
        {
            frameWidth: 50,
            frameHeight: 36
        }
    );
    // le background créé avec Tiled
    // Lignes de codes copiées de TilesOnly.html
    this.load.image('tiles', './assets/tiles.png');
    this.load.tilemapTiledJSON('backgroudMap', 'background.json');
}
// fonction random
/*function create() {
    for(let i=0; i<25; i++) {
        let randX = Math.floor(Math.random() * 759) + 20;
        let randY = 20 + i * 30;
        this.add.sprite(randX, randY, 'spaceship');
    }
}*/

/*--------------------------------------- CREATE ---------------------------------------*/
function create() {
    // Créer le background créé avec Tiles
    // Lignes de codes copiées de TilesOnly.html
    const map = this.make.tilemap({ key: 'backgroudMap' });
    var tiles = map.addTilesetImage('Sci-Fi', 'tiles', 16, 16, 0, 0);
    var layer = map.createStaticLayer(0, tiles, 0, 0);

    // Créer le vaisseau du player + définir sa position sur l'axe x et y
    spaceship = this.physics.add.image(50, 290, 'spaceship');
    // Créer l'ennemy1 + définir sa position sur l'axe x et y
    ennemy1 = this.physics.add.image(600, 565, 'ennemy1');

    // définir la vélocité de l'ennemi de façon random entre -100 et 100 à la base
    ennemy1.setVelocityY(Phaser.Math.Between(-100, 100));
    ennemy1.setVelocityX(Phaser.Math.Between(-100, 100));
    // tir = this.physics.add.image(500, 550, 'tir');

    // Créer l'animation explosion
    explosionAnimation = this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('boom'),
        frameRate: 16,
        repeat: 0,
        hideOnComplete: true,
    });

    // Créer l'annimation de l'ennemi 2
    // ennemy2Move = this.physics.add.sprite(820, spaceship.y, 'ennemy2');
    ennemy2Animation = this.anims.create({
        key: 'mouvementEnnemy2',
        frames: this.anims.generateFrameNumbers('ennemy2'),
        frameRate: 16,
        repeat: -1,
        hideOnComplete: false,
    });

    // Ajouter à la variable globale key le clavier
    keys = this.input.keyboard.createCursorKeys();

     // Définir quand a été effectué le dernier tir
     lastTir = Date.now();

     // Initialiser le nombre de vies du joueur :
     spaceship.nbLives = 3;
 
     // setter par défaut le vaisseau comme non invincible
     spaceship.invincible = false;

    // Créer le son explosion
    soundExplosion = this.sound.add('explosionSound');
    
    // créer un groupe tirs pour garder tous les tirs ennemis en mémoire
    tirs = this.physics.add.group({
        classType: Phaser.GameObjects.Sprite,
        defaultKey: 'tir',
        defaultFrame: null,
        active: true,
        maxSize: 14,
    });

    // créer un groupe tirs pour garder tous les tirs du player en mémoire
    tirsPlayer = this.physics.add.group({
        classType: Phaser.GameObjects.Sprite,
        defaultKey: 'tirAllie',
        defaultFrame: null,
        active: true,
    });

    // Créer un groupe d'ennemis 2
    ennemies2 = this.physics.add.group({
        classType: Phaser.GameObjects.Sprite,
        defaultKey: 'ennemy2',
        defaultFrame: null,
        active: true,
    });

    // Timer tirs ennemis pour que l'ennemi tire 15x toutes les secondes
    let timerTir = this.time.addEvent ({
        delay: 1000,
        callback: tirEnnemy,
        callbackScope: this,
        repeat: 14,
    });
    // Timer pour que l'ennemi se déplace de façon random toutes les secondes
    // repeat: -1 pour que la répétition soit infinie
    let timerEnnemy = this.time.addEvent ({
        delay: 1000,
        callback: ennemyMoveRand,
        callbackScope: this,
        repeat: -1,
    });

    // Créer un timer pour que l'ennemy2 spawn toutes les 4s
    // repeat: -1 pour que la répétition soit infinie
    let timerEnnemy2 = this.time.addEvent ({
        delay: 4000,
        callback: Ennemy2Spawn,
        callbackScope: this,
        repeat: 20,
    });

    // fonction tir ennemi pour que l'ennemy1 tire sur le player
    function tirEnnemy() {
        let tir = tirs.get();
        if(tir) {
            tir.setPosition(ennemy1.x, ennemy1.y);
        
            // Calcul pour que les tirs ennemis soit dirigés sur le player :
            let tirDirectionX = spaceship.x - ennemy1.x;
            let tirDirectionY = spaceship.y - ennemy1.y;
            // Pythagore
            let distance = Math.sqrt((tirDirectionX * tirDirectionX) + (tirDirectionY * tirDirectionY));
            let tirVelocityX = 200 * tirDirectionX / distance;
            let tirVelocityY = 200 * tirDirectionY / distance;
            tir.body.velocity.x = tirVelocityX;
            tir.body.velocity.y = tirVelocityY;
        }
    }

    // fonction de déplacement random X et Y de l'ennemi
    function ennemyMoveRand() {
        ennemy1.setVelocityY(Phaser.Math.Between(-100, 100));
        ennemy1.setVelocityX(Phaser.Math.Between(-100, 100));
    }
    
    // fonction pour déplacer les ennemy2 sur l'axe x quand ils spawnent vers le player (axe y) et play l'animation du spritesheet
    function Ennemy2Spawn() {
        let ennemy2 = ennemies2.get();
        if(ennemy2) {
            ennemy2.setPosition(850, spaceship.y);
            ennemy2.body.velocity.x = -120;
            ennemy2.play('mouvementEnnemy2');
        }
    }    
    
}

/*--------------------------------------- UPDATE ---------------------------------------*/
function update() {
    // Ajouter le missile sur l'écran, qui sera à chaque fois écrasé :
    // tir = this.physics.add.image(500, 550, 'tir');
    
    // déplacer le vaisseau
    spaceship.setVelocity(0, 0);
    if(keys.left.isDown) {
        spaceship.setVelocityX(-110);
    }
    else if(keys.right.isDown) {
        spaceship.setVelocityX(110);
    }
    if(keys.up.isDown) {
        spaceship.setVelocityY(-110);
    }
    else if(keys.down.isDown) {
        spaceship.setVelocityY(110);
    }

    // tir player sur espace
    if(keys.space.isDown) {
        tir = tirsPlayer.get();
        if(tir) {
            tir.setPosition(spaceship.x+55, spaceship.y);
            tir.body.velocity.x = 100;
        }
    }

    // Conditions pour que le vaisseau ne sorte pas de l'écran 
    if(spaceship.x < 20) spaceship.x = 20;
    if(spaceship.y < 20) spaceship.y = 20;
    if(spaceship.x > 780) spaceship.x = 780;
    if(spaceship.y > 580) spaceship.y = 580;      

    // ennemi1 mouvement pour ne pas qu'il sorte de l'écran
    if(ennemy1.y < 20) ennemy1.setVelocityY(100);
    if(ennemy1.y > 580) ennemy1.setVelocityY(-100);
    if(ennemy1.x < 20) ennemy1.setVelocity(100);
    if(ennemy1.x > 780) ennemy1.setVelocity(-100);

    // Vérifier s'il y a une collision et faire appel à la fonction de collision entre les tirs de l'ennemy1 et le player 
    // et fonction entre les tirs du player et l'ennemi1
    this.physics.add.collider(spaceship, tirs, detectBulletAndPlayerCollision, null, this);
    this.physics.add.collider(ennemy1, tirsPlayer, detectBulletAndEnnemyCollision, null, this);

    // Vérifier s'il y a une collision et faire appel à la fonction de collision entre le player et l'ennemy2 
    // et fonction entre les tirs du player et l'ennemi2
    this.physics.add.collider(spaceship, ennemies2, detectSpaceshipAndEnnemy2Collision, null, this);
    this.physics.add.collider(ennemies2, tirsPlayer, detectBulletAndEnnemy2Collision, null, this);

    // fonction pour vérifier si le joueur a tiré il y a plus d'1s
    function tirPlayer() {
        let tirTimeDifference = Date.now()-lastTir;
        
        if(tirTimeDifference > 1000) {
            let tir = tirsPlayer.get();
            if(tir) {
                tir.setPosition(spaceship.x, spaceship.y);
                tir.body.velocity.x = 100;
                lastTir = Date.now();
            }
        }
    }
}


// Fonction pour détruire le vaisseau et tirs au contact avec le vaisseau
function detectBulletAndPlayerCollision(_spaceship, _tir) {
    // Si le player n'est pas invincible
    if(!_spaceship.invincible) {
        _spaceship.nbLives --;
        _spaceship.alpha = 0.4;
        _spaceship.invincible = true;
        // Rendre le vaisseau opaque après 1s
        setTimeout(function() { 
            _spaceship.alpha = 1; 
            _spaceship.invincible = false; 
        }, 2000);

        if(_spaceship.nbLives === 0) {
            // Générer l'explosion quand le player a été touché 3x
            let explosion = this.add.sprite(_spaceship.x, _spaceship.y, 'boom');
            explosion.play('explode');
            _spaceship.setVisible(false);
            // Générer le son de l'explosion
            soundExplosion.play();
            
            setTimeout(function() {
                location.replace("./loose.html");
            }, 1050);
        }
    }
    _tir.destroy();
}
// Fonction pour détruire l'ennemi et tirs au contact avec l'ennemi
function detectBulletAndEnnemyCollision(_ennemy1, _tir) {
    _tir.destroy();
    // Générer l'explosion quand l'ennemi est touché
    let explosion = this.add.sprite(_ennemy1.x, _ennemy1.y, 'boom');
    explosion.play('explode');

    _ennemy1.setVisible(false);
    // Générer le son de l'explosion
    soundExplosion.play();

    setTimeout(function() {
        location.replace("./win.html");
    }, 1050);
}
// fonction pour détruire le player s'il entre en contact avec l'ennemi2
function detectSpaceshipAndEnnemy2Collision(_spaceship, _ennemy2) {
    // Si le player n'est pas invincible
    if(!_spaceship.invincible) {
        _spaceship.nbLives = 0;
        // Générer l'explosion quand le player est touché
        let explosion = this.add.sprite(_spaceship.x, _spaceship.y, 'boom');
        explosion.play('explode');
        _spaceship.setVisible(false);
        soundExplosion.play();

        _ennemy2.destroy();
        
        setTimeout(function() {
            location.replace("./loose.html");
        }, 1050);
    }
}
// fonction pour détruire l'ennemi2 au contact de tir allié
function detectBulletAndEnnemy2Collision(_ennemy2, _tir) {
    // Générer l'explosion quand l'ennemi est touché
    let explosion = this.add.sprite(_ennemy2.x, _ennemy2.y, 'boom');
    explosion.play('explode');
    _ennemy2.destroy();
    // Générer le son de l'explosion
    soundExplosion.play();

    _tir.destroy();
}
