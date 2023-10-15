/// <reference path="../jquery.js" />
/// <reference path="../dq.js" />
/// <reference path="../dq-core.js" />
/// <reference path="../dq-canvas.js" />

/*
** DQ Retro game UI framework JavaScript library version v0.6.0
**
** Copyright (c) 2009-2010 M., Koji
** Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
**
** Date: 2011-07-01 17:34:21 -0900
** Revision: 0006
**
**/

DQ.lazyLoad(DQ.subdir + "dq-canvas.js", "DQ.Screen.Canvas", function () {
    DQ.RTG = {}
    DQ.RTG.Engine = function (options) {
        options = DQ.options(options, {
            fps: 16,
            height: 240,
            width: 320,
            images: [],
            sounds: [],
            view: "",
            onGameover: null,
            onLoaded: null,
            onKeydown: null,
            onKeyup: null,
            onInitialize: null,
            onUpdate: null
        });
        for (var nm in options) {
            if (options.hasOwnProperty(nm)) {
                this[nm] = options[nm];
            }
        }

        this._create(options);
    }
    DQ.RTG.Engine.prototype = {
        _canvas: null,
        _create: function (options) {
            world = new DQ.World();
            world.screen = new DQ.Screen(DQ.page(), options.width, options.height, options.view);
            this._canvas = new DQ.Screen.Canvas(world.screen, { autoScale: false }, null);
            world.screen.obj.after(this._keypad);
            this._soundBox = new DQ.SoundMan({ set: options.sounds });
            this._objects = [];

            for (var i = 0; i < this.images.length; i++) {
                this.loadImage(this.images[i]);
            }
        },
        canvas: function () {
            return this._canvas;
        },
        gameOver: function () {
            this.onGameover && this.onGameover(this);
        },
        initialize: function () {
            var me = this;
            DQ.document.keyup(function (e) {
                me.onKeyup && me.onKeyup(e);
                return false;
            });

            DQ.document.keydown(function (e) {
                me.onKeydown && me.onKeydown(e);
                return false;
            });

            this.onInitialize && this.onInitialize(this);
        },
        _image_count: 0,
        _image_max: 0,
        loadImage: function (options) {
            if (!options || !options.width || !options.height || !options.src) {
                throw new Error("DQ.RTG.Engine.loadImage: invalid arguments.");
            }
            var me = this;
            var _image_loaded = function (sender) {
                ///<summary>
                ///読み込み完了イベントハンドラー
                ///</summary>

                //画像を非表示にする
                sender.hide();

                me._image_count++;
                if (me._image_count == me._image_max) {
                    $('#i_loading').remove();
                    me.onLoaded && me.onLoaded();

                    //タイマー開始
                    me.start();
                }
            }

            this._image_max++;
            var name = options.name || "IMG" + new Date();
            options.onLoaded = _image_loaded;
            options.aspect = false;
            options.imgWidth = options.width;
            options.imgHeight = options.height;
            this[name] = new DQ.Image(DQ.page(), options);
            if (this._image_max == 1) {
                $('<div>')
                .css({ 'position': "absolute", 'z-index': 999, 'top': 32, 'left': 32 })
                .attr('id', 'i_loading')
                .text('image loading...')
                .appendTo(document.body);
            }
        },
        _objects: [],
        objects: function () {
            return this._objects;
        },
        playSound: function (index) {
            this._soundBox.play(index);
        },
        push: function (object) {
            this._objects.push(object);
        },
        start: function () {
            this.initialize();
            DQ.fps(this.fps);
            DQ.chain.push(this);
            DQ.start();
            world.screen && world.screen.show();
        },
        setSounds: function (sets) {
            this._soundBox.addRange(sets);
        },
        _soundBox: null,
        stop: function () {
            DQ.stop();
        },
        remove: function (object) {
            for (var i = 0; i < this._objects.length; i++) {
                if (object == this._objects[i]) {
                    this._objects.splice(i, 1);
                }
            }
        },
        update: function () {
            this.updating = true;
            this.onUpdate && this.onUpdate(this, this._canvas);
            for (var i = this._objects.length - 1; 0 <= i; i--) {
                if (!this._objects[i].move()) {
                    this._objects.splice(i, 1);
                    continue;
                }
                this._objects[i].hitTest(this._objects);
            }
            this._canvas.update();
            this.updating = false;
        }
    }
    DQ.RTG.Object = function (options) {
        options = DQ.options(options, {
            engine: null,
            strategy: null,
            sprite: null,
            onRemove: null,
            onHit: null
        });
        this._isRemove = false;
        this._sprite = options.sprite;
        this._engine = options.engine;
        this._strategy = options.strategy;
        this._strategy && (this._strategy._owner = this);
        this.onRemove = options.onRemove;
        this.onHit = options.onHit;

        this._sprite && this._engine._canvas.push(this._sprite);
        this.uid = "O" + new Date();
    }
    DQ.RTG.Object.prototype = {
        _strategy: null,
        _isRemove: false,
        isRemoved: function () {
            return this._isRemove;
        },
        x: function (value) {
            if (arguments.length == 0) {
                return this._sprite.x;
            }
            this._sprite.x = value;
        },
        y: function (value) {
            if (arguments.length == 0) {
                return this._sprite.y;
            }
            this._sprite.y = value;
        },
        width: function (value) {
            if (arguments.length == 0) {
                return this._sprite.width;
            }
            this._sprite.width = value;
        },
        height: function (value) {
            if (arguments.length == 0) {
                return this._sprite.height;
            }
            this._sprite.height = value;
        },
        move: function () {
            var me = this;
            if (!this._strategy.move()) {
                setTimeout(function () {
                    me.remove();
                }, 0);
                return false;
            }
            return true;
        },
        hitTest: function (objects) {
            var ob = this._strategy.hitTest(objects);
            ob && this.onHit && this.onHit(ob);
            return !!ob;
        },
        remove: function () {
            if (this._isRemove) {
                return;
            }
            this._isRemove = true;
            this._sprite.remove();
            this._engine.remove(this);
            this.onRemove && this.onRemove(this);
        },
        onRemove: null,
        onHit: null
    }
    DQ.RTG.DIR = { None: 0, Vertical: 1, Horizontal: 2 }

    DQ.MapRelation = function (data) {
        for (var nm in data) {
            this[nm] = data[nm];
        }
    }
    DQ.MapRelation.prototype = {
        load: function (pos) {
            if (arguments.length) {
                world.map.loadMap(this.url, pos);
            } else {
                world.map.loadMap(this.url);
            }
            if (this.flag != -1) {
                world.flag[this.flag] = true;
            }
        }
    }

    DQ.MapCatalog = function (options) {
        /// <summary>
        /// </summary>

        options = DQ.options(options, {
            url: null,
            callback: null
        });

        this.onLoaded = options.callback;
        this._url = options.url;
        this._url && this.load(this._url);
    }

    DQ.MapCatalog.prototype = {
        catalog: [],
        onLoaded: function () { },
        load: function (url, callback) {
            var me = this;
            DQ.loadCatalog(url, function (data) {
                eval('var s=' + data);
                me._data = s.catalog;
                me.catalog.length = 0;
                me.version = s.version;
                me.catalog = new Array();
                for (var i = 0; i < me._data.length; i++) {
                    me.catalog[me._data[i].uid] = new DQ.MapRelation(me._data[i]);
                }
                debug.writeln(DQ.format("map loading completed:", url));
                callback && callback(me);
                me.onLoaded && me.onLoaded.apply(me);
            });
        },
        find: function (key, value) {
            if (arguments.length == 0) {
                throw new Error("Invalid arguments.");
            }
            if (arguments.length == 1) {
                value = key;
                key = "name";
            }
            for (var i = 10001; i < this.catalog.length; i++) {
                if (this.catalog[i][key] == value) {
                    return this.catalog[i];
                }
            }

            return null;
        }
    }
});