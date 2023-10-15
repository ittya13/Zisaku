/// <reference path="jquery.js" />
/// <reference path="dq.js" />
/// <reference path="dq-core.js" />

/*
* DQ Retro game UI framework JavaScript library version v0.6.0
*
* Copyright (c) 2009-2010 M., Koji
* Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*
* Date: 2011-07-01 17:34:21 -0900
* Revision: 0002
*/

DQ.lazyLoad(DQ.subdir + "dq-core.js", "DQ.Window", function () {
    DQ.Screen.Canvas = dqextend(DQ.Control, function (parent, options, object) {
        options = DQ.options(options, {
            autoScale: true,
            enableSort: false,
            bg: null,
            fg: null,
            ig: null
        });

        object = object || $('<canvas>');

        this.base(parent, object);

        this._create(options);
    },
    {
        _alpha: 1.0,
        alpha: function (value) {
            if (arguments.length == 0) {
                return this._alpha;
            }
            this._alpha = value;
        },
        _bg: null,
        _fg: null,
        _ig: null,
        _sprites: [],
        _create: function (options) {
            this.size(this.parent.size());

            this._sprites = [];

            this.obj0 = this.obj[0];

            this._bg = options.bg;
            this._fg = options.fg;
            this._ig = options.ig;
            this._enableSort = options.enableSort;
            this.autoScale(options.autoScale);

        },
        _autoScale: true,
        _devicePixelRatio: 1,
        autoScale: function (value) {
            if (!arguments.length) {
                return this._autoScale;
            }
            if (this._autoScale == value) {
                return;
            }
            this._autoScale = value;
            var ctx = this.obj0.getContext("2d");
            if (value) {
                this._devicePixelRatio = window.devicePixelRatio || 1;
            } else {
                this._devicePixelRatio = 1;
            }
            ctx.scale(this._devicePixelRatio, this._devicePixelRatio);

        },
        bg: function (value) {
            if (arguments.length == 0) {
                return this._bg;
            }
            this._bg = value;
        },
        fg: function (value) {
            if (arguments.length == 0) {
                return this._fg;
            }
            this._fg = value;
        },
        ig: function (value) {
            if (arguments.length == 0) {
                return this._ig;
            }
            this._ig = value;
        },
        push: function (sprite) {
            if (!(sprite instanceof DQ.Screen.Canvas.Sprite)) {
                throw new Error("DQ.Screen.Canvas.push:: sprite is not DQ.Screen.Canvas.Sprite");
            }
            this._sprites.push(sprite);
            sprite._canvas = this;
        },
        remove: function (sprite) {
            for (var i = 0; i < this._sprites.length; i++) {
                if (this._sprites[i] == sprite) {
                    this._sprites.splice(i, 1);
                    break;
                }
            }
        },
        drawing: false,
        update: function () {
            if (this.drawing) {
                return;
            }
            this.drawing = true;
            var ctx = this.obj0.getContext("2d");
            this._alpha != 1.0 && (ctx.globalAlpha = this._alpha);
            var sort_compare = function (o1, o2) {
                return o1.zIndex - o2.zInde;
            }

            //準備
            this._enableSort && this._sprites.sort(sort_compare);

            //描画
            !this._bg && ctx.clearRect(0, 0, this._size.width, this._size.height);

            //背景描画
            this._bg && this._bg.draw(ctx, this._size);

            //スプライト描画
            for (var i = 0; i < this._sprites.length; i++) {
                this._sprites[i].draw(ctx, this._size);
            }

            //前景描画
            this._fg && this._fg.draw(ctx, this._size);

            //情報レイヤー描画
            this._ig && this._ig.draw(ctx, this._size);

            this.drawing = false;
        },
        size: function (width, height) {
            if (!arguments.length) {
                return this._size;
            }
            if (width instanceof DQ.Size) {
                height = width.height;
                width = width.width;
            }

            this.width(width);
            this.height(height);
        },
        width: function (value) {
            if (!arguments.length) {
                return this.obj.attr('width');
            }
            this.obj.attr('width', value);
            this._size.width = value;
        },
        height: function (value) {
            if (!arguments.length) {
                return this.obj.attr('height');
            }
            this.obj.attr('height', value);
            this._size.height = value;
        }

    });
    DQ.Screen.Canvas.Sprite = function (options) {
        options = DQ.options(options, {
            uid: 0,
            image: null,
            dir: 0,
            pause: 0,
            zIndex: 0,
            x: 0.0,
            y: 0.0,
            width: 32,
            height: 32,
            size: 32,
            scale: 1,
            animation: false,
            onetime: false,
            onRemove: null
        });
        for (var nm in options) {
            if (options.hasOwnProperty(nm)) {
                this[nm] = options[nm];
            }
        }
        if (this.onetime) {
            //onetime指定可能条件チェック
            if (!this.animation || this.numberofPause == 0) {
                this.onetime = false;
            }
        }
    }
    DQ.Screen.Canvas.Sprite.prototype = {
        animation: true,
        onetime: false,
        uid: 0,
        image: null,
        dir: 0,
        pause: 0,
        zIndex: 0,
        x: 0.0,
        y: 0.0,
        width: 32,
        height: 32,
        scale: 1,
        numberOfPause: 2,
        pattern: [],
        _cd: 0,
        _pos: 0,
        draw: function (ctx, size) {
            var x = this.x;
            var y = this.y;
            var w = this.width, h = this.height;
            if (x < 0 || this._canvas._size.width <= x) {
                return;
            }
            if (y < 0 || this._canvas._size.height <= y) {
                return;
            }
            this._cd++;
            if (this._cd >= this.fps) {
                this._cd = 0;
                if (this.animation && this.numberOfPause > 0) {
                    this._pos++;
                    if (this._pos >= this.numberOfPause) {
                        this._pos = 0;
                        if (this.onetime) {
                            var me = this;
                            setTimeout(function () {
                                me.onRemove && me.onRemove(me);
                                me.remove();
                            }, 0);
                            return;
                        }
                    }
                    if (this.pattern.length) {
                        this.pause = this.pattern[this._pos];
                    } else {
                        this.pause = this._pos;
                    }
                }
            }
            ctx.drawImage(this.image,
                this.pause * w, this.dir * h, w, h,
                Math.floor(x), Math.floor(y), Math.floor(w * this.scale), Math.floor(h * this.scale));
        },
        move: function (dx, dy) {
            this.x += dx;
            this.y += dy;
        },
        remove: function () {
            this._canvas.remove(this);
        }
    }
    DQ.Screen.Canvas.SpriteGroup = function (member) {
        member = member || [];
        this._member = [];
        for (var i = 0; i < member.length; i++) {
            this._member.push(member[i]);
        }
        this.x = 0;
        this.y = 0;
    },
    DQ.Screen.Canvas.SpriteGroup.prototype = {
        setCanvas: function (canvas) {
            for (var i = 0; i < this._member.length; i++) {
                canvas.push(this._member[i]);
            }
        },
        to: function (x, y) {
            var dx = x - this.x;
            var dy = y - this.y;
            this.move(dx, dy);
        },
        move: function (dx, dy) {
            this.x += dx;
            this.y += dy;
            for (var i = 0; i < this._member.length; i++) {
                this._member[i].move(dx, dy);
            }
        },
        update: function (ctx, size) {
            for (var i = 0; i < this._member.length; i++) {
                this._member[i].update(ctx, size);
            }
        },
        remove: function () {
            for (var i = 0; i < this._member.length; i++) {
                this._member[i].remove();
            }
        }
    },

    DQ.Screen.Canvas.BG = function (options) {
        options = DQ.options(options, {
            uid: 0,
            image: null,
            left: 0.0,
            top: 0.0,
            width: 640,
            height: 480
        });
        for (var nm in options) {
            if (options.hasOwnProperty(nm)) {
                this[nm] = options[nm];
            }
        }
    }

    DQ.Screen.Canvas.BG.prototype = {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        move: function (dx, dy) {
            this.left += dx;
            if (this.left >= this.width) {
                this.left -= this.width;
            }

            this.top += dy;
            if (this.top >= this.height) {
                this.top -= this.height;
            }
        },
        draw: function (ctx, size) {
            var lw = 0, lh = 0, left = this.left, top = this.top;
            if (this.width - this.left < size.width) {
                lw = size.width - (this.width - this.left);
            }
            if (this.height - this.top < size.top) {
                lh = size.width - (this.width - this.left);
            }

            var cw = lw ? (this.width - this.left) : size.width,
                ch = lh ? (this.height - this.top) : size.height;
            ctx.drawImage(this.image, left, top,
                cw,
                ch,
                 0, 0, cw, ch);
            if (lw) {
                ctx.drawImage(this.image, 0, top, lw, ch, cw, 0, lw, ch);
            }
            if (lh) {
                ctx.drawImage(this.image, left, 0, cw, lh, 0, ch, cw, lh);
            }
            if (lh && lw) {
                ctx.drawImage(this.image, left, top, lw, lh, cw, ch, lw, lh);
            }
        }
    }
    DQ.Screen.Canvas.FG = function (options) {
        options = DQ.options(options, {
            uid: 0,
            image: null,
            left: 0.0,
            top: 0.0,
            width: 640,
            height: 480
        });
        for (var nm in options) {
            if (options.hasOwnProperty(nm)) {
                this[nm] = options[nm];
            }
        }
    }
    DQ.Screen.Canvas.FG.prototype = {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        move: function (dx, dy) {
            this.left += dx;
            if (this.left >= this.width) {
                this.left -= this.width;
            }

            this.top += dy;
            if (this.top >= this.height) {
                this.top -= this.height;
            }
        },
        draw: function (ctx, size) {
            var lw = 0, lh = 0, left = this.left, top = this.top;
            if (this.width - this.left < size.width) {
                lw = size.width - (this.width - this.left);
            }
            if (this.height - this.top < size.top) {
                lh = size.width - (this.width - this.left);
            }

            var cw = lw ? (this.width - this.left) : size.width,
                ch = lh ? (this.height - this.top) : size.height;
            ctx.drawImage(this.image, left, top,
                cw,
                ch,
                 0, 0, cw, ch);
            if (lw) {
                ctx.drawImage(this.image, 0, top, lw, ch, cw, 0, lw, ch);
            }
            if (lh) {
                ctx.drawImage(this.image, left, 0, cw, lh, 0, ch, cw, lh);
            }
            if (lh && lw) {
                ctx.drawImage(this.image, left, top, lw, lh, cw, ch, lw, lh);
            }
        }
    }
    DQ.Screen.Canvas.IG = function () {
    }
    DQ.Screen.Canvas.IG.prototype = {
        draw: function (ctx, size) {
        }
    }
    DQ._ctrl_['dq-canvas'] = DQ.Screen.Canvas;
});
