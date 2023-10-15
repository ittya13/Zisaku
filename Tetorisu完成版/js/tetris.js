/// <reference path="js/jquery.js" />
/// <reference path="js/dq.js" />
/// <reference path="js/dq-core.js" />
/// <reference path="js/dq-canvas.js" />
/// <reference path="js/rtg/dq-rtg.js" />
/// <reference path="js/dq-image.js" />



DQ.lazyLoad(DQ.subdir + "rtg/dq-rtg.js", "DQ.RTG.Engine");
DQ.lazyLoad(DQ.subdir + "dq-virtualpad.js", "DQ.VirtualPad");

DQ.afterLoad(function () {
    engine = new DQ.RTG.Engine({
        sounds: sounds,
        images: [
            {
                name: "stageImg",
                width: 320,
                height: 320,
                src: "images/stage.png"
            },
            {
                name: "bgImg",
                width: 320,
                height: 320,
                src: "images/Haikei.jpeg"
            },
            {
                name: "chipImg",
                width: 14,
                height: 112,
                src: "images/block.png"
            },
            {
                name: "flashImg",
                aspect: false,
                width: 140,
                height: 14,
                src: "images/flash.png"
            }
        ],
        fps: DQ.TETRIS.FPS,
        width: 320,
        height: 320,
        onInitialize: function (sender) {
        },
        onKeydown: function (e) {
            switch (e.which) {
                case 86: //'v'
                    if (TETRIS.game == DQ.TETRIS.Mode.Start || TETRIS.game == DQ.TETRIS.Mode.GameOver) {
                        TETRIS.start();
                    } else {
                        TETRIS.rotate(DQ.TETRIS.ROTATE.RIGHT);
                    }
                    break;
                case 67: //'c'
                    if (TETRIS.game == DQ.TETRIS.Mode.Start || TETRIS.game == DQ.TETRIS.Mode.GameOver) {
                        TETRIS.start();
                    } else {
                        TETRIS.rotate(DQ.TETRIS.ROTATE.LEFT);
                    }
                    break;
                case 38: //up
                    TETRIS.hardDrop();
                    break;
                case 40: //down
                    TETRIS.accelerate();
                    break;
                case 37: //left
                    TETRIS.moveCurrent(-1);
                    break;
                case 39: //right
                    TETRIS.moveCurrent(1);
                    break;
            }
        },
        onKeyup: function (e) {
            TETRIS.stopAccelerate();
        },
        onUpdate: function (sender) {
            en = new Date();
            TETRIS.update();
        },
        onLoaded: function () {
            //全画像読み込み完了
            TETRIS = new DQ.TETRIS(engine);
            TETRIS.initialize();
        }
    });

    $('<div>')
                .addClass('tetris-info')
                .attr('id', 'info')
                .text('Push any key...')
                .appendTo(document.body);
    $('<div>')
                .addClass('tetris-line')
                .attr('id', 'line')
                .text(0)
                .appendTo(document.body);
    $('<div>')
                .addClass('tetris-score')
                .attr('id', 'score')
                .text(0)
                .appendTo(document.body);
    $('<div>')
                .addClass('tetris-level')
                .attr('id', 'level')
                .text(1)
                .appendTo(document.body);
    $('<div>')
                .addClass('tetris-DEBUG')
                .attr('id', 'DEBUG')
                .text('')
                .appendTo(document.body);

    keypad = new DQ.VirtualPad({ engine: engine });

    //iphone hack
    setTimeout(function () {
        DQ.document.scrollTop(1);
    }, 200);

});


sounds = [
    [{ src: "../sound/tetris01.mp3", type: "audio/mpeg" }, { src: "../sound/tetris01.ogg", type: "audio/ogg"}],
    [{ src: "../sound/tetris_se02.mp3", type: "audio/mpeg" }, { src: "../sound/tetris_se02.ogg", type: "audio/ogg"}],
    [{ src: "../sound/tetris_se01.mp3", type: "audio/mpeg" }, { src: "../sound/tetris_se01.ogg", type: "audio/ogg"}]]

DQ.TETRIS = function (engine) {
    ///<summary>
    // 外見の設定
    ///</summary>
    ///<param name="engine" type="DQ.RTG.Engine">
    /// リアルタイムゲームエンジンを指定
    ///</param>
    

    this._engine = engine;
    this.next = [];
    this._next7 = [];
    this.stage = new DQ.TETRIS.Stage(engine);
}

//定数を定義
DQ.TETRIS.FPS = 16;
DQ.TETRIS.ROTATE = { LEFT: 0, RIGHT: 1 }
DQ.TETRIS.NextPos = [{ x: 236, y: 84 }, { x: 236, y: 140 }, { x: 236, y: 196}]
DQ.TETRIS.MAX_NEXT = 3;
DQ.TETRIS.STAGE_LEFT = 80;
DQ.TETRIS.CHIP_SIZE = 14;
DQ.TETRIS.Mode = { Start: 0, Play: 1, GameOver: 2, Erase: 3, Delay: 4 }
DQ.TETRIS.StageMode = { None: 0, Flash: 1, Erase: 2, Down: 3 }

//ゲームバランス用の値
DQ.TETRIS.Game = { StartG: 0.4, AccelerateG: 24, ScoreTable: [0, 100, 300, 400, 800], LevelUp: 0.4 }

DQ.TETRIS.prototype = {
    _backupG: 0,
    g: DQ.TETRIS.Game.StartG,
    gdy: 0,
    fps: DQ.TETRIS.FPS,
    wait: 60,
    current: null,
    ghost: null,
    next: [],
    stage: null,
    score: { level: 1, line: 0, score: 0, time: null },
    game: DQ.TETRIS.Mode.Start,
    initialize: function () {
        ///<summary>
        /// 初期化処理
        ///</summary>

        //ステージをスプライトとして追加
        var stage = new DQ.Screen.Canvas.Sprite({
            y: 0,
            x: 0,
            width: 320,
            height: 320,
            animation: false,
            numberOfPause: 0,
            image: this._engine.stageImg.client[0]
        });
        //背景を設定
        var bg = new DQ.Screen.Canvas.BG({
            width: this._engine.bgImg.width(),
            height: this._engine.bgImg._height,
            image: this._engine.bgImg.client[0]
        });
        this._engine.canvas().push(stage);
        this._engine.canvas().bg(bg);

        $('#info').html(
            'Tetorisu Game<br /><br />' +
            'ボタンで開始'
            ).show();

        this.updateScore();

        this.genNextTetrimino();
    },
    clear: function () {
        ///<summary>
        /// ゲームの状態を初期化します。
        ///</summary>
        this.score.line = this.score.score = 0;
        this.score = { level: 1, line: 0, score: 0, time: null }

        this.g = DQ.TETRIS.Game.StartG;
        this.calcGDY();

        this.score.time = new Date();

        this.current && this.current.remove();
        this.stage.clear();
        this.updateScore();
    },
    calcGDY: function () {
        this.gdy = this.g * DQ.TETRIS.CHIP_SIZE / this.fps;
        //1chip分/framを最大値とする(hitTest()が対応していないので）
        this.gdy = this.gdy > DQ.TETRIS.CHIP_SIZE ? DQ.TETRIS.CHIP_SIZE - .1 : this.gdy;
    },
    levelUp: function () {
        this.g += DQ.TETRIS.Game.LevelUp;
        this.calcGDY();
    },
    start: function () {
        ///<summary>
        ///ゲームを開始します。
        ///</summary>

        //BGM
        world.playSound(sounds[0]);

        this.clear();
        $('#info').hide();

        this.game = DQ.TETRIS.Mode.Play;
        this.shiftCurrent();
    },
    accelerate: function () {
        ///<summary>
        ///落下中のテトリミノを加速します。
        ///</summary>

        if (this._backupG == 0) {
            this._backupG = this.g;
            this._startPos = this.current.y;
            this.g = DQ.TETRIS.Game.AccelerateG;
            this.calcGDY();
        }
    },
    isAccelerate: function () {
        ///<summary>
        ///加速中かどうかを判定します。
        ///</summary>

        return this._backupG > 0;
    },
    stopAccelerate: function () {
        ///<summary>
        ///加速を止めて、自由落下速度に戻します。
        ///</summary>

        if (this._backupG) {
            this.g = this._backupG;
            this.calcGDY();
            this._backupG = 0;
        }
    },
    rotate: function (dir) {
        ///<summary>
        ///テトリミノを回転させます。
        ///</summary>

        if (this.game != DQ.TETRIS.Mode.Play && this.game != DQ.TETRIS.Mode.Delay) {
            //自由落下中もしくは「遊び」期間以外は無視
            return;
        }

        var me = this,
            _hitTest = function (dy) {
                if (me.hitTest(0, dy)) {
                    return false;
                }
                //ゴーストも回転＆再配置
                me.ghost.rotate(dir);
                me.moveGhost();
                me.game = DQ.TETRIS.Mode.Play;
                return true;
            }
        this.current.rotate(dir);
        if (_hitTest(0)) {
            return;
        }
        //とりあえずY軸のみ救済してみる
        if ((this.current.y - this.stage.top) > DQ.TETRIS.CHIP_SIZE * 2) {
            if (_hitTest(-DQ.TETRIS.CHIP_SIZE)) {
                this.current.move(0, -DQ.TETRIS.CHIP_SIZE);
                return;
            }
            if (this.current.type == DQ.TETRIS.TetriminoFactory.DIR.I
                && this.hitTest(0, -DQ.TETRIS.CHIP_SIZE * 2)) {
                this.current.move(0, -DQ.TETRIS.CHIP_SIZE * 2);
                return;
            }

        }

        //回転すると障害物に当たるので元に戻して中断
        this.current.rotate(dir == DQ.TETRIS.ROTATE.LEFT ? DQ.TETRIS.ROTATE.RIGHT : DQ.TETRIS.ROTATE.LEFT);
        return;
    },
    _next7: [],
    _genNextTetrimino7: function () {
        var used = [false, false, false, false, false, false, false];
        this._next7 = [];
        for (var i = 0; i < 7; i++) {
            while (true) {
                var candidate = Math.floor(Math.random() * 7);
                if (i < 2 && (candidate == DQ.TETRIS.TetriminoFactory.DIR.S || candidate == DQ.TETRIS.TetriminoFactory.DIR.Z)) {
                    continue;
                }
                if (used[candidate]) {
                    continue;
                }
                used[candidate] = true;
                this._next7.push(candidate);
                break;
            }
        }
    },
    genNextTetrimino: function () {
        ///<summary>
        ///次のテトリミノを作成します。
        ///</summary>

        //上限 MAX_NEXT分だけ、次のテトリミノを作成する
        for (var i = this.next.length; i < DQ.TETRIS.MAX_NEXT; i++) {
            this._next7.length == 0 && this._genNextTetrimino7();
            var mino = DQ.TETRIS.TetriminoFactory.create(this._next7.shift());
            mino.setCanvas(this._engine.canvas());
            this.next.push(mino);
        }

        //待機位置へ移動
        for (var i = 0; i < DQ.TETRIS.MAX_NEXT; i++) {
            this.next[i].to(DQ.TETRIS.NextPos[i].x, DQ.TETRIS.NextPos[i].y);
        }
    },
    gameOver: function () {
        ///<summary>
        ///ゲームオーバー状態へ移行します。
        ///</summary>

        this.current.remove();
        this.ghost && this.ghost.remove();
        this.game = DQ.TETRIS.Mode.GameOver;
        $('#info').text('Game Over').show();
    },
    hitTest: function (dx, dy) {
        ///<summary>
        ///落下中テトリミノの当たり判定をします。
        ///</summary>
        ///<param name="dx" type="number">
        /// 横移動量(pixel)
        ///</param>
        ///<param name="dy" type="number">
        /// 縦移動量(pixel)
        ///</param>

        return this.stage.hitTest(this.current, dx, dy);
    },
    shiftCurrent: function () {
        ///<summary>
        ///次のテトリミノを落下中にテトリミノに移行します。
        ///</summary>

        this.current = this.next.shift();
        this.current.to(DQ.TETRIS.STAGE_LEFT + DQ.TETRIS.CHIP_SIZE * 3, this.stage.top);
        if (this.hitTest(0, 0)) {
            //開始位置で衝突するなら終了
            this.gameOver();
            return;
        }
        this.genNextTetrimino();

        //ゴーストを作成
        this.ghost && this.ghost.remove();
        this.ghost = DQ.TETRIS.TetriminoFactory.createGhost(this.current);
        this.ghost.setCanvas(this._engine.canvas());
        this.ghost.to(DQ.TETRIS.STAGE_LEFT + DQ.TETRIS.CHIP_SIZE * 3, this.stage.top);

        this.moveGhost();
    },
    hardDrop: function () {
        ///<summary>
        ///ゴーストを落下中のテトリミノに合わせて移動します。
        ///</summary>
        if (TETRIS.game == DQ.TETRIS.Mode.Start || TETRIS.game == DQ.TETRIS.Mode.GameOver) {
            return;
        }

        var y = 21 - Math.floor((this.current.y - this.stage.top) / DQ.TETRIS.CHIP_SIZE);
        for (var i = 0; i < y; i++) {
            if (this.stage.hitTest(this.current, 0, (i + 1) * DQ.TETRIS.CHIP_SIZE)) {
                var y = this.current.y - this.stage.top;
                $('#DEBUG').text('');
                $('#DEBUG').append($('<div>').text('cur_y:' + this.current.y));
                this.current.move(0, i * DQ.TETRIS.CHIP_SIZE);
                $('#DEBUG').append($('<div>').text('pre_y:' + this.current.y));
                this.current.fit();
                $('#DEBUG').append($('<div>').text('post_y:' + this.current.y));
                this.score.score += Math.floor((this.current.y - y) / DQ.TETRIS.CHIP_SIZE);
                this.updateScore();

                this.game = DQ.TETRIS.Mode.Delay;
                this._elapse = this.wait;
                break;
            }
        }
    },
    moveGhost: function () {
        ///<summary>
        ///ゴーストを落下中のテトリミノに合わせて移動します。
        ///</summary>

        this.ghost.to(this.ghost.x, this.stage.top);
        for (var i = 0; i < 21; i++) {
            if (this.stage.hitTest(this.ghost, 0, (i + 1) * DQ.TETRIS.CHIP_SIZE)) {
                this.ghost.move(0, i * DQ.TETRIS.CHIP_SIZE);
                break;
            }
        }
    },
    moveCurrent: function (dx) {
        ///<summary>
        ///落下中のテトリミノを横移動させます。
        ///</summary>

        switch (this.game) {
            case DQ.TETRIS.Mode.Start:
            case DQ.TETRIS.Mode.GameOver:
            case DQ.TETRIS.Mode.Erase:
                return;
            case DQ.TETRIS.Mode.Play:
            case DQ.TETRIS.Mode.Delay:
                if (this.hitTest(dx * DQ.TETRIS.CHIP_SIZE, 0)) {
                    return;
                }

                this.current.move(dx * DQ.TETRIS.CHIP_SIZE, 0);
                this.ghost.move(dx * DQ.TETRIS.CHIP_SIZE, 0);
                this.moveGhost();

                //横に移動すると強制的に「遊び」から移動中に復帰
                this.game = DQ.TETRIS.Mode.Play;
        }
    },
    updateScore: function () {
        $('#score').text(this.score.score);
        $('#line').text(this.score.line);
        $('#level').text(this.score.level);
    },
    update: function () {
        ///<summary>
        ///１周期分、ゲーム状態を更新します。
        ///</summary>

        var mode = DQ.TETRIS.Mode;
        switch (this.game) {
            case mode.Start:
            case mode.GameOver:
                return;
            case mode.Erase:
                //ラインの削除演出中
                this.stage.update();
                if (this.stage.mode == DQ.TETRIS.StageMode.Erase && this.stage._elapse == 0) {
                    //ラインが消えた状態の初回
                    //world.playJingle(sounds[2], false);
                    engine.playSound(2);
                }
                if (this.stage.mode == DQ.TETRIS.StageMode.None) {
                    //演出完了
                    this.game = DQ.TETRIS.Mode.Play;
                    //落下したラインに合わせてゴーストを移動
                    this.moveGhost();
                }
                break;
            case mode.Delay:
                //「遊び」中
                this._elapse += 60 / this.fps;
                if (this.wait <= this._elapse) {
                    this.game = DQ.TETRIS.Mode.Play;
                    this.stage.transChip(this.current);
                    this.current.remove();
                    this.shiftCurrent();
                    //world.playJingle(sounds[1], false);
                    engine.playSound(1);

                    var n_line = this.stage.eraseLine();
                    if (n_line > 0) {
                        this.score.score += DQ.TETRIS.Game.ScoreTable[n_line];
                        this.score.line += n_line;
                        var pre = this.score.level;
                        this.score.level = Math.floor(this.score.line / 10) + 1;
                        if (pre != this.score.level) {
                            this.levelUp();
                        }
                        this.updateScore();

                        this.game = DQ.TETRIS.Mode.Erase;
                        return;
                    }
                }
                break;
            case mode.Play:
                //「落下中」
                if (this.isAccelerate()) {
                    if (this.current.y - this._startPos > DQ.TETRIS.CHIP_SIZE) {
                        this.score.score++;
                        this.updateScore();
                        this._startPos += DQ.TETRIS.CHIP_SIZE;
                    }
                }
                var dy = this.gdy;
                if (this.hitTest(0, dy + DQ.TETRIS.CHIP_SIZE)) {
                    //「遊び」に移行
                    this.game = DQ.TETRIS.Mode.Delay;
                    this._elapse = 0;
                    this.stopAccelerate();
                    this.current.move(0, dy);
                    $('#DEBUG').text('');
                    $('#DEBUG').append($('<div>').text('pre_y:' + this.current.y));
                    this.current.fit();
                    $('#DEBUG').append($('<div>').text('post_y:' + this.current.y));
                } else {
                    this.current.move(0, dy);
                }
                break;
        }

    }
}
DQ.TETRIS.Line = function (line) {
    ///<summary>
    ///ステージ中の各ラインのチップを管理します。
    ///</summary>
    ///<param name="line" type="number">
    ///行番号を指定
    ///</param>

    this._line = line;
    this.chips = [null, null, null, null, null, null, null, null, null, null];
}
DQ.TETRIS.Line.prototype = {
    chips: [],
    _line: 0,
    line: function (value) {
        ///<summary>
        ///ライン番号を取得または設定します。
        ///</summary>
        ///<param name="value" type="number">
        ///ライン番号を指定
        ///</param>

        if (arguments.length == 0) {
            return this._line;
        }

        //ライン番号からチップの座標を再作成する
        var dy = (value - this._line) * DQ.TETRIS.CHIP_SIZE;
        for (var i = 0; i < this.chips.length; i++) {
            if (this.chips[i]) {
                this.chips[i].y += dy;
            }
        }
        this._line = value;
    },
    chip: function (pos, chip) {
        ///<summary>
        ///チップを取得または設定します。
        ///</summary>
        ///<param name="pos" type="number">
        ///チップ位置を指定
        ///</param>
        ///<param name="chip" type="sprite">
        ///チップとして表示するスプライトを指定(option)
        ///</param>

        if (arguments.length == 1) {
            return this.chip[pos];
        }
        this.chips[pos] = chip;
    },
    canErase: function () {
        ///<summary>
        ///ラインが削除可能かを判定します。
        ///</summary>

        for (var i = 0; i < this.chips.length; i++) {
            if (this.chips[i] == null) {
                return false;
            }
        }

        return true;
    },
    canDown: function () {
        ///<summary>
        ///ラインが下に落ちるかを判定します。
        ///</summary>

        for (var i = 0; i < this.chips.length; i++) {
            if (this.chips[i] != null) {
                return false;
            }
        }
        return true;
    },
    clear: function () {
        ///<summary>
        ///ライン上のチップをクリアーします。
        ///</summary>
        for (var i = 0; i < this.chips.length; i++) {
            this.chips[i].remove();
            this.chips[i] = null;
        }
    }
}

DQ.TETRIS.Stage = function (engine) {
    ///<summary>
    ///ステージ上のラインを管理します。
    ///</summary>

    this._engine = engine;
    this.lines = [];
    for (var i = 0; i < 22; i++) {
        this.lines.push(new DQ.TETRIS.Line(i));
    }
}
DQ.TETRIS.Stage.prototype = {
    left: DQ.TETRIS.STAGE_LEFT,
    top: -14,
    lines: [],
    clear: function () {
        ///<summary>
        /// ライン上のチップを全て削除して初期状態にします。
        ///</summary>

        for (var ln = 0; ln < this.lines.length; ln++) {
            for (var i = 0; i < 10; i++) {
                if (this.lines[ln].chips[i]) {
                    this.lines[ln].chips[i].remove();
                    this.lines[ln].chips[i] = null;
                }
            }
        }
    },
    wait: 30,
    mode: DQ.TETRIS.StageMode.None,
    update: function () {
        ///<summary>
        ///１周期分、ステージ上のライン状態を更新します。
        ///</summary>

        if (this.mode == DQ.TETRIS.StageMode.None) {
            return;
        }
        this._elapse += 60 / TETRIS.fps;
        if (this.wait <= this._elapse) {
            //時間経過を超えた
            switch (this.mode) {
                case DQ.TETRIS.StageMode.Flash:
                    //フラッシュ中から削除中へ移行
                    this.mode = DQ.TETRIS.StageMode.Erase;
                    this._elapse = 0;
                    for (var i = 21; 2 <= i; i--) {
                        if (this.lines[i].canErase()) {
                            this.lines[i].clear();
                        }
                    }
                    for (var i = 0; i < this._lineFlash.length; i++) {
                        this._lineFlash[i].remove();
                    }
                    this._lineFlash = [];
                    break;
                case DQ.TETRIS.StageMode.Erase:
                    //削除中から通常へ移行
                    this.mode = DQ.TETRIS.StageMode.None;
                    this._elapse = 0;
                    var count = 0;
                    for (var i = 21; 2 <= i; i--) {
                        if (this.lines[i].canDown()) {
                            this.lines.splice(i, 1);
                            count++;
                        }
                    }
                    //削除した分だけラインを追加
                    for (i = 0; i < count; i++) {
                        this.lines.unshift(new DQ.TETRIS.Line(0));
                    }
                    //ライン番号を振り直す
                    for (i = 0; i < 22; i++) {
                        this.lines[i].line(i);
                    }
                    break;
            }
        }
    },
    eraseLine: function () {
        ///<summary>
        ///削除可能なラインを抽出します。
        ///</summary>
        ///<return>
        ///削除可能なラインの数を返します。
        ///</return>

        this._lineFlash = [];
        for (var i = 21; 2 <= i; i--) {
            if (this.lines[i].canErase()) {
                //削除可能なラインがあったのでフラッシュ状態へ移行
                this.mode = DQ.TETRIS.StageMode.Flash;
                this._elapse = 0;
                var line = new DQ.Screen.Canvas.Sprite({
                    y: i * DQ.TETRIS.CHIP_SIZE + this.top,
                    x: this.left,
                    width: DQ.TETRIS.CHIP_SIZE * 10,
                    height: DQ.TETRIS.CHIP_SIZE,
                    animation: false,
                    numberOfPause: 0,
                    image: engine.flashImg.client[0]
                });
                this._lineFlash.push(line);
                engine.canvas().push(line);
            }
        }
        return this._lineFlash.length;
    },
    transChip: function (mino) {
        ///<summary>
        ///落下中だったテトリミノをチップへ変換します。
        ///</summary>
        ///<param name="mino" type="Tetrimino">
        ///変換するテトリミノを指定
        ///</param>

        for (var i = 0; i < 4; i++) {
            var chip = mino.chip(i);
            var cx = Math.floor((chip.x - this.left) / DQ.TETRIS.CHIP_SIZE);
            var ln = Math.floor((chip.y - this.top) / DQ.TETRIS.CHIP_SIZE);
            this.lines[ln].chips[cx] = new DQ.Screen.Canvas.Sprite({
                image: engine.chipImg.client[0],
                x: cx * DQ.TETRIS.CHIP_SIZE + this.left,
                y: ln * DQ.TETRIS.CHIP_SIZE + this.top,
                width: DQ.TETRIS.CHIP_SIZE,
                height: DQ.TETRIS.CHIP_SIZE,
                dir: mino.type,
                animation: false,
                numberOfPause: 0
            });
            this._engine.canvas().push(this.lines[ln].chips[cx]);
        }
    },
    hitTest: function (mino, dx, dy) {
        ///<summary>
        ///指定のテトリミノの当たり判定をします。
        ///</summary>
        ///<param name="mino" type="Tetrimino">
        ///対象となるテトリミノを指定
        ///</param>
        ///<param name="dx", type="number">
        ///x方向の移動予定幅を指定
        ///</param>
        ///<param name="dy", type="number">
        ///y方向の移動予定幅を指定
        ///</param>

        for (var i = 0; i < 4; i++) {
            var chip = mino.chip(i);
            var cx = Math.floor((chip.x + dx - this.left) / DQ.TETRIS.CHIP_SIZE);
            var cy = Math.floor((chip.y + dy - this.top) / DQ.TETRIS.CHIP_SIZE);
            //wall
            if (cx < 0
                || 10 <= cx
                || 22 <= cy) {
                return true;
            }
            if (this.lines[cy].chips[cx]) {
                return true;
            }
        }

        return false;
    }
}
DQ.TETRIS.TetriminoFactory = {
    DIR: { I: 0, O: 1, S: 2, Z: 3, J: 4, L: 5, T: 6, G: 7 },
    types: [
        [ //I
            [[0, 1], [1, 1], [2, 1], [3, 1]],
            [[1, 0], [1, 1], [1, 2], [1, 3]],
            [[0, 2], [1, 2], [2, 2], [3, 2]],
            [[2, 0], [2, 1], [2, 2], [2, 3]]
        ],
        [ //O
            [[1, 0], [1, 1], [2, 0], [2, 1]],
            [[1, 0], [1, 1], [2, 0], [2, 1]],
            [[1, 0], [1, 1], [2, 0], [2, 1]],
            [[1, 0], [1, 1], [2, 0], [2, 1]]
        ],
        [ //S
            [[0, 1], [1, 1], [1, 0], [2, 0]],
            [[1, 0], [1, 1], [2, 1], [2, 2]],
            [[2, 1], [1, 1], [1, 2], [0, 2]],
            [[0, 0], [0, 1], [1, 1], [1, 2]],
        ],
        [ //Z
            [[0, 0], [1, 0], [1, 1], [2, 1]],
            [[2, 0], [2, 1], [1, 1], [1, 2]],
            [[0, 1], [1, 1], [1, 2], [2, 2]],
            [[1, 0], [1, 1], [0, 1], [0, 2]]
        ],
        [ //J
            [[0, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [1, 2], [2, 0]],
            [[0, 1], [1, 1], [2, 1], [2, 2]],
            [[1, 0], [1, 1], [1, 2], [0, 2]]
        ],
        [ //L
            [[0, 1], [1, 1], [2, 1], [2, 0]],
            [[1, 0], [1, 1], [1, 2], [2, 2]],
            [[0, 1], [1, 1], [2, 1], [0, 2]],
            [[1, 0], [1, 1], [1, 2], [0, 0]],
        ],
        [ //T
            [[0, 1], [1, 1], [2, 1], [1, 0]],
            [[1, 0], [1, 1], [1, 2], [2, 1]],
            [[0, 1], [1, 1], [2, 1], [1, 2]],
            [[1, 0], [1, 1], [1, 2], [0, 1]]
        ]],
    create: function (type) {
        var chips = DQ.TETRIS.TetriminoFactory.types[type][0];
        var sprites = [];
        for (var i = 0; i < chips.length; i++) {
            sprites.push(
                new DQ.Screen.Canvas.Sprite({
                    image: engine.chipImg.client[0],
                    x: chips[i][0] * DQ.TETRIS.CHIP_SIZE,
                    y: chips[i][1] * DQ.TETRIS.CHIP_SIZE,
                    width: DQ.TETRIS.CHIP_SIZE,
                    height: DQ.TETRIS.CHIP_SIZE,
                    dir: type,
                    animation: false,
                    numberOfPause: 0
                })
            );
        }
        var group = new DQ.Screen.Canvas.SpriteGroup(sprites);
        return new DQ.Tetrimino(type, group);
    },
    createGhost: function (mino) {
        var chips = DQ.TETRIS.TetriminoFactory.types[mino.type][0];
        var sprites = [];
        for (var i = 0; i < chips.length; i++) {
            sprites.push(
                new DQ.Screen.Canvas.Sprite({
                    image: engine.chipImg.client[0],
                    x: chips[i][0] * DQ.TETRIS.CHIP_SIZE,
                    y: chips[i][1] * DQ.TETRIS.CHIP_SIZE,
                    width: DQ.TETRIS.CHIP_SIZE,
                    height: DQ.TETRIS.CHIP_SIZE,
                    dir: DQ.TETRIS.TetriminoFactory.DIR.G,
                    animation: false,
                    numberOfPause: 0
                })
            );
        }
        var group = new DQ.Screen.Canvas.SpriteGroup(sprites);
        return new DQ.Tetrimino(mino.type, group);
    },
    rotate: function (mino, dir, ndir) {
        var pre = DQ.TETRIS.TetriminoFactory.types[mino.type][dir];
        var pos = DQ.TETRIS.TetriminoFactory.types[mino.type][ndir];
        for (var i = 0; i < mino._group._member.length; i++) {
            var sp = mino._group._member[i];
            var cx = sp.x - pre[i][0] * DQ.TETRIS.CHIP_SIZE;
            var cy = sp.y - pre[i][1] * DQ.TETRIS.CHIP_SIZE;
            cx += pos[i][0] * DQ.TETRIS.CHIP_SIZE;
            cy += pos[i][1] * DQ.TETRIS.CHIP_SIZE;

            sp.x = cx;
            sp.y = cy;
        }
    }
}

DQ.Tetrimino = function (type, group) {
    ///<summary>
    ///テトリミノを管理します。
    ///</summary>

    this.type = type;
    this._group = group;
    this.dir = 0;
}
DQ.Tetrimino.prototype = {
    dir: 0,
    x: 0.0,
    y: 0.0,
    line: 0,
    chip: function (no) {
        ///<summary>
        ///指定のチップの座標情報を取得します。
        ///</summary>
        ///<param name="no" type="number">
        /// チップ番号(0～3)
        ///</param>

        var sp = this._group._member[no];
        return { x: sp.x, y: sp.y }
    },
    to: function (x, y) {
        ///<summary>
        ///テトリミノを指定の座標へ移動します。
        ///</summary>
        ///<param name="x" type="number">
        /// x座標(画面座標系)
        ///</param>
        ///<param name="y" type="number">
        /// y座標(画面座標系)
        ///</param>

        this.x = x;
        this.y = y;
        this._group.to(x, y);
    },
    fit: function () {
        ///<summary>
        ///実数値だった座標をチップの高さ*nの値へ調整します。
        ///</summary>

        this.y = Math.floor(this.y / DQ.TETRIS.CHIP_SIZE) * DQ.TETRIS.CHIP_SIZE + .1;
        this._group.to(this.x, this.y);
    },
    move: function (dx, dy) {
        ///<summary>
        ///指定された移動量だけテトリミノを移動します。
        ///</summary>
        ///<param name="dx" type="number">
        /// 横移動量(pixel)
        ///</param>
        ///<param name="dy" type="number">
        /// 縦移動量(pixel)
        ///</param>

        this.x += dx;
        this.y += dy;
        this._group.move(dx, dy);
    },
    rotate: function (dir) {
        ///<summary>
        ///テトリミノを回転します。
        ///</summary>
        ///<param name="dir" type="DQ.TETRIS.ROTATE">
        ///向きを指定
        ///</param>

        var ndir
        if (dir == DQ.TETRIS.ROTATE.RIGHT) {
            ndir = this.dir + 1;
            ndir = ndir == 4 ? 0 : ndir;
        } else {
            ndir = this.dir - 1;
            ndir = ndir == -1 ? 3 : ndir;
        }
        DQ.TETRIS.TetriminoFactory.rotate(this, this.dir, ndir);

        //
        this.dir = ndir;
    },
    remove: function () {
        ///<summary>
        ///保有するスプライトを削除します。
        ///</summary>

        this._group.remove();
    },
    setCanvas: function (canvas) {
        ///<summary>
        ///スプライトに表示対象のcavasを渡します。
        ///</summary>
        ///<param name="canvas" type="DQ.Screen.Canvas">
        ///描画対象のDQ.Screen.Canvasを指定
        ///</param>

        this._group.setCanvas(canvas);
    }
}
