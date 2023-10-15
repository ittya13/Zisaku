/// <reference path="jquery.js" />
/// <reference path="dq.js" />

/*
* DQ Retro game UI framework JavaScript library version v0.6.0
*
* Copyright (c) 2009-2010 M., Koji
* Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*
* Date: 2010-04-01 17:34:21 -0900
* Revision: 0017
*/

DQ.DEFAULT_WIDTH = 512;
DQ.DEFAULT_HEIGHT = 512;
DQ.RESOLUTION = 32;
DQ.DEFAULT_TEXT_SPEED = 4; // (5 - n) * 31.25 ; 5 : no wait
DQ.SPRITE32 = "sprite32";
DQ.SPRITE16 = "sprite16";
DQ.TOOL_IMAGE = "images/toolbar.png";
DQ.CLICK_IMAGE = "images/click.gif";
DQ.DEFAULT_VWIDTH = 512;
DQ.DEFAULT_VHEIGHT = 512;
DQ.MAP_DELTA = 1;
DQ.SCROLL_SPEED = 15.625;
DQ.MAX_FLAG = 64;
DQ.L1 = 16;
DQ.DIR = { NONE: 0, LEFT: 1, RIGHT: 2, UP: 4, DOWN: 8, LU: 5, RU: 6, LD: 9, RD: 10 }

DQ._message['ja'] = DQ._message['ja'] || [];
DQ._message['ja']['Yes'] = "はい";
DQ._message['ja']['No'] = "いいえ";
DQ._message['ja']['Cancel'] = "キャンセル";
DQ._message['ja']['Retry'] = "再試行";
DQ._message['ja']['New'] = "新規";
DQ._message['ja']['Delete'] = "削除";
DQ._message['ja']['Add'] = "追加";
DQ._message['ja']['Edit'] = "編集";
DQ._message['ja']['Update'] = "更新";
DQ._message['ja']['Demo'] = "デモ";

DQ.Catalog = function (options) {
    ///<summary>
    /// json形式のカタログ情報の読み込み管理します。
    ///</summary>
    options = options || {};
    options.url && this.load(options.url, options.callback);
}
DQ.Catalog.prototype = {
    catalog: null,
    dqid: "DQ.Catalog",
    load: function catalog$load(url, fn) {
        var me = this;
        DQ.loadCatalog(url, function catalog$_load(data) {
            eval("var s = " + data);
            me.catalog = s;
            if (s.catalog) {
                debug.writeln(DQ.format("DQ.Catalog.load({0}): detect obsolute keyword 'catalog'", url));
            }
            fn && fn(me, [data]);
        });
    },
    find: function (key, value) {
        if (!this.catalog) {
            throw new Error(DQ.format("DQ.Catalog.find:: catalog not loaded."));
        }

        //catalog.catalog is obsolute.
        if (!this.catalog.catalog && !this.catalog.data) {
            return null;
        }
        var catalog = this.catalog.catalog || this.catalog.data;
        for (var i = 0; i < catalog.length; i++) {
            if (catalog[i][key] && catalog[i][key] == value) {
                return catalog[i];
            }
        }
        return null;
    }
}

DQ.genRandom = function (base) {
    /// <summary>
    /// 攻撃や呪文などのムラを算出
    /// </summary>
    return Math.floor(Math.random() * base * .3);
}

DQ.Chain = dqextend(Array, function (owner) {
    /// <summary>
    /// 連結リストを作成します
    /// </summary>

    this._owner = owner || null;
    this.base();
    this.length = 0;
    this.reason = new Array();
},
{
    reason: null,
    push: function (object, reason) {
        this.__super.push.apply(this, arguments);
        object.owner = this._owner;
        this.reason = [];
        reason = reason || this.reason;

        object.enter && object.enter(this.reason);
        this.reason = new Array();
        object.getText && object.getText() && this.reason.push(object.getText());
    },
    remove: function (pos) {
        if (pos < 0 || this.length <= pos) {
            throw new Error("DQ.Chain::remove:Index out of range.");
        }
        this[pos].leave && this[pos].leave();
        this.splice(pos, 1);
    },
    owner: null,
    or: function (command, reason) {
        this.reason = [];
        reason = reason || this.reason;
        if (!this.length) {
            return false;
        }
        var res = this[0][command].apply(this[0], [reason]);
        for (var i = 1; i < this.length; i++) {
            res |= this[i][command].apply(this[i], [reason]);
        }
        return res;
    },
    and: function (command, reason) {
        this.reason = [];
        reason = reason || this.reason;
        if (!this.length) {
            return false;
        }
        var res = this[0][command].apply(this[0], [reason]);
        for (var i = 1; i < this.length; i++) {
            res &= this[i][command].apply(this[i], [reason]);
        }
        return res;
    },
    logicalAnd: function (command, reason) {
        this.reason = [];
        reason = reason || this.reason;
        if (!this.length) {
            return false;
        }
        for (var i = 0; i < this.length; i++) {
            if (!this[i][command].apply(this[i], [reason])) {
                return false;
            }
        }
        return true;
    }
});

//デバッグ
DQ.Debug = dqextend(DQ.Control, function (parent) {
    ///<summary>
    /// デバッグコンソールを作成します。
    ///</summary>
    ///<param name="parent" type="DQ.Control">
    ///親コントロールを指定
    ///</param>

    var o = $('<div>').addClass('dq-console');
    this.base(parent, o);
    this._create();
}, {
    _create: function (options) {
        //構造
        var o = this.obj,
            outer = $('<div>').addClass('outer').appendTo(o),
            idiv = $('<div>').addClass('command').appendTo(outer);

        this.input = $('<input>').attr('type', "text").appendTo(idiv);
        this.client = $('<textarea readOnly="true" rows="18" ></textarea>').appendTo(outer);

        //イベント
        this.input.bind("keypress", this, function (e) {
            var me = e.data;
            if (e.which == 13) {
                var res;
                try {
                    res = eval(me.input[0].value);
                } catch (ex) {
                    res = ex.name + ":" + ex.message;
                }
                me.writeln(res);
                e.stopImmediatePropagation();
                return false;
            }
            return true;
        });
    },
    write: function (text) {
        this.client[0].value += text;
    },
    writeln: function (text) {
        this.client[0].value += text + String.fromCharCode(13);
        this.client.scrollTop(this.client[0].scrollHeight);
    }
});

DQ.Screen = dqextend(DQ.Control, function (parent, width, height, object) {
    /// <summary>
    ///     ゲーム表示画面を定義します。
    /// </summary>
    /// <param name="parent" type="DQ.Control">
    ///     screenを割り当てる要素をjQueryでラップして指定
    /// </param>
    /// <param name="width" type="number">
    ///     スクリーンの幅を指定
    /// </param>
    /// <param name="height" type="number">
    ///     スクリーンの高さを指定
    /// </param>
    /// <param name="object" type="DOM or jQuery">
    ///     スクリーンの要素を指定
    /// </param>
    var options = DQ.options({}, {
        width: width || DQ.DEFAULT_WIDTH,
        height: height || DQ.DEFAULT_HEIGHT
    });
    object = object || $('<div>');

    this.base(parent, object);
    this._create(options);

    return this;
}, {
    dqid: "DQ.Screen",
    _msgBox: null,
    _create: function (options) {
        this.client = $('<div>').appendTo(this.obj);
        this.name = "Screen1";
        this.width(options.width);
        this.height(options.height);
        this.view = new DQ.Screen.View(this, { width: this._width, height: this._height });
        this.client.css({ position: 'absolute', top: '0px', left: '0px' });

    },
    msgBox: function (value) {
        if (!arguments.length) {
            return this._msgBox;
        }
        this._msgBox = value;
    },
    showMessage: function (message, name, callback) {
        /// <summary>
        /// メッセージボックスを表示して指定のメッセージを表示します。
        /// <//summary>
        /// <param name="message" type="array of string">
        /// 表示するメッセージを配列で指定
        /// </param>
        /// <param name="name" type="string">
        /// メッセージボックスに表示する発言者名を指定(option)
        /// </param>
        /// <param name="callback" type="function>
        /// メッセージの表示が完了した場合のコールバックを指定(option)
        /// </param>

        if (arguments.length == 1) {
            name = "";
        } else if (typeof name == "function") {
            callback = name;
            name = "";
        }
        if (this._msgBox == null) {
            this._msgBox = new DQ.MessageBox(this, {
                name: name,
                left: '5em',
                top: DQ.T4,
                autoClose: true
            });
        }
        try {
            this._msgBox.name(name);
            this._msgBox.onVisibleChanged = null;
            this._msgBox.text(message).show();
            this._msgBox.focus();
            this._msgBox.onVisibleChanged = callback;
        }
        catch (e) {
            callback && callback();
        }

    },
    fadeOut: function (delay, callback) {
        var me = this;
        if (me.ly != null) {
            me.ly.dispose();
        }
        me.ly = new DQ.Screen.Layer(this, "dq-window dq-cover", "fader", $('<div>'));
        me.ly.hide();
        me.ly.obj.fadeIn(delay, function () {
            var dispose = callback && callback();
            (!callback || dispose) && me.ly.dispose();
        });
    },
    flashEx: function (color, zIndex, msecound, count, callback) {
        var me = this;
        var obj = $('<div>').css({ 'background-color': color, 'z-index': zIndex });
        if (me.ly != null) {
            me.ly.dispose();
        }
        me.ly = new DQ.Screen.Layer(this, "dq-window dq-cover", "fader", obj);
        me.ly.hide();
        me.ly.obj.fadeIn(msecound, function () {
            if (count - 1) {
                me.ly.dispose();
                me.flashEx(color, zIndex, msecound, count - 1, callback);
            } else {
                var dispose = callback && callback();
                (!callback || dispose) && me.ly.dispose();
            }
        });
    },
    flash: function (callback) {
        this.flashEx("White", 2999, 200, 1, callback);
    },
    fadeIn: function (delay, callback) {
        var me = this;
        if (me.ly != null) {
            me.ly.dispose();
        }
        me.ly = new DQ.Screen.Layer(this, "dq-window dq-cover", "fader", $('<div>'));
        me.ly.show();
        me.ly.obj.fadeOut(delay, function () {
            callback && callback();
            me.ly.dispose();
        });
    },
    cloud: function () {
        var me = this;
        if (me.sky != null) {
            me.sky.dispose();
        }
        me.sky = new DQ.Screen.Layer(this, "dq-window dq-cloud", "cloud", $('<div>'));
        me.sky.show();
    },
    showBackgroundImage: function (image) {
        if (world.startPage) {
            return;
        }
        world.startPage = new DQ.Screen.Layer(this, "dq-window dq-cover", "fader", $('<div>'));
        world.startPage.obj.append($('<img>')
        .attr('src', image).width(480 / DQ.SCALE));
        world.startPage.show();
    },
    showTitle: function (image, callback) {
        if (world.startPage) {
            return;
        }
        world.startPage = new DQ.Screen.Layer(this, "dq-window dq-cover", "fader", $('<div>'));
        setTimeout(function () {
            var img = $('<img>')
            .attr('src', image)
            .width(480 / DQ.SCALE)
            .appendTo(world.startPage.obj)
            .css('top', 460 / DQ.SCALE);
            world.startPage.show();
            img.animate(
                {
                    top: 32
                },
                3000,
                callback
            );
        }, 50);
    },
    hideTitle: function () {
        if (!world.startPage) {
            return;
        }
        world.startPage.hide();
        world.startPage.dispose();
        delete world.startPage;
    },
    appendLayer: function (options) {
        var me = this;
        options = DQ.options(options, {
            cls: "dq-window dq-cover",
            name: "layer"
        });

        var ly = new DQ.Screen.Layer(this, options.cls, options.name, $('<div>'));
        ly.show();

        return ly;
    },
    select: function dq$screen$select() {
        /// <summary>
        /// Zオーダーに応じて子コントロールを選択します。
        /// </summary>
        var c = null;
        for (var i = 0; i < this.controls.length; i++) {
            var v = this.controls[i];
            if (v._visible &&
                (v.canSelect == null || v.canSelect) &&
                (v._enabled == null || v._enabled) &&
                (c == null || c.zIndex <= v.zIndex)) {
                c = v;
                if (v._focused) {
                    break;
                }
            }
        }
        c && c.select();
    }
});

DQ.Screen.View = function (parent, options) {
    /// <summary>
    ///     クリップされたビューを定義します
    // </summary>
    options = DQ.options(options, {
        top: 0,
        left: 0,
        width: DQ.DEFAULT_VWIDTH,
        height: DQ.DEFAULT_VHEIGHT
    });
    this.parent = parent;
    this.top = options.top;
    this.left = options.left;
    this.width = options.width;
    this.height = options.height;
    this.resize();
}

DQ.Screen.View.prototype = {
    resize: function () {
        var c = this.parent.client;
        this.width = this.parent.obj.width();
        this.height = this.parent.obj.height();
        //        c.css({ overflow: 'hidden', clip: 'rect(' +
        //                this.top + 'px, ' +
        //                this.width + 'px, ' +
        //                this.height + 'px, ' +
        //                this.left + 'px)'
        //        });
        c.css({ overflow: 'hidden',
            width: this.width,
            height: this.height
        });

    },
    toScreenX: function (x) {
        return x - this.left;
    },
    toScreenY: function (y) {
        return y - this.top;
    }
}

DQ.Screen.Layer = dqextend(DQ.Control, function (screen, cls, id, object) {
    /// <summary>
    ///     マップ上に重ねて表示するレイヤー
    /// </summary>
    /// <param name="screen" type="DQ.Screen">
    ///     親となるDQ.Screenを指定
    /// </param>
    /// <param name="cls" type="string">
    ///     レイヤーに指定するcssClassを指定
    /// </param>
    /// <param name="id" type="string">
    ///     レイヤーに指定するidを指定
    /// </param>

    object = object || $('<div>');
    this.base(screen, object);
    this._create(cls, id);
}, {
    x: 0,
    y: 0,
    _create: function (cls, id) {
        if (!id) {
            this.obj.addClass(cls);
        } else {
            this.obj.addClass(cls).attr('id', id);
        }
    },
    shake: function (callback) {
        var me = this;
        me.obj.css('margin-left', -10);
        setTimeout(function () {
            me.obj.css('margin-left', +10);
            setTimeout(function () {
                me.obj.css('margin-left', 0);
                callback && callback();
            }, 15.625);
        }, 15.625);
    }
});

DQ.Window = dqextend(DQ.Control, function (parent, element, options) {
    /// <summary>
    ///     cssにより概観を制御可能なWindow構造のコントロールのルートとなります。
    /// </sumamry>
    /// <param name="parent" type="DQ.Control">
    ///     WindowのコンテナとなるDQ.Controlオブジェクトを指定
    /// </param>
    /// <param name="element" type="string/jQuery">
    ///     外枠をラップする対象の要素を指定
    /// </param>
    /// <param name="options" type="object">
    ///     Windowのオプションを指定
    /// </param>

    options = DQ.options(options, {
        width: '7em',
        height: 'auto',
        cls: null,
        top: 0,
        left: 0,
        text: "",
        zIndex: 10
    });

    this.zIndex = options.zIndex;

    element = typeof element == "string" ? $('#' + element) : element;
    var object = $('<div>').attr('tabIndex', 1).addClass('dq-window').css({ 'z-index': this.zIndex }).hide();
    this.base(parent, object);
    this.client = null;
    this._create(element, options);
    this.text(options.text);

    return this;
}, {
    zIndex: 10,
    _create: function _window$create(element, options) {
        /// <summary>
        ///     Windowコントロールを作成します。
        /// </sumamry>
        /// <param name="element" type="string/jQuery">
        ///     外枠をラップする対象の要素を指定
        /// </param>
        /// <param name="options" type="object">
        ///     Windowのオプションを指定
        /// </param>

        //外枠
        var win = this.obj;

        options.cls && win.addClass(options.cls);
        win.css({ 'top': options.top, 'left': options.left });

        //ヘッダ
        $('<div>')
        .addClass('dq-header')
        .append($('<div>').addClass("c"))
        .appendTo(win);

        //ボディ
        var bd = $('<div>').addClass('dq-body').appendTo(win);
        this._bdc = $('<div>').addClass("c").appendTo(bd).width(options.width).height(options.height);
        this.client = element.appendTo(this._bdc);

        //フッター
        $('<div>').addClass('dq-footer').append($('<div>').addClass("c")).appendTo(win);

        //タイトル
        this.titleObj = $('<div>')
            .addClass('dq-title')
            .append($('<span>'))
            .hide()
            .appendTo(win);

        this.visible(false);

        this.obj.width(this._bdc.width());
        return this;
    },
    shake: function (callback) {
        var me = this;
        me.obj.css('margin-left', -10);
        setTimeout(function () {
            me.obj.css('margin-left', +10);
            setTimeout(function () {
                me.obj.css('margin-left', 0);
                callback && callback();
            }, 15.625);
        }, 15.625);
    },
    text: function (text) {
        /// <summary>
        ///     Windowコントロールのタイトルを取得または設定します。
        /// </sumamry>

        if (!arguments.length) {
            return this._text;
        }

        this._text = text;
        if (text == "") {
            this.titleObj.hide();
        } else {
            this.titleObj.html('<span>' + text + '</span>').show();
        }
    },
    width: function (value) {
        __dqsuper__(this, "width", arguments);
        if (!arguments.length) {
            return this._width;
        } else {
            this._bdc.width(this._width);
        }
    },
    draggable: function (options) {
        /// <summary>
        ///     Windowコントロール移動可能を制御します。
        /// </sumamry>

        this.obj.draggable && this.obj.draggable(options);
    }
});

//
// キーパッド
// マウスによりカーソル操作を代替する
//
DQ.KeyPad = function (screen, top, left, options) {
    /// <summary>
    ///     マウスによる矢印操作用のキーパッドを定義します。
    /// </summary>
    /// <param name="screen" type="DQ.Screen">
    ///     親となるDQ.Screenを指定
    /// </param>
    /// <param name="top" type="number">
    ///     コントロールのtopを指定
    /// </param>
    /// <param name="left" type="number">
    ///     コントロールのleftを指定
    /// </param>
    /// <param name="options" type="object">
    ///     オプションを指定
    /// </param>

    if (!arguments.length) {
        throw new DQ.InvalidArgument();
    }

    options = options || {};
    this._create(screen, top, left, options);
}

DQ.KeyPad.prototype = {
    screen: null,
    layer: null,
    onHover: null,
    _create: function (screen, top, left, options) {
        var me = this;
        if (options.element) {
            top = parseInt(options.element.css('top')) || 0;
            left = parseInt(options.element.css('left')) || 0;
        }
        this.top = top || 0;
        this.left = left || 0;
        this.screen = screen;
        var layer = this.layer = new DQ.Screen.Layer(screen, 'dq-keypad', 'keypad', options.element);
        layer.obj.css({ 'top': top, 'left': left });
        layer.append(
            '<div /><div /><div />' +
            '<div /><div /><div />' +
            '<div /><div /><div />', true);

        var fm = this.layer.obj;

        var box = $('div', fm);
        box.html('<span />');
        $(box[1]).attr('id', 'up').addClass('button');
        $(box[3]).attr('id', 'left').addClass('button');
        $(box[5]).attr('id', 'right').addClass('button');
        $(box[7]).attr('id', 'down').addClass('button');
        box.hover(function () {
            this.id != "" && $(this).addClass('dq-button-hover');
            me.onHover && me.onHover(me, true);
        }, function () {
            this.id != "" && $(this).removeClass('dq-button-hover');
            me.onHover && me.onHover(me, false);
        });

        for (var nm in options) {
            if (typeof options[nm] != "string") {
                continue;
            }
            $('#' + nm, fm).html('<span>' + options[nm] + '</span>');
        }
    },
    click: function (fn) {
        if (!fn) {
            throw new Error("Invalid argument.");
        }
        var me = this;
        me.onClick = fn;
        $('#left', this.obj).bind('click', me, function (e) { fn(DQ.DIR.LEFT, e); return false; });
        $('#right', this.obj).bind('click', me, function (e) { fn(DQ.DIR.RIGHT, e); return false; });
        $('#up', this.obj).bind('click', me, function (e) { fn(DQ.DIR.UP, e); return false; });
        $('#down', this.obj).bind('click', me, function (e) { fn(DQ.DIR.DOWN, e); return false; });
    },
    mouseup: function (fn) {
        if (!fn) {
            throw new Error("Invalid argument.");
        }
        var me = this;
        $('#left', this.obj).bind('mouseup', me, function (e) { fn(DQ.DIR.LEFT, e); return false; });
        $('#right', this.obj).bind('mouseup', me, function (e) { fn(DQ.DIR.RIGHT, e); return false; });
        $('#up', this.obj).bind('mouseup', me, function (e) { fn(DQ.DIR.UP, e); return false; });
        $('#down', this.obj).bind('mouseup', me, function (e) { fn(DQ.DIR.DOWN, e); return false; });

        $('#left', this.obj).bind('touchend', me, function (e) { fn(DQ.DIR.LEFT, e); return false; });
        $('#right', this.obj).bind('touchend', me, function (e) { fn(DQ.DIR.RIGHT, e); return false; });
        $('#up', this.obj).bind('touchend', me, function (e) { fn(DQ.DIR.UP, e); return false; });
        $('#down', this.obj).bind('touchend', me, function (e) { fn(DQ.DIR.DOWN, e); return false; });
    },
    mousedown: function (fn) {
        if (!fn) {
            throw new Error("Invalid argument.");
        }
        var me = this;
        $('#left', this.obj).bind('mousedown', me, function (e) { fn(DQ.DIR.LEFT, e); return false; });
        $('#right', this.obj).bind('mousedown', me, function (e) { fn(DQ.DIR.RIGHT, e); return false; });
        $('#up', this.obj).bind('mousedown', me, function (e) { fn(DQ.DIR.UP, e); return false; });
        $('#down', this.obj).bind('mousedown', me, function (e) { fn(DQ.DIR.DOWN, e); return false; });

        $('#left', this.obj).bind('touchstart', me, function (e) { fn(DQ.DIR.LEFT, e); return false; });
        $('#right', this.obj).bind('touchstart', me, function (e) { fn(DQ.DIR.RIGHT, e); return false; });
        $('#up', this.obj).bind('touchstart', me, function (e) { fn(DQ.DIR.UP, e); return false; });
        $('#down', this.obj).bind('touchstart', me, function (e) { fn(DQ.DIR.DOWN, e); return false; });
    },
    show: function () {
        this.layer.show();
    },
    hide: function () {
        this.layer.hide();
    }
}
DQ.SoundMan = function (options) {
    options = DQ.options(options, {
        set: []
    });
    this._audio = [];
    this._src = [];
    this.addRange(options.set);
}
DQ.SoundMan.prototype = {
    _audio: [],
    _src: [],
    play: function (index) {
        if (!index || index < 0 || this._audio.length <= index) {
            throw new Error("DQ.SoundMan.play: index out of range.");
        }
        var a = this._audio[index];
        a && a.play();
    },
    _load: function (audio, src) {
        for (var i = 0; i < src.length; i++) {
            if (audio.canPlayType(src[i].type)) {
                if (audio.appendChild) {
                    document.body.appendChild(audio);
                }
                audio.src = "../sound/" + src[i].src;
                audio.load();
                return audio;
            }
        }
        return null;
    },
    add: function (set) {
        this._src.push(set);
        var a = new Audio();
        a.controls = false;
        a.preload = true;
        a.autoplay = false;
        a.loop = false;
        this._audio.push(this._load(a, set));
    },
    addRange: function (sets) {
        for (var i = 0; i < sets.length; i++) {
            this.add(sets[i]);
        }
    },
    clear: function () {
        this._src.length = 0;
        this._audio.length = 0;
    },
    remove: function (pos) {
        if (pos < 0 || this._src.length <= pos) {
            throw new Error("DQ.SoundMan.remove:: index out of range.");
        }
        this._src.splice(pos, 1);
        this._audio.splice(pos, 1);
    }
}
DQ.World = function (options) {
    /// <summary>
    ///     環境データを取得や設定を管理します。
    /// </summary>

    options = DQ.options(options, {
        maxFlag: DQ.MAX_FLAG
    });
    this.flag = [];
    this.maxFlag = options.maxFlag;
    for (var i = 0; i < options.maxFlag; i++) {
        this.flag.push(false);
    }
    //IE9 hack
    if (!jQuery.support.noCloneEvent && jQuery.support.opacity) {
        $('head').append('<meta http-equiv="X-UA-Compatible" content="IE=9" />');
    }
    this._bgSound = new Audio();
    this._bgSound.controls = false;
    this._bgSound.preload = true;
    this._bgSound.autoplay = false;
    this._bgSound.loop = true;
    //
    this._jingle = new Audio();
    this._jingle.controls = false;
    this._jingle.preload = true;
    this._jingle.autoplay = false;
    this._jingle.loop = false;
    //DQ.page().obj.append(this._bgSound);
    this.bgm = { src: "", loop: true };
}

DQ.World.prototype = {
    flag: [],
    map: null,
    chara: null,
    screen: null,
    bgm: null,
    data: [],
    _bgSound: null,
    _jingle: null,
    onGameOver: null,
    gameOver: function () {
        var me = this;
        setTimeout(function () {
            me.onGameOver && me.onGameOver();
        }, 0);
    },
    resetFlags: function () {
        this.flag = [];
        for (var i = 0; i < this.maxFlag; i++) {
            this.flag.push(false);
        }
    },
    muted: function (value) {
        if (!arguments.length) {
            return this._bgSound.muted;
        }
        this._bgSound.muted = value;
    },
    _soundBox: null,
    soundBox: function () {
        if (this._soundBox == null) {
            this._soundBox = new DQ.SoundMan();
        }
        return this._soundBox;
    },
    playSound: function (src) {
        this._bgSound.controls = world.debug;
        //Firefox4.0 時点でloopに対応していないのでloop処理を全体で合わせる
        this._bgSound.loop = false;
        var me = this;
        $(this._bgSound).one('ended', function () {
            me.bgm.loop && world.playSound(me.bgm.src);
        });
        for (var i = 0; i < src.length; i++) {
            if (this._bgSound.canPlayType(src[i].type)) {
                if (this._bgSound.appendChild) {
                    document.body.appendChild(this._bgSound);
                }
                if (this._bgSound.src.indexOf(src[i].src) == -1) {
                    this._bgSound.src = "../sound/" + src[i].src;
                    debug.writeln(DQ.format("start play sound:{0}", src[i].src));
                }
                this._bgSound.play();

                this.bgm.src = src;
                this.bgm.loop = true;
                return this._bgSound;
            }
        }
        return null;
    },
    playJingle2: function (src, mute, callback, load) {
        if (src == null || !src.length) {
            throw new Error("error: invalid argument.(src)");
        }
        for (var pos = 0; pos < this._soundBox._src.length; pos++) {
            if (this._soundBox._src[pos].name == src.name) {
                break;
            }
        }
        if (pos == this._soundBox._src.length) {
            return this.playJingle(src, mute, callback, load);
        }
        if (arguments.length == 1) {
            mute = true;
        } else if (arguments.length == 2 && typeof mute == "function") {
            callback = mute;
            mute = true;
        }
        mute && world.muted(true);
        var jingle = this._soundBox._audio[pos];
        if (load) {
            $(jingle).one('playing', function () {
                load && load(src);
            });
        }
        $(jingle).one('ended', function () {
            mute && world.muted(false);
            callback && callback(src);
        });
        this._soundBox.play(pos);

        return jingle;
    },
    playJingle: function (src, mute, callback, load) {
        if (src == null || !src.length) {
            throw new Error("error: invalid argument.(src)");
        }
        if (arguments.length == 1) {
            mute = true;
        } else if (arguments.length == 2 && typeof mute == "function") {
            callback = mute;
            mute = true;
        }
        mute && world.muted(true);
        if (load) {
            $(this._jingle).one('playing', function () {
                load && load(src);
            });
        }
        $(this._jingle).one('ended', function () {
            mute && world.muted(false);
            callback && callback(src);
        });
        this._jingle.controls = world.debug;
        for (var i = 0; i < src.length; i++) {
            if (this._jingle.canPlayType(src[i].type)) {
                if (this._jingle.appendChild) {
                    document.body.appendChild(this._jingle);
                }
                this._jingle.src = "../sound/" + src[i].src;
                this._jingle.play();
                return this._jingle;
            }
        }
        return null;
    },
    bgSound: function () {
        return this._bgSound;
    },
    localData: function (data) {
        /// <summary>
        ///     ローカル(クライアント）側で保持するデータの取得また設定します
        /// </summary>
        /// <param name="data" type="array">
        ///     登録するデータを指定。指定を省略するとデータ取得のみ実施
        /// </param>
        if (arguments.length) {
            this.data = {};
            for (var nm in data) {
                data.hasOwnProperty(nm) && this.setLocalData(nm, data[nm]);
            }
        }

        return this.data;
    },
    setLocalData: function (key, data) {
        /// <summary>
        ///     ローカル(クライアント）側で保持するデータを一項目を登録します。
        /// </summary>
        /// <param name="key" type="string">
        ///     登録するデータのキーを指定
        /// </param>
        /// <param name="data" type="object">
        ///     登録するデータを指定。
        /// </param>

        var p = "";
        if (world.project && world.project.name) {
            p = world.project.name + ".";
        }
        this.data[p + key] = data;
    },
    getLocalData: function (key) {
        /// <summary>
        ///     ローカル(クライアント）側で保持している、keyで指定されたデータを取得します。
        /// </summary>
        /// <param name="key" type="string">
        ///     取得したいデータのキーを指定
        /// </param>
        var p = "";
        if (world.project && world.project.name) {
            p = world.project.name + ".";
        }
        return this.data[p + key];
    }
}

DQ.MessageBox = dqextend(DQ.Window, function (screen, options) {
    /// <summary>
    /// メッセージを表示するためのWindowコントロールを作成します。
    /// </summary>
    /// <param name="screen" type="DQ.Screen">
    ///     コンテナとなるDQ.Screenオブジェクトを指定
    /// </param>
    /// <param name="options" type="object">
    ///     オプションを指定
    /// </param>

    options = DQ.options(options, {
        width: '18em',
        height: '4em',
        top: 0,
        left: 0,
        clickImage: DQ.CLICK_IMAGE,
        autoClose: false,
        autoScroll: false,
        waitLastClick: false,
        autoScrollSpeed: 1000,
        speed: DQ.DEFAULT_TEXT_SPEED,
        canSelect: true,
        name: "",
        enterKey: 0,
        zIndex: 1999
    });

    this.screen = screen;

    var tg = $('<div>').addClass('dq-mbox');
    this.base(screen, tg, options);
    this.__create(null, options);
    this._reg = new RegExp("\n", "g");
    this._name = "$name";
}, {
    data: [],
    dqid: "DQ.MessageBox",
    autoClose: false,
    autoScroll: true,
    waitLastClick: false,
    autoScrollSpeed: 1000,
    cancel: false,
    canSelect: true,
    enterKey: 0,
    sliding: false,
    speed: DQ.DEFAULT_TEXT_SPEED,
    onTextComplete: null,
    __create: function (element, options) {
        //__dqsuper__(this, "_create", arguments);

        this.top = (this.screen.view ? this.screen.view.top : 0) + options.top;
        this.left = (this.screen.view ? this.screen.view.left : 0) + options.left;
        this.clickImage = options.clickImage;
        this.autoClose = options.autoClose;
        this.autoScroll = options.autoScroll;
        this.autoScrollSpeed = options.autoScrollSpeed;
        this.waitLastClick = options.waitLastClick;
        if (options.speed < 0 || 5 < options.speed) {
            options.speed = DQ.DEFAULT_TEXT_SPEED;
        }
        this.speed = options.speed;
        this.canSelect = options.canSelect;
        this.enterKey = options.enterKey;
        this.data = [];

        this.obj.css({ top: this.top, left: this.left });
        this._bdc.css({ overflow: 'hidden' });
        //ページ送りを指示するイメージ
        this.nextObj = $('<img>').addClass("dq-mbox-click").attr('src', this.clickImage).appendTo(this._bdc).hide();

        this._nameObj = $('<div>').addClass('dq-msg-name');
        this._nameBox = new DQ.Window(this.parent, this._nameObj, {
            width: '5em',
            height: '1em',
            top: this.top - 36,
            left: this.left
        });
        this.name(options.name);
        this._nameBox.hide();
    },
    name: function (value) {
        if (!arguments.length) {
            return this._nameBox.text();
        }
        this._nameObj.text(value);
        if (!value) {
            this._nameBox.hide();
        } else {
            this._nameBox.show();
        }
    },
    playerName: "xx",
    color: function (cl) {
        if (!arguments.length) {
            return this.client.css('color');
        } else {
            this.client.css('color', cl);
        }
    },
    push: function (data) {
        /// <summary>
        /// this.dataにテキストを追加します。
        /// </summary>
        /// <param name="data" type="string/Array">
        /// 追加するテキストを指定
        /// </param>

        var next = this.data.length == 0; //次のメッセージがなければ、next()をキックする
        if (!this.sliding && next) {
            this.text(data);
            return;
        }

        if (typeof data == "string") {
            this.data.push(data);
        } else {
            for (var i = 0; i < data.length; i++) {
                this.data.push(data[i]);
            }
        }

    },
    clear: function () {
        this._text = "";
        this.client.text("");
    },
    _click: function (e) {
        var me = e.data;
        if (me._wait || !me.visible()) {
            return true;
        }
        e.stopImmediatePropagation();
        if (me._timerID) {
            clearTimeout(me._timerID);
            delete me._timerID;
        }

        if (e.which && e.which > 10 && e.which != 13 && e.which != 32) {
            if (this.enterKey == 0 || e.which != this.enterKey) {
                return false;
            }
        }

        if (!me.enabled()) {
            return true;
        }
        if (me.sliding) {
            me.cancel = true;
            return false;
        }
        if (me.data.length == 0) {
            me.screen.obj.unbind("click", me._click);
            me._keydown = null;
            me.clear();
            me.nextObj && me.nextObj.hide();
            me.autoClose && me.hide();
        } else {
            me.next.apply(me);
        }

        return false;
    },
    yesOrNo: 0,
    next: function () {
        /// <summary>
        /// this.dataの次のテキストをスライド表示します。
        /// </summary>

        var me = this,
        _messageBox$cmd = function (cmd) {
            if (cmd[0] == '$cmd') {
                me._text = me.data.shift();
                cmd.shift();
                eval("var cmd = " + cmd.join(':'));
                me.sliding = true; //メッセージボックスへの追加を考慮
                cmd && cmd(me);
                me.sliding = false;
                setTimeout(function () {
                    me.next();
                }, 0);
            } else if (cmd[0] == '$jingle') {
                //me._text = me.data.shift();
                if (cmd.length < 2) {
                    debug.writeln("error: DQ.MessageBox.next._messageBox$cmd: bad arguments: $jingle");
                    return;
                }
                var sound = world.sounds.find('name', cmd[1]);
                sound && world.playJingle(sound.src, function () {
                    me.next();
                });
            } else if (cmd[0] == '$clear') {
                me.clear();
            } else if (cmd[0] == '$color') {
                //me._text = me.data.shift();
                if (cmd.length < 2) {
                    debug.writeln("error: DQ.MessageBox.next._messageBox$cmd: bad arguments: $color");
                    return;
                }
                me.color(cmd[1]);
                setTimeout(function () {
                    me.screen.obj.click();
                }, 0);
            } else if (cmd[0] == '$wait') {
                if (cmd.length < 2) {
                    debug.writeln("error: DQ.MessageBox.next._messageBox$cmd: bad arguments: $wait");
                    return;
                }
                me._wait = true;
                me.nextObj && me.nextObj.hide();
                me.screen.obj.unbind("click", me._click);
                setTimeout(function () {
                    me._wait = false;
                    me.screen.obj.bind("click", me, me._click);
                    me.screen.obj.click();
                    //_showCursor(me, me._text);
                }, cmd[1] * 1000);
            } else if (cmd[0] == '$yesno') {
                if (cmd.length < 2) {
                    debug.writeln("error: DQ.MessageBox.next._messageBox$cmd: bad arguments: $yesno");
                    return;
                }
                var yesno = new DQ.YesNo(me.parent, cmd[2], cmd[3]);
                yesno.show();
                me.enabled(false);
                yesno.onClick = function (sender, pos) {
                    me.enabled(true);
                    me.yesOrNo = pos;
                    if (pos == DQ.YesNo.Yes) {
                        me._text = me.data.shift();
                    } else {
                        me._text = me.data.shift();
                        var count = parseInt(cmd[1]);
                        for (var i = 0; i < count; i++) {
                            me._text = me.data.shift();
                        }
                    }
                    me.enabled(true);
                    sender.hide();
                    sender.dispose();
                    me.select(true);
                    _slideText.apply(me, [1]);
                }
            } else if (cmd[0] == '$shift') {
                me._text = me.data.shift();
                var count = parseInt(cmd[1]);
                for (var i = 0; i < count; i++) {
                    me._text = me.data.shift();
                }
                if (typeof me._text == "undefined") {
                    me.screen.obj.unbind("click", me._click);
                    me._keydown = null;
                    me.clear();
                    me.nextObj && me.nextObj.hide();
                    me.autoClose && me.hide();
                } else {
                    _slideText.apply(me, [1]);
                }
            }
        },
        _showCursor = function (me, text) {
            me.sliding = false;
            me.cancel = false;
            me.content.html(text.replace(me._reg, '<br />')).append('<br />');
            me._bdc.scrollTop(me.client.height());

            if (me.data[0]) {
                if (me.data[0].match(/^[$].+:/)) {
                    var cmd = me.data[0].split(':');
                    if (cmd[0] == "$wait") {
                        setTimeout(function () {
                            me.screen.obj.click();
                        }, 0);
                        return;
                    }
                }
            }
            me.canSelect && me.nextObj.show().css('top', Math.max(me.client.height() - 12, me._bdc.height() - 12));
            if (!me._timerID && me.autoScroll) {
                me._timerID = setTimeout(function () {
                    delete me._timerID;
                    if (!me.waitLastClick || me.data.length) {
                        me.screen.obj.click();
                    }
                }, me.autoScrollSpeed);
            }
            me.data.length == 0 && me.onTextComplete && me.onTextComplete(me);
        },
        _slideText = function (len) {
            var text = me._text;
            if (text == undefined) {
                text = "";
                me.cancel = true;
            }
            if (me.cancel || me.speed == 0 || me._nowait) {
                _showCursor(me, text);
                return;
            }

            if (len < text.length) {
                me.sliding = true;
                me.content.html(text.substring(0, len).replace(me._reg, '<br />'));
                me._bdc.scrollTop(me.client.height());
                setTimeout(function () { _slideText(len + 1); }, (5 - me.speed) * 31.25);
            } else if (len == text.length) {
                _showCursor(me, text);
            } else {
                this.sliding = false;
            }
        }

        this._text = this.data.shift();
        if (this._text == null) {
            if (this.autoClose) {
                this.screen.obj.unbind("click", this._click);
                this._keydown = null;
                this.clear();
                this.nextObj && this.nextObj.hide();
                this.hide();
            }
            return;
        }
        this._text = this._text.replace("$name", this.playerName);
        this.content = $('<span>').appendTo(this.client);
        if (this._text.match(/^[$].+:/)) {
            _messageBox$cmd(this._text.split(':'));
        } else {
            this.nextObj && this.nextObj.hide();
            (5 - this.speed) > 0 ? _slideText(1) : _showCursor(this, this._text);
        }
    },
    text: function (data) {
        ///<summary>
        ///  メッセージボックスへ表示するテキストを設定します。
        ///</summary>
        if (data == null) {
            throw new Error("DQ.MessageBox.text:: data must specified.");
        }
        if (typeof data == "string") {
            this.data = [data];
        } else {
            this.data = data.clone();
        }
        this.clear();
        this.next();
        if (this.canSelect) {
            this.screen.obj.bind("click", this, this._click);
            this.keydown(this, this._click);
        }
        return this;
    },
    focus: function () {
        this.parent.client.append(this.obj);
        __dqsuper__(this, "focus", arguments);
    },
    show: function (enabled) {
        __dqsuper__(this, "show", arguments);
        this.parent.client.append(this.obj);
        this.select();
        enabled == true && this.enabled(true);
        this.name() != "" && this._nameBox && this._nameBox.show();
    },
    hide: function () {
        if (!this._visible) {
            return;
        }
        __dqsuper__(this, "hide", arguments);
        this._nameBox && this._nameBox.hide();

        this.parent && this.parent.select();
    },
    _nowait: false,
    nowait: function (value) {
        if (arguments.length == 0) {
            return this._nowait;
        }
        this._nowait = value;
    },
    slideDown: function () {
        this.client.slideDown();
    },
    slideUp: function () {
        this.client.slideUp();
    }
});

DQ.UpDownBase = dqextend(DQ.Control, function (parent, options, object) {
    /// <summary>
    /// スピンコントロールの基底クラスを作成します。
    /// </summary>
    ///<param name="options" type="object">
    /// オプションを指定
    ///</param>
    /// <param name="object" type="string/jQuery">
    /// スピンコントロールの外殻を指すオブジェクトを指定
    /// </param>

    //options 省略判定
    object = !object && options && (typeof options == "string" || options.jquery) && options || object;
    object = object || $('<div>').addClass('dq-updown');

    this.base(parent, object);
    options = DQ.options(options, {
        readOnly: false,
        width: this.obj.width()
    });
    this.name = options.name || (typeof object == "string") ? object : object.attr('id');

    this._create(options);
},
{
    _create: function (options) {
        this.obj.width() != options.width && this.obj.width(options.width);

        this._spin = $('<div>').appendTo(this.client).addClass('dq-updown-spin');
        this._textBox = $('<input>').appendTo(this.client).addClass('dq-updown-text');
        this._textBox.width(this.obj.width() - this._spin.width());
        this._upBtn = $('<button>').appendTo(this._spin).addClass('dq-updown-up').click(this, this.upButton);
        this._downBtn = $('<button>').appendTo(this._spin).addClass('dq-updown-down').click(this, this.downButton);

        this.readOnly(options.readOnly);
    },
    downButton: function (e) {
    },
    upButton: function (e) {
    },
    dqid: "DQ.UpDownBase",
    text: function (value) {
        if (arguments.length == 0) {
            return this._textBox.attr('value');
        }
        this._textBox.attr('value', value);
    },
    _readOnly: false,
    readOnly: function (value) {
        if (arguments.length == 0) {
            return this._readOnly;
        }
        if (this._readOnly != value) {
            this._readOnly == value;
            if (value) {
                this._textBox.attr('readonly', 'readonly');
            } else {
                this._textBox.removeAttr('readonly');
            }
        }
    }
},
{
});

DQ.StateBox = dqextend(DQ.Window, function (screen, width, height, options) {
    /// <summary>
    /// 状態やコマンドを表示するWindowを作成します。
    /// </summary>
    /// <param name="screen" type="DQ.Screen">
    ///     StateBoxのコンテナとなるscreenオブジェクトを指定
    /// </param>
    /// <param name="width" type="string">
    ///     StateBoxの幅を指定(option obsolete)
    /// </param>
    /// <param name="height" type="string">
    ///     StateBoxの高さを指定(option obsolete)
    /// </param>
    /// <param name="options" type="object">
    ///     メニューのオプションを指定
    /// </param>
    var def = {
        canSelect: false,
        canCancel: true,
        cancelNotHide: false,
        clickImage: DQ.CLICK_IMAGE,
        click: null,
        cls: "",
        column: 1,
        data: null,
        height: 'auto',
        left: 0,
        row: 9999,
        showName: false,
        top: 0,
        text: "",
        width: '10em',
        zIndex: 999
    }
    //width,heightの省略に対応したオプション設定
    if (arguments.length == 2) {
        options = DQ.options(width, def);
    } else {
        options = DQ.options(options, def);
        options.width = width;
        options.height = height;
    }
    this.screen = screen;

    this.top = (screen.view ? screen.view.top : 0) + options.top;
    this.left = (screen.view ? screen.view.left : 0) + options.left;
    options.top = this.top;
    options.left = this.left;

    this.cls = options.cls;
    this.zIndex = options.zIndex;

    var tg = $('<div>').addClass('dq-statebox');
    this.base(screen, tg, options);
}, {
    _page: 0,
    _numOfPage: 1,
    _create: function (element, options) {
        __dqsuper__(this, "_create", arguments);

        this.data = [];
        this.menuItems = [];
        this.clickImage = options.clickImage;
        this.column = options.column;
        this.row = options.row;
        this.showName = options.showName;
        this.canCancel = options.canCancel;
        this.canSelect = options.canSelect;
        this.cancelNotHide = options.cancelNotHide;
        this.onClick = options.click;
        this.text(options.text);

        options.data && this.setData(options.data, options.column);
    },
    cancelNotHide: false,
    canSelect: false,
    canCancel: true,
    click: function stateBox$click() {
        this.onClick && this.onClick(this, this._selectedIndex);
    },
    color: function (value) {
        if (!arguments.length) {
            return this.obj.css('color');
        } else {
            this.obj.css('color', value);
        }
    },
    column: 1,
    data: [],
    enabled: function (value) {
        if (!arguments.length) {
            return this._enabled;
        }
        value ? this._enable() : this._disable();
    },
    _enable: function () {
        if (this._enabled) {
            return;
        }
        __dqsuper__(this, "enabled", [true]);

        var me = this;
        me.obj.removeClass('dq-disabled');
        if (this.canSelect) {
            for (var i = 0; i < this.menuItems.length; i++) {
                this.menuItems[i]._resume();
            }
        }
    },
    _disable: function () {
        if (!this._enabled) {
            return;
        }
        __dqsuper__(this, "enabled", [false]);

        var me = this;
        me.obj.addClass('dq-disabled');
        if (this.canSelect) {
            for (var i = 0; i < this.menuItems.length; i++) {
                this.menuItems[i]._suspend();
            }
        }

        this.parent.select();
    },
    focus: function (zIndex) {
        if (arguments.length) {
            throw new Error("zIndex is specified. this is obsolute.");
        }

        //最前面に配置
        this.bringToFront();
        var p = this.parent;
        while (p) {
            (p instanceof DQ.StateBox) && p.obj.addClass('dq-unfocus');
            p = p.parent;
        }
        this.obj.removeClass('dq-unfocus');
        this._selected && this._selected.selected(true);
        __dqsuper__(this, "focus");
        this.select();
    },
    hide: function dq$stateBox$hide() {
        if (!this._visible) {
            return;
        }
        var i;
        //子コントロールを非表示
        for (i = 0; i < this.menuItems.length; i++) {
            var mn = this.menuItems[i];
            for (var j = 0; j < mn.menuItems.length; j++) {
                var cur = mn.menuItems[j];
                cur.hide && cur.hide();
            }
        }

        //子コントロールを非表示
        for (i = 0; i < this.controls.length; i++) {
            this.controls[i].hide();
        }

        //自身を非表示
        __dqsuper__(this, "hide");
        this._selectedIndex = -1;
        this._selected = null;

        //親コントロールを選択（親がコンテナならその子）
        if (this.parent) {
            this.parent.select();
            this.parent.focus();
        }
    },
    menuItems: [],
    name: "DQ.StateBox",
    push: function (value) {
        if (this.data == null) {
            return this.setData([value]);
        }
        this.data.push(value);

        var pre = this._numOfPage, table;
        //ページの更新
        this._numOfPage = Math.floor(this.data.length / (this.column * this.row + 1)) + 1;
        if (pre != this._numOfPage) {
            table = this._tables.push($('<tbody>').appendTo($('<table>').appendTo(this.client)));
            this._numOfPage == 2 && this._setupFooter();
            this.pageTD.text(this._numOfPage);
        } else {
            table = this._tables[this._tables.length - 1];
        }

        var tr;
        if ((this.data.length % this.column) == 0) {
            tr = $('<tr>').appendTo(table);
        } else {
            tr = table.children().last();
        }

        this.menuItems.push(
                        new DQ.StateBox.StateItem(this, tr, value));
    },
    onClick: null,
    onSelectChanged: null,
    onSelectedIndexChanged: null,
    onVisibleChanged: null,
    setData: function (data, col) {
        /// <summary>
        /// 選択肢を登録します。
        /// </summary>
        /// <param name="data" type="object array">
        /// 選択肢の配列を指定
        /// </param>
        /// <param name="col" type="number">
        /// 列の数を指定
        /// </param>

        var table, tr, i,
            c = this.column = col || 1;

        this.data = data;
        if (this._leftTD) {
            this._leftTD.unbind('click');
            this._rightTD.unbind('click');
        }
        this.client.text('');
        this.client.height('');

        this._tables = [];
        this._numOfPage = Math.floor(data.length / (this.column * this.row + 1)) + 1;
        for (i = 0; i < this._numOfPage; i++) {
            this._tables.push($('<tbody>').appendTo($('<table>').appendTo(this.client)));
        }

        this.menuItems = new Array();
        var cur = 0, t = 0;
        for (var j = 0; j < data.length / c; j++) {
            table = this._tables[Math.floor(j / this.row)];
            tr = $('<tr>').appendTo(table);
            for (i = 0; i < c; i++) {
                var item = data[j * c + i];
                item && this.menuItems.push(
                        new DQ.StateBox.StateItem(this, tr, item));
            }
        }

        this._setupFooter();

        if (this.canSelect) {
            this.keydown(this, this._stateBox$keydown);
            for (i = 0; i < this.menuItems.length; i++) {
                if (this.menuItems[i].enabled()) {
                    this.selected(i);
                    break;
                }
            }
        }
        this._showPage(0);
    },
    _setupFooter: function () {
        var table, tr;
        if (this._numOfPage > 1) {
            table = $('<tbody>').appendTo($('<table>').appendTo(this.client).addClass('dq-statebox-footer'));
            this.client.addClass('dq-statebox-hasfooter');
            tr = $('<tr>').appendTo(table);
            this._curTD = $('<td>').appendTo(tr);
            $('<td>').appendTo(tr).text('/');
            this._pageTD = $('<td>').appendTo(tr).text(this._numOfPage);
            this._leftTD = $('<td>')
                .addClass('dq-cursor')
                .appendTo(tr).text('<<').click(this, function (e) {
                    var me = e.data;
                    if (me._page > 0) {
                        me._showPage(me._page - 1);
                    }
                });
            this._rightTD = $('<td>')
                .addClass('dq-cursor')
                .appendTo(tr).text('>>').click(this, function (e) {
                    var me = e.data;
                    if (me._page < me._numOfPage - 1) {
                        me._showPage(me._page + 1);
                    }
                });

        }
    },
    _showPage: function (page) {
        if (page >= this._numOfPage) {
            throw new Error("DQ.Statebox._showPage:: Out of range[page].");
        }
        for (var i = 0; i < this._tables.length; i++) {
            if (i == page) {
                this._tables[i].parent().show();
            } else {
                this._tables[i].parent().hide();
            }
        }
        this._page = page;
        this._curTD && this._curTD.text(page + 1);
    },
    _stateBox$keydown: function (e) {
        var me = e.data;

        if (e.altKey || e.ctrlKey || e.shiftKey && e.which != 9) {
            return true;
        }
        e.stopImmediatePropagation();
        var pos = 0;
        function _stateBox$selectPos(e) {
            switch (e.which) {
                case 38:
                case 87:
                    pos = me._selectedIndex == -1 ? 0 : me._selectedIndex - me.column;
                    break;
                case 40:
                    pos = me._selectedIndex == -1 ? 0 : me._selectedIndex + me.column;
                    break;
                case 37:
                case 65:
                    pos = me._selectedIndex == -1 ? 0 : me._selectedIndex - 1;
                    break;
                case 39:
                case 83:
                    pos = me._selectedIndex == -1 ? 0 : me._selectedIndex + 1;
                    break;
                case 13:
                case 86:
                    me._selected && me._selected.click();
                    return false;
                case 27:
                case 67:
                    if (me.canCancel) {
                        if (me.cancelNotHide) {
                            me.enabled(false);
                            me.onVisibleChanged && me.onVisibleChanged(me, false);
                        } else {
                            me.hide();
                        }
                    }
                    return false;
                case 9:
                    if (!e.shiftKey) {
                        pos = me._selectedIndex == -1 ? 0 : me._selectedIndex + me.column;
                    } else {
                        pos = me._selectedIndex == -1 ? 0 : me._selectedIndex - me.column;
                    }
                    break;
                default:
                    return true;
            }

            if (pos == me.menuItems.length + me.column - 1) {
                pos = 0;
            }
            if (pos == -me.column) {
                pos = me.menuItems.length - 1;
            }
            if (pos >= me.menuItems.length) {
                if (e.which == 39 || e.which == 83) {
                    pos = 0;
                } else {
                    pos = pos - me.menuItems.length + 1;
                }
            }
            if (pos < 0) {
                pos = pos + me.menuItems.length - 1;
            }
            var page = Math.floor(pos / (me.column * me.row));
            if (page != me._page) {
                me._showPage(page);
            }
        }
        var pre = me._selectedIndex;
        for (var i = 0; i < me.menuItems.length; i++) { //最大アイテム回数分実行
            var res = _stateBox$selectPos(e);
            if (typeof res != "undefined") {
                return res;
            }
            if (me.menuItems[pos].text == "") {
                this._selectedIndex = pos;
                continue;
            }
            me.selected(pos);
            if (me.menuItems[pos].enabled()) {
                break;
            }
        }
        i == me.menuItems.length && me.selected(pre);
        return false;
    },
    _selectedIndex: -1,
    selectedIndex: function (value) {
        if (!arguments.length) {
            return this._selectedIndex;
        }
        this.selected(value);
    },
    _selected: null,
    selected: function (pos) {
        if (!arguments.length) {
            return this._selected;
        }
        if (pos == -1 || pos == null) {
            this._selected = null;
            this._selectedIndex != -1 && this.menuItems[this._selectedIndex].selected(false);
            this._selectedIndex = -1;
            return;
        }
        if (typeof pos == "object") {
            for (var i = 0; i < this.menuItems.length; i++) {
                if (pos == this.menuItems[i]) {
                    pos = i;
                    break;
                }
            }
        }

        //無効な値なら終了
        if (typeof pos == "object" || pos < 0 || this.menuItems.length <= pos || this.menuItems[pos].text == "") {
            throw new Error("selected: pos is invalid.");
        }

        //コールバックがないかコールバックがアクセプト
        if (this.onSelectChanged == null || this.onSelectChanged(this, pos)) {
            this._selected && this._selected.selected(false);
            this._selectedIndex = pos;
            this.menuItems[pos].selected(true);
            this._selected = this.menuItems[pos];
        }
        this.onSelectedIndexChanged && this.onSelectedIndexChanged(this, pos);
    },
    show: function (enabled) {
        __dqsuper__(this, "show", arguments);

        $('td', this.obj).removeClass('dq-selected');
        enabled && this.enabled(true);

        if (this.canSelect && this._enabled) {
            this.focus();
            this.selected(null);
            for (var i = 0; i < this.menuItems.length; i++) {
                if (this.menuItems[i].enabled()) {
                    this.selected(i);
                    break;
                }
            }
        } else {
            this._enabled && this.bringToFront();
            this._selected && this._selected.selected(false);
        }
    },
    _slideUp: false,
    slideDown: function () {
        var me = this;
        this.titleObj.removeClass('slide-up');
        this.client.slideDown('normal', function () {
            me._slideUp = false;
        });
    },
    slideUp: function () {
        if (!this._slideUp) {
            this._slideUp = true;
            this.titleObj.addClass('slide-up');
            this.client.height(this.client.height());
            this.client.slideUp();
        } else {
            var a = 0;
        }
    },
    text: function (value) {
        __dqsuper__(this, "text", arguments);
        if (value == "") {
            this.client.addClass('dq-statebox-notitle');
        } else {
            this.client.removeClass('dq-statebox-notitle');
        }
    }
});


DQ.StateBox.StateItem = function (parent, tr, data) {
    /// <summary> 
    ///     StateBoxの個別情報を保持します
    /// </summary>
    /// <param name="parent" type="DQ.StateBox">
    ///     親コンテナとなるDQ.StateBoxを指定
    /// </param>
    /// <param name="tr" type="element">
    ///     追加先
    /// </param>
    /// <param name="data" type="object">
    ///     StateItemの設定値を指定
    /// </param>

    var options = DQ.options(data, {
        callback: null,
        displayName: "",
        enabled: true,
        subItem: null,
        text: "",
        value: null
    });
    this._create(parent, tr, data);
}

DQ.StateBox.StateItem.prototype = {
    cancelHide: false,
    _selected: false,
    _enabled: true,
    _create: function (parent, tr, data) {
        /// <summary> 
        ///     StateBoxの個別情報を保持します
        /// </summary>
        /// <param name="tr" type="element">
        ///     追加先
        /// </param>
        /// <param name="parent" type="DQ.StateBox">
        ///     親コンテナとなるDQ.StateBoxを指定
        /// </param>
        /// <param name="data" type="object">
        ///     StateItemの設定値を指定
        /// </param>

        this.parent = parent || null;
        this.menuItems = new Array(); //下位メニュー
        this.name = data.displayName;
        this.text = data.text;
        this.value = data.value;
        this._callback = data.callback;

        var me = this, td, dv;
        if (parent.showName) {
            var th = $('<th>')
                .append($('<span>&nbsp;</span>').addClass('dq-s-s'))
                .append($('<div>').text(this.name))
                .appendTo(tr);
            td = this.obj = $('<td>').appendTo(tr);
            dv = $('<div>').html(this.text).appendTo(td); //textにはタグを許可
        } else {
            td = this.obj = $('<td>').appendTo(tr);
            $('<span>&nbsp;</span>')
                .addClass('dq-s-s')
                .appendTo(td);
            dv = $('<div>').html(this.text).appendTo(td);
        }
        this.enabled(data.enabled);

        if (data.subItem) {
            var subItem;
            if (data.subItem instanceof DQ.StateBox) {
                subItem = data.subItem;
            } else {
                var options = data.subItem.options;
                options.width = data.subItem.width;
                options.height = data.subItem.height;
                options.data = data.subItem.data;
                subItem = new DQ.StateBox(this.parent.parent, data.subItem.options);
                var title = data.subItem.options.title || "";
                subItem.text(title);
            }
            this.addSubItems(subItem);
        }
    },
    _resume: function () {
        var me = this;
        if (this.parent.canSelect && this._enabled) {
            this.obj.hover(function () {
                me.parent.isActiveControl() && me.selectMe();
            }, function () {
                //me.parent.isActiveControl() && $(this).removeClass('dq-selected');
            })
            .bind("click", this, function dq$stateBox$_click(e) {
                e.data.parent.isActiveControl() && e.data.click();
                return false;
            });

            this._selected && this.selected(true);
        }
    },
    _suspend: function () {
        if (this.parent.canSelect) {
            this.obj.removeClass('dq-selected');
            this.obj.unbind('click mouseenter mouseleave')
        }
    },
    enabled: function (value) {
        if (!arguments.length) {
            return this._enabled;
        } else {
            this._enabled = value;
            if (value) {
                this.obj.removeClass('dq-disabled');
            } else {
                this.obj.addClass('dq-disabled');
            }
            if (this.parent.canSelect) {
                var me = this;
                if (value) {
                    this.obj.hover(function () {
                        me.parent.isActiveControl() && me.selectMe();
                    }, function () {
                        //me.parent.isActiveControl() && $(this).removeClass('dq-selected');
                    })
                    .bind("click", this, function dq$stateBox$_click(e) {
                        e.data.parent.isActiveControl() && e.data.click();
                        return false;
                    });
                } else {
                    this.selected(false);
                    this.obj.unbind('click mouseenter mouseleave')
                }
            }
        }
    },
    addSubItems: function (subItem) {
        subItem.parent = this.parent;
        this.menuItems.push(subItem);
    },
    setSubItem: function (subItem) {
        this.menuItems.length = 0;
        this.addSubItems(subItem);
    },
    setSubItemRange: function (subItems) {
        this.menuItems.length = 0;
        for (var i = 0; i < subItems.length; i++) {
            this.addSubItems(subItems[i]);
        }
    },
    selectMe: function () {
        this.parent.selected(this);
    },
    selected: function (value) {
        if (!arguments.length) {
            return this._selected;
        } else {
            this._selected = value;

            if (value) {
                this.obj.addClass('dq-selected');
            } else {
                this.obj.removeClass('dq-selected');
            }
        }
    },
    click: function dq$stateItem$click(fn) {
        if (!arguments.length) {
            if (this._callback) {
                this._callback(this);
            } else if (this.menuItems.length && this.menuItems[0].canSelect) {
                this.menuItems[0].show(true);
                this.menuItems[0].focus();
            } else if (this.parent.canSelect) {
                this.parent.click();
            }
        } else {
            this._callback = fn;
        }
    },
    dispose: function () {
        this.obj.unbind("click mouseenter mouseleave");
    }
}

DQ.YesNo = function (parent, top, left, options) {
    top = top || 48;
    left = left || 298;
    options = options || {};

    var yesno = this._yesno = new DQ.StateBox(parent, {
        width: '6em',
        height: 'auto',
        top: top,
        left: left,
        canSelect: true,
        canCancel: false,
        data: [{ text: _('Yes') }, { text: _('No')}]
    });
    //yesno.show(true);
    var me = this;
    yesno.onClick = function (sender, pos) {
        yesno.hide();
        me.onClick && me.onClick(sender, pos);
    }
    yesno.onLeave = function (sender) {
        me.onLeave && me.onLeave(sender);
    }
    this.text = function (text) {
        yesno.text(text);
    }
    this.show = function () {
        yesno.show(true);
    }
    this.hide = function () {
        yesno.hide();
    }
    this.dispose = function () {
        yesno.dispose();
    }
}
DQ.YesNo.Yes = 0;
DQ.YesNo.No = 1;

DQ.StateGroup = function (parent, options) {
    /// <summary>
    /// 複数のDQ.StateBoxを一体的に扱うためのコンポーネントです。
    /// </summary>
    /// <param name="parent" type="DQ.Control">
    ///     StateBoxのコンテナとなるDQ.Controlオブジェクトを指定
    /// </param>
    var me = this,
        i;
    this.parent = parent;
    this._boxs = [];
    for (i = 0; i < options.length; i++) {
        var box = options[i];
        switch (box.type) {
            case "YesNo":
                this._boxs.push(this[box.name] = new DQ.YesNo(parent, box.options.top, box.options.left));
                this[box.name]._yesno.name = box.name;
                break;
            default:
                this._boxs.push(this[box.name] = new DQ.StateBox(parent, box.options));
                break;
        }
    }
    var _click = function (sender) {
        me.onClick && me.onClick(me, sender);
    },
    _visibleChanged = function (sender, state) {
        me.onVisibleChanged && me.onVisibleChanged(me, sender, state);
    },
    _selectedIndexChanged = function (sender, pos) {
        me.onSelectedIndexChanged && me.onSelectedIndexChanged(me, sender, pos);
    },
    _leave = function (sender) {
        me.onLeave && me.onLeave(me, sender);
    }
    for (i = 0; i < this._boxs.length; i++) {
        this._boxs[i].name = options[i].name;
        this._boxs[i].onClick = _click;
        this._boxs[i].onLeave = _leave;
        this._boxs[i].onVisibleChanged = _visibleChanged;
        this._boxs[i].onSelectedIndexChanged = _selectedIndexChanged;
    }
}
DQ.StateGroup.prototype = {
    focus: function (name) {
        if (!arguments.length || !this[name]) {
            throw "focusするStateBox名を指定してください。";
        }
        for (var i = 0; i < this._boxs.length; i++) {
            this._boxs[i].obj && this._boxs[i].canSelect && this._boxs[i].obj.addClass('dq-unfocus');
        }
        this[name].focus();
    },
    unfocus: function (name) {
        if (!arguments.length || !this[name]) {
            throw "unfocusするStateBox名を指定してください。";
        }
        for (var i = 0; i < this._boxs.length; i++) {
            this._boxs[i].obj && this._boxs[i].canSelect && this._boxs[i].obj.addClass('dq-unfocus');
        }
        this[name]._unfocus();
    },
    show: function () {
        for (var i = 0; i < this._boxs.length; i++) {
            this._boxs[i].show();
        }
    },
    hide: function () {
        for (var i = 0; i < this._boxs.length; i++) {
            this._boxs[i].hide();
        }
        this.parent.select();
    },
    onClick: null,
    onVisibleChanged: null,
    onSelectedIndexChanged: null,
    onLeave: null
}

DQ.Image = dqextend(DQ.Control, function (parent, options, object) {
    options = DQ.options(options, {
        aspect: true,
        preview: null,
        cls: "dq-image",
        alt: "",
        src: "",
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        imgWidth: 0,
        imgHeight: 0,
        onLoaded: null,
        onError: null
    });

    object = object || $('<div>');
    this.base(parent, object);
    this.obj.addClass(options.cls);

    this._create(options);
},
{
    _create: function (options) {
        options.width && this.obj.width(options.width);
        options.height && this.obj.height(options.height);

        this.aspect = options.aspect;

        if (this.obj[0].nodeName == "IMG") {
            var tmp = $('<div>').addClass("dq-image").insertBefore(this.obj);
            this.obj.appendTo(tmp);
            this.client = this.obj;
            this.obj = tmp;
        } else {
            var style = this.obj[0].currentStyle || document.defaultView.getComputedStyle(this.obj[0], '');
            var img = $('img', this.obj);
            this.client = (img.length ? img : $('<img>').appendTo(this.obj))
                .width(style.width).height(style.height);
            if (options.imgHeight) {
                this.client.height(options.imgHeght);
            }
            if (options.imgWidth) {
                this.client.width(options.imgWidth);
            }
        }
        if (options.preview) {
            this.client.hide();
            this._preview = $('<img>').attr('src', options.preview).appendTo(this.obj).hide();
        }
        options.src && this.src(options.src);
        this.client.attr('alt', options.alt);
        this.onLoaded = options.onLoaded;
        this.onError = options.onError;

        this.client.bind('load', this, function (e) {
            var me = e.data;
            me._preview && me._preview.hide().remove();
            me.client.show();

            var tmp = new Image();
            tmp.src = me.src();
            if (me.aspect) {
                var style = me.obj[0].currentStyle || document.defaultView.getComputedStyle(me.obj[0], '');
                if (tmp.width <= tmp.height) {
                    if (style.height == 'auto' || tmp.hegiht <= parseInt(style.height)) {
                        me.client.width(tmp.width);
                        me.client.height(tmp.height);
                    } else {
                        var dh = parseInt(style.height) / tmp.height;
                        me.client.width(tmp.width * dh);
                        me.client.height(tmp.height * dh);
                    }
                } else {
                    if (style.width == 'auto' || tmp.width <= parseInt(style.width)) {
                        me.client.width(tmp.width);
                        me.client.height(tmp.height);
                    } else {
                        var dx = parseInt(style.width) / tmp.width;
                        me.client.width(tmp.width * dx);
                        me.client.height(tmp.height * dx);
                    }
                }
            }
            me.onLoaded && me.onLoaded(me.client);
        });
        this.client.bind('error', this, function (e) {
            var me = e.data;
            me._preview && me._preview.hide();
            me.client.show();
            me.onError && me.onError.apply(me, arguments);
        });
        this.obj.bind('click', this, function (e) {
            e.data.onClick && e.data.onClick(e.data, e);
        });

        this.onClick = options.onClick;
    },
    alt: function (value) {
        if (!arguments.length) {
            return this.client.attr('alt');
        }
        this.client.attr('alt', value);
    },
    animate: function (options) {
        this.show();
        options = DQ.options(options, {
            speed: 15.625 * 3,
            count: 4,
            height: 32
        });
        var i = 0, me = this;
        me.client.css('margin-left', 0);
        setTimeout(function () {
            i++;
            me.client.css('margin-left', -options.height * i);
            if (i == options.count) {
                me.hide();
                return;
            }
            setTimeout(arguments.callee, options.speed);
        }, options.speed);
    },
    aspect: true,
    fromFile: function (uri) {
        /// <summary>
        /// 指定のイメージを読み込みます。
        /// </summary>
        if (this._preview) {
            this._preview.show();
            this.client.hide();
        }

        this.client.attr('src', uri + "?" + new Date().getTime());
    },
    src: function (value) {
        if (!arguments.length) {
            return this.client.attr('src');
        }
        this.fromFile(value);
    },
    preview: "",
    onClick: null,
    onError: null,
    onLoaded: null
});

$(function () {
    if (window.Audio == null) {
        Audio = function () {
            if (!document.getElementById('Player')) {
                $('<object id="Player" classId="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6" height="45">')
                .appendTo(document.body);
                var e = document.getElementById('Player');
                e.standBy = "loading...";
            }
        };
        Audio.prototype = {
            autoplay: false,
            preload: false,
            src: "",
            loop: true,
            controls: true,
            canPlayType: function (mime) {
                var canType = new Array("audio/wav", "audio/mid", "audio/mpeg");
                for (var i = 0; i < canType.length; i++) {
                    if (mime == canType[i]) {
                        return true;
                    }
                }
                return false;
            },
            play: function () {
                var e = document.getElementById('Player');
                e.URL = this.src;
                e.autoStart = false;
                e.loop = this.loop;
                if (this.controls) {
                    e.height = "45";
                    e.uiMode = "mini";
                } else {
                    e.height = "1";
                    e.uiMode = "invisible";
                }
                e.controls.play();
            },
            stop: function () {
                var e = document.getElementById('Player');
                e.controls.stop();
            },
            pause: function () {
                var e = document.getElementById('Player');
                e.controls.pause();
            },
            resume: function () {
                var e = document.getElementById('Player');
                e.controls.play();
            }
        }
    } else {
        Audio.prototype.resume = function () {
            this.play();
        }
        Audio.prototype.stop = function () {
            this.src = this.src;
            this.pause();
        }
    }
});

DQ.queryString = [];
if (location.search.length > 1) {
    var qs = location.search.substr(1).split("&");
    for (var i = 0; i < qs.length; i++) {
        var t = qs[i].split("=");
        DQ.queryString[t[0]] = t[1];
    }
}

if (DQ.queryString["debug"] == "true") {
    debug = new DQ.Debug(DQ.page());
} else {
    //ダミー
    debug = new function () { };
    debug.write = function () { };
    debug.writeln = function () { };
}
