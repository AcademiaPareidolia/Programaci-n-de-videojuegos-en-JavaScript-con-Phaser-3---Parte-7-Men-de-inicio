var nave;
var derecha;
var izquierda;
var asteroides;
var texto;
var spacebar;
var sonidoDisparo;
var damage;
var recarga_energia;
var iniciar;

const vidaNave = 4;
const municionInicial = 4;
const velocidadNave = 800;
const minAsteroides = 2;
const maxAsteroides = 4;
const velocidadCaida = 5;
const tiempoAparicion = 600;
const probabilidadEnergia = 20;
const municionPorEnergia = 4;

var Inicio = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Inicio() {
            Phaser.Scene.call(this, { key: 'Inicio' });
        },

    create() {
        var texto = this.add.text(game.config.width / 2, game.config.height / 2, 'Iniciar', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();
        texto.on('pointerdown', () => {
            this.scene.start('Principal');
        });

        iniciar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        iniciar.reset();
    },

    update(){
        if(iniciar.isDown){
            this.scene.start('Principal');
        }
    }
});

var Principal = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function Principal() {
            Phaser.Scene.call(this, { key: 'Principal' });
        },

    preload() {
        this.load.image('nave', 'assets/sprites/nave.png');
        this.load.spritesheet('asteroides', 'assets/sprites/asteroides.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('bala', 'assets/sprites/bala.png');
        this.load.image('energia', 'assets/sprites/energia.png');

        this.load.audio('sonidoDisparo', 'assets/sonidos/disparo.wav');
        this.load.audio('damage', 'assets/sonidos/damage.wav');
        this.load.audio('recarga_energia', 'assets/sonidos/recarga_energia.wav');
    },
    create() {
        nave = this.physics.add.sprite(game.config.width / 2, game.config.height - 100, 'nave');
        nave.vida = vidaNave;
        nave.municion = municionInicial;
        nave.setCollideWorldBounds(true);

        sonidoDisparo = this.sound.add('sonidoDisparo');
        damage = this.sound.add('damage');
        recarga_energia = this.sound.add('recarga_energia');

        texto = this.add.text(10, 10, '', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setDepth(0.1);
        this.actulizarTexto();

        asteroides = this.physics.add.group({
            defaultKey: 'asteroides',
            frame: 0,
            maxSize: 50
        });

        balas = this.physics.add.group({
            classType: bala,
            maxSize: 10,
            runChildUpdate: true
        });

        bolasEnergia = this.physics.add.group({
            defaultKey: 'energia',
            maxSize: 20
        });

        this.time.addEvent({
            delay: tiempoAparicion,
            loop: true,
            callback: () => {
                this.generarAsteroides()
            }
        });

        this.physics.add.overlap(nave, asteroides, this.colisionNaveAsteroide, null, this);
        this.physics.add.overlap(balas, asteroides, this.colisionBalaAsteroide, null, this);
        this.physics.add.overlap(nave, bolasEnergia, this.colisionNaveEnergia, null, this);

        derecha = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        izquierda = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        derecha.reset();
        izquierda.reset();

    },
    update() {
        Phaser.Actions.IncY(asteroides.getChildren(), velocidadCaida);
        asteroides.children.iterate(function (asteroide) {
            if (asteroide.y > 600) {
                asteroides.killAndHide(asteroide);
            }
        });

        Phaser.Actions.IncY(bolasEnergia.getChildren(), velocidadCaida);
        bolasEnergia.children.iterate(function (energia) {
            if (energia.y > 600) {
                bolasEnergia.killAndHide(energia);
            }
        });

        nave.body.setVelocityX(0);
        if (izquierda.isDown) {
            nave.body.setVelocityX(-velocidadNave);
        }
        else if (derecha.isDown) {
            nave.body.setVelocityX(velocidadNave);
        }

        if (Phaser.Input.Keyboard.JustDown(spacebar) && nave.municion > 0) {
            var bala = balas.get();

            if (bala) {
                sonidoDisparo.play();
                bala.fire(nave.x, nave.y);
                nave.municion--;
                this.actulizarTexto();
            }
        }
    },
    generarAsteroides() {
        var numeroAsteroides = Phaser.Math.Between(minAsteroides, maxAsteroides);

        for (let i = 0; i < numeroAsteroides; i++) {
            var asteroide = asteroides.get();

            if (asteroide) {
                asteroide.setActive(true).setVisible(true);
                asteroide.setFrame(Phaser.Math.Between(0, 1));
                asteroide.y = -100;
                asteroide.x = Phaser.Math.Between(0, game.config.width);
                this.physics.add.overlap(asteroide, asteroides, (asteroideEnColicion) => {
                    asteroideEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
            }
        }

        var numeroProbabilidad = Phaser.Math.Between(1, 100);

        if (numeroProbabilidad <= probabilidadEnergia) {
            var energia = bolasEnergia.get();

            if (energia) {
                energia.setActive(true).setVisible(true);
                energia.y = -100;
                energia.x = Phaser.Math.Between(0, game.config.width);
                this.physics.add.overlap(energia, asteroides, (energiaEnColicion) => {
                    energiaEnColicion.x = Phaser.Math.Between(0, game.config.width);
                });
            }
        }
    },
    colisionNaveAsteroide(nave, asteroide) {
        if (asteroide.active) {
            asteroides.killAndHide(asteroide);
            asteroide.setActive(false);
            asteroide.setVisible(false);
            damage.play();
            if (nave.vida > 0) {
                nave.vida--;
                if(nave.vida <= 0){
                    this.add.text(game.config.width / 2, game.config.height / 2, 'Fin de la partida.', {
                        fontSize: '50px',
                        fill: 'red'
                    }).setOrigin(0.5);
                    this.scene.pause();
                    setTimeout(()=>{
                        this.scene.stop();
                        this.scene.start('Inicio');
                    },2000)
                }
            }
            this.actulizarTexto();
        }
    },
    colisionBalaAsteroide(bala, asteroide) {
        if (bala.active && asteroide.active) {
            balas.killAndHide(bala);
            bala.setActive(false);
            bala.setVisible(false);
            asteroides.killAndHide(asteroide);
            asteroide.setActive(false);
            asteroide.setVisible(false);
        }
    },
    colisionNaveEnergia(nave, energia) {
        if (energia.active) {
            bolasEnergia.killAndHide(energia);
            energia.setActive(false);
            energia.setVisible(false);
            recarga_energia.play();
            nave.municion += municionPorEnergia;
            this.actulizarTexto();
        }
    },
    actulizarTexto() {

        texto.setText('Vida: ' + nave.vida + '\nMunición: ' + nave.municion);
    }

});

var config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    backgroundColor: 'black',
    parent: 'Juego_nave',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [Inicio,Principal]
};

var game = new Phaser.Game(config);