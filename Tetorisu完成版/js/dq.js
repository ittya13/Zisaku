/// <reference path="jquery.js" />


function dqextend(s, c, m, p) {
    ///	<summary>
    ///	    関数を拡張(擬似継承)します。
    ///	</summary>
    ///	<returns type="function" />
    ///	<param name="s" type="object">
    ///		継承元のクラスを指定
    ///	</param>
    ///	<param name="c" type="function">
    ///		コンストラクタを指定
    ///	</param>
    ///	<param name="m" type="object">
    ///		メンバーを指定
    ///	</param>
    ///	<param name="p" type="object">
    ///		getter,setterを使用するプロパティを指定
    ///	</param>
    function f() { };
    if (s == Array) {
        var a = new s;
        f.prototype = s.prototype;
        f.prototype.constrctor = s;
        f.prototype.concat = a.concat;
        f.prototype.join = a.join;
        f.prototype.length = a.length;
        f.prototype.pop = a.pop;
        f.prototype.push = a.push;
        f.prototype.reverse = a.reverse;
        f.prototype.shift = a.shift;
        f.prototype.slice = a.slice;
        f.prototype.sort = a.sort;
        f.prototype.splice = a.splice;
        f.prototype.unshift = a.unshift;
    } else {
        f.prototype = s.prototype;
    }
    c.prototype = new f();
    if (s == Array) {
        c.prototype.__super = new f();
    } else {
        c.prototype.__super = s.prototype;
    }
    c.prototype.constructor = c;

    //スーパークラスのconstructer呼び出し
    c.prototype.base = function () {
        var os = this.base;
        this.base = s.prototype.base || null;

        s.apply(this, arguments);

        if (this.constructor == c) {
            delete this.base;  //constructor呼び出しは一度きり
        } else {
            this.base = os;
        }
    }
    //属性を拡張
    var n;
    for (n in m) {
        c.prototype[n] = m[n];
    }

    //プロパティーを拡張
    for (n in p) {
        var tr = p[n];
        c.prototype[n] = __dqproperty__(c, n, tr.get, tr.set, tr.def);
    }
    return c;
};

function __dqsuper__(me, f, a) {
    /// <summary>
    /// オーバーライドされている関数からスーパークラスの関数を呼び出します。
    /// </summary>
    /// <param name="me" type="object">
    /// スーパークラスを呼び出すthisポインタを指定
    /// </param>
    /// <param name="f" type="string">
    /// 関数もしくは関数名を指定(this.__super.foo または "foo")
    /// </param>
    /// <param name="a" type="array">
    /// 関数に渡す引数を指定
    /// </param>
    a = a || [];
    var b = me.__super;
    var r, s;
    if (b && b[f] == me[f]) {
        for (s = me.__super.__super; s && s[f] == me[f]; s = s.__super) {
            ;
        }
    } else {
        s = b;
    }
    if (s == null) {
        throw new Error("__dqsuper__: 循環呼び出しか、継承されていないオブジェクトから呼び出されました。");
    }
    me.__super = s.__super;
    r = (typeof f == "string") ? s[f].apply(me, a) : f.apply(me, a);
    me.__super = b;

    return r;
}

function __dqproperty__(object, name, get, set, def) {
    /// <summary>
    /// オブジェクトにプロパティを追加します。
    /// </summary>
    /// <param name="name" type="string">
    /// プロパティ名称を指定
    /// </param>
    /// <param name="get" type="function">
    /// getterを指定
    /// </param>
    /// <param name="set" type="function">
    /// setterを指定
    /// </param>

    var _nm = "_" + name;
    var __nm = "__" + name;
    object.prototype[_nm] = def || false;
    object.prototype[__nm] = { 'get': get, 'set': set };
    return function (value) {
        if (!arguments.length) {
            return this[__nm].get.apply(this);
        } else {
            this[__nm].set.apply(this, arguments);
        }
    };
}

DQ = {
    version: "0.6.0",
    chain: [],
    cookie: function (key, value) {
        /// <summary>
        ///     指定のクッキーを保存または取得します。
        /// </summary>
        ///	<param name="key" type="string">
        ///		登録するキー名を指定
        ///	</param>
        ///	<param name="key" type="string">
        ///		登録するキー名を指定
        ///	</param>
        /// <return type="string">
        if (arguments.length > 1) {
            key += "=" + encodeURIComponent(value) + "; ";
            key += "expires=Tue, 31-Dec-2030 23:59:59; ";
            document.cookie = key;
            return value;
        } else {
            var result = null;
            if (document.cookie && document.cookie != '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = $.trim(cookies[i]);
                    if (cookie.substring(0, key.length + 1) == (key + '=')) {
                        result = decodeURIComponent(cookie.substring(key.length + 1));
                        break;
                    }
                }
            }
            return result;
        }
    },
    format: function (fmt) {
        if (!arguments.length) {
            throw new Error("DQ::format: arguments is too less.");
        }
        if (arguments.length == 1) {
            return fmt; //無変換
        }
        var res = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            var reg = new RegExp("\\{" + (i - 1) + "\\}", "g")
            if (arguments[i] == null) {
                res = res.replace(reg, "null");
            }
            else {
                try {
                    res = res.replace(reg, arguments[i].toString());
                } catch (e) {
                    res = res.replace(reg, "[object]");
                }
            }
        }
        return res;
    },
    fps: function (value) {
        /// <summary>
        /// 目標となるイベントタイマーの分解能を取得または設定します。
        /// 新しい値を設定するとそれに応じたインターバルタイマーを生成します。
        /// </summary>
        /// <param name="value" type="number">
        /// 目標となるFPSを指定。最小値は15、最大値は64
        /// </param>
        if (!arguments.length) {
            return DQ._fps;
        } else {
            value = (value > 64) ? 64 : (value < 1) ? 1 : value;
            DQ._fps = value;
            var d = Math.floor(1000 / value / 15.625) * 15.625;
            DQ._lazy = Math.floor(d);
            if (DQ._timerID) {
                DQ.stop();
                DQ.start();
            }
        }
    },
    gettext: function (uid, text) {
        /// <summary>
        /// ロケールに従ったテキストを取得します
        /// </summary>
        /// <param name="uid">
        /// メッセージIDもしくはメッセージ自信を指定
        /// </param>
        /// <param name="text" type="string">
        /// デフォルトテキストを指定
        /// </param>

        if (text) {
            return DQ._message[DQ._locale] && DQ._message[DQ._locale][uid] || text;
        } else {
            return DQ._message[DQ._locale] && DQ._message[DQ._locale][uid] || uid;
        }
    },
    storage: function (key, value) {
        /// <summary>
        ///     指定の値をローカルストレージへ保存または取得します。
        /// </summary>
        ///	<param name="key" type="string">
        ///		登録するキー名を指定
        ///	</param>
        ///	<param name="key" type="string">
        ///		登録するキー名を指定
        ///	</param>
        /// <return type="string">
        if (arguments.length > 1) {
            localStorage.setItem(key, value);
            return value;
        } else {
            return localStorage.getItem(key);
        }
    },
    load: function (world) {
        /// <summary>
        ///     ローカル(クライアント）側で保持するデータを読み出します。
        /// </summary>
        /// <param name="world" type="DQ.World">
        ///     保存するデータを設定すためのworldオブジェクトを指定
        ///     取得するキー情報はあらかじめworldに登録している必要がある
        /// </param>
        var keys = world.localData();
        if (!keys) {
            return;
        }

        world.data = {};
        for (var key in keys) {
            var value = DQ.storage(key) || DQ.cookie(key);
            if (world.project && world.project.name) {
                key = key.substring(world.project.name.length + 1);
            }
            world.data[key] = value;
        }
        //world.localData(data);
    },
    loadCatalog: function (url, success, error) {
        /// <summary>
        ///     指定のURLから非同期にデータを受信します。
        /// </summary>
        /// <param name="url" type="string">
        ///     非同期受信するためのURLを指定
        /// </param>
        /// <param name="fn" type="function">
        ///     受信が完了した際のコールバック関数を指定
        /// </param>

        DQ.__xhr__ = $.ajax(
        {
            cache: false,
            type: "GET",
            url: url,
            success: success,
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                alert(DQ.format("{0}\n{1}: {2} {3}", url, XMLHttpRequest.status, XMLHttpRequest.statusText, textStatus));
                error && error(XMLHttpRequest);
            }
        });
    },
    abort: function () {
        try {
            $(DQ.__xhr__).abort();
        } catch (e) {
            console.log && console.log(e);
        }
    },
    save: function (world) {
        /// <summary>
        ///     ローカル(クライアント）側で保持するデータを保存します(現在はCookie)。
        /// </summary>
        /// <param name="world" type="DQ.World">
        ///     保存するデータを取り出すためのworldオブジェクトを指定
        /// </param>
        var saveData = world.localData();
        if (saveData) {
            for (var key in saveData) {
                DQ.storage(key, saveData[key]);
            }
        }
    },
    start: function () {
        /// <summary>
        /// イベントタイマーを開始します
        /// </summary>

        function dq$_work() {
            for (var i = 0; i < DQ.chain.length; i++) {
                var me = DQ.chain[i];
                me.update.apply(me);
            }
        }
        if (!DQ._timerID) {
            DQ._timerID = setInterval(dq$_work, DQ._lazy);
        }
    },
    stop: function () {
        /// <summary>
        /// イベントタイマーを停止します
        /// </summary>
        if (DQ._timerID) {
            clearInterval(DQ._timerID);
            delete DQ._timerID;
        }
    },
    _urls: [],
    include: function (file) {
        /// <summary>
        /// 指定のスクリプトを読み込みます(非同期)。
        /// </summary>
        /// <param name="file" type="string">
        /// 読み込むスクリプトのパスを指定
        /// </param>
        var s = document.createElement('script');
        s.src = file;
        s.type = 'text/javascript';
        s.defer = 'defer';
        document.getElementsByTagName('head').item(0).appendChild(s);
    },
    lazyLoad: function (url, ctl, fn) {
        /// <summary>
        /// scriptを遅延ロードし、完了後に指定のコールバックを実行します。
        /// </summary>
        function _check(ctl) {
            try {
                return !!(eval(ctl));
            } catch (e) {
                return false;
            }
        }
        if (_check(ctl)) {
            fn && fn();
            _remove$lazyLoad();
        } else {
            if (DQ._urls[url]) { //リクエスト済みならfnのみ登録して終了。
                DQ._urls[url].push(fn);
                return;
            }
            DQ._urls[url] = [];
            DQ.include(url);
            DQ._urls[url].push(fn);
            var msg = $('<tr><td>' + url + '</td><td /></tr>').appendTo(DQ.__dqloading__.table),
                t_count = 0;
            DQ.__dqmoth__++;
            $('#dqchi').text(DQ.__dqchi__ + "/" + DQ.__dqmoth__);

            setTimeout(function () {
                if (!_check(ctl)) {
                    t_count++;
                    var hasFailed = false;
                    if (t_count > 800) {
                        DQ.__dqloading__.table.children()
                        .each(function () {
                            var res = $(this).children().last();
                            if (!res.text()) {
                                res.html('<span style="color: Red">failed.</span>');
                                hasFailed = true;
                            }
                        });
                        hasFailed && alert("スクリプトの読み込みに時間がかかりすぎています。\n" +
                            "Javascriptのエラーのかもしれません。\n" +
                            "ページをリロードしても改善しない場合はしばらく諦めてください。");

                        return;
                    }
                    setTimeout(arguments.callee, 15.625);
                } else {
                    msg.children().last().text("done.");
                    DQ.__dqchi__++;
                    $('#dqchi').text(DQ.__dqchi__ + "/" + DQ.__dqmoth__);
                    $('#dqcur').text(msg.children().first().text());
                    for (var i = 0; i < DQ._urls[url].length; i++) {
                        DQ._urls[url][i] && DQ._urls[url][i].call();
                    }
                    delete DQ._urls[url];
                    _remove$lazyLoad();
                }

            }, 15.625);
        }

        function _remove$lazyLoad() {
            ///<summary>
            ///読み込み中ダイアログの削除可否の判定と削除の実施
            ///</summary>
            var cnt = 0;
            for (var nm in DQ._urls) {
                cnt += DQ._urls.hasOwnProperty(nm) ? 1 : 0;
            }
            if (cnt == 0) {
                setTimeout(function () {
                    DQ.__dqloading__.dispose();
                    //DQ.__loadingid__ && clearTimeout(DQ.__loadingid__);
                }, 128);
                DQ.__trigger && setTimeout(DQ.__trigger, 1);
            }
        }
    },
    link: function (url) {
        /// <summary>
        /// 指定のCSSを読み込みます(非同期)。
        /// </summary>
        /// <param name="URL" type="string">
        /// 読み込むCSSのパスを指定
        /// </param>
        var css = document.createElement('link');
        css.type = "text/css";
        css.rel = "stylesheet";
        css.href = url;
        document.getElementsByTagName('head').item(0).appendChild(css);
    },
    options: function (org, def) {
        /// <summary>
        /// オプションにデフォルト値を設定します。
        /// </summary>
        /// <param name="org" type="object">
        /// 設定対象のオプションオブジェクト
        /// </param>
        /// <param name="def" type="object">
        /// デフォルト値を指定
        /// </param>

        org = org || {};
        for (var nm in def) {
            if (def.hasOwnProperty(nm)) {
                org[nm] = org[nm] === undefined ? def[nm] : org[nm];
            }
        }

        return org;
    }
}

DQ._ctrl_ = [];

DQ.Point = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
}
DQ.Point.prototype = {
    add: function (p) {
        this.x += p.x;
        this.y += p.y;
    },
    subtract: function (p) {
        this.x -= p.x;
        this.y -= p.y;
    },
    toString: function () {
        return this.x + "," + this.y;
    }
}

DQ.Size = function (width, height) {
    this.width = width || 0;
    this.height = height || 0;
}

DQ.Rectangle = function (x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
}

DQ.Control = function dq$control(parent, object) {
    /// <summary>
    ///     ビジュアルな表示コンポーネントであるコントロールを定義します。
    /// </summary>
    /// <param name="parent" type="DQ.Control">
    ///   親コントロールを指定
    /// </param>
    /// <param name="text" type="string/jQeury">
    ///   コントロールの表示要素をjQueryでラップして指定
    /// </param>
    if (arguments.length > 2) {
        throw new Error("DQ.Control.constractor: arguments too match. this may be obsolute style.");
    }
    var add = true; //要素を末尾に追加するかどうか
    this.controls = new Array();

    if (typeof object == "string") {
        add = false;
        this.name = object;
        object = $('#' + object);
    }
    if (!object.length) {
        throw new Error("DQ.Control.constractor: the element not found(" + this.name + ").");
    }
    parent = parent && !(parent instanceof DQ.Control) && new DQ.Control(null, parent) || parent;
    this.parent = parent;
    this.client = this.obj = object || $('<div>');
    if (object != null) {
        this._width = object.width();
        this._height = object.height();
        this._size = new DQ.Size(this._width, this._height);
        this._location = new DQ.Point(parseInt(this.obj.css('left')), parseInt(this.obj.css('top')));
    }
    parent && parent.append(this, add);
}

DQ.Control.prototype = {
    _enabled: true,
    _height: 0,
    name: "",
    client: null,
    obj: null,
    parent: null,
    tag: null,
    _tabIndex: 0,
    _tabStop: true,
    _text: "",
    _visible: true,
    _width: 0,
    _addControls: function (control, index) {
        /// <summary>
        ///  子コントロールが Control オブジェクトの controls コレクションに追加された後に呼び出されます。 
        /// </summary>
    },
    append: function (element, add) {
        /// <summary>
        ///  子要素をクライアント領域へ追加します。
        /// </summary>
        /// <param name="element" type="object">
        /// 追加するDOM要素かjQueryオブジェクトを指定
        /// </param>
        /// <param name="add" type="boolean">
        /// DOM要素を追加する場合はtrueを指定
        /// </param>
        if (element instanceof DQ.Control) {
            add && this.client.append(element.obj);
            element.parent = this;
            this.controls.push(element);
        } else {
            add && this.client.append(element);
        }
        this._addControls(this, this.controls.length - 1);
    },
    bringToFront: function (zIndex) {
        if (arguments.length == 0) {
            this.obj.appendTo(this.obj.parent());
            return;
        }
        this.zIndex = zIndex;
        this.obj.css('z-index', zIndex);
        this.parent && this.parent.bringToFront(zIndex - 1);
    },
    canSelect: true,
    click: function (fn) {
        if (arguments.length == 0) {
            throw new Error("DQ.Control.clic: fn was not specified.");
        }

        this.obj.unbind("click");
        this.obj.bind("click", this, fn);
    },
    controls: [],
    dqid: "DQ.Control",
    css: function (key, value) {
        if (value) {
            this.obj.css(key, value);
        } else {
            return this.obj.css(key);
        }
    },
    _disposed: false,
    dispose: function dq$control$dispose() {
        this.parent && this.parent.remove(this);
        var c = this.controls;
        for (var i = 0; i < c.length; i++) {
            c[i].dispose && c[i].dispose();
        }
        c.length = 0;
        this.obj && this.obj.remove();
        this.obj = null;
        this._disposed = true;
    },
    enabled: function (value) {
        if (!arguments.length) {
            return this._enabled;
        }
        this._enabled = value;
        if (value) {
            this.obj.removeClass('dq-disabled');
        } else {
            this.obj.addClass('dq-disabled');
        }
    },
    findForm: function () {
        var p = this.parent;
        while (p) {
            if (p instanceof DQ.UI.Form) {
                break;
            }
            p = p.parent;
        }
        return p;
    },
    _focused: false,
    focused: function () {
        return this._focused;
    },
    _unfocus: function () {
        this._focused = false;
        for (var i = 0; i < this.controls.length; i++) {
            this.controls[i]._unfocus();
        }
    },
    focus: function () {
        DQ.page()._unfocus();
        if (this.client) {
            this.client.focus();
        } else {
            this.obj.focus();
        }
        this._focused = true;
    },
    hasControls: function () {
        return this.controls.length > 0;
    },
    height: function (value) {
        if (!arguments.length) {
            return this._height == 0 ? this.obj.height() : this._height;
        } else {
            this.obj.height(value);
            if (value == 'auto') {
                var h;
                if (document.defaultView && document.defaultView.getComputedStyle) {
                    h = parseInt(document.defaultView.getComputedStyle(this.obj[0], '').height);
                } else {
                    h = this.obj[0].style.pixelHeight;
                }
                this._size.height = this._height = h;
            } else {
                this._size.height = this._height = this.obj.height();
            }
        }
    },
    isActiveControl: function () {
        var p = this.parent;
        while (p) {
            if (p._activeControll) {
                return p._activeControl == this;
            }
            p = p.parent;
        }
        return DQ.page()._activeControl == this;
    },
    hide: function dq$control$hide() {
        this.obj.hide();
        this._visible = false;
        this.onVisibleChanged && this.onVisibleChanged(this, this._visible);
        this.parent._activeControl == this && this.parent.select();
        return this;
    },
    html: function (value) {
        if (!arguments.length) {
            return this.obj.html();
        }
        this.obj.html(value);
    },
    _location: null,
    location: function (x, y) {
        if (!arguments.length) {
            return this._location;
        }
        if (y == null) {
            this._location = x;
            y = x.y;
            x = x.x;
        } else {
            this._location = new DQ.Point(x, y);
        }
        this.obj.css({ left: x, top: y });
    },
    _keydown: function (e) {
        if (e.which == 9) { //tab
            return this.parent ? this.parent.selectNextControl(this, !e.shiftKey, true, true, true) : false;
        }
        return true;
    },
    keydown: function (to, fn) {
        if (!fn) {
            this._keydown = null;
        } else {
            this._keydown = function dq$control$keydown(e) { e.data = to; return fn.apply(this, arguments); }
        }
    },
    _keyup: null,
    keyup: function (to, fn) {
        if (!fn) {
            this._keyup = null;
        } else {
            this._keyup = function control$keyup(e) { e.data = to; return fn.apply(this, arguments); }
        }
    },
    _keypress: null,
    keypress: function (to, fn) {
        if (!fn) {
            this._keypress = null;
        } else {
            this._keypress = function control$keypress(e) { e.data = to; return fn.apply(this, arguments); }
        }
    },
    pointToScreen: function (point) {
        var p = this.obj[0].offsetParent;
        var v = new DQ.Point(this.obj[0].offsetLeft, this.obj[0].offsetTop);
        while (p) {
            v.x += p.offsetLeft;
            v.y += p.offsetTop;
            p = p.offsetParent;
        }
        v.add(point);
        return v;
    },
    pointToClient: function (point) {
        var p = this.obj[0].offsetParent;
        var v = new DQ.Point(this.obj[0].offsetLeft, this.obj[0].offsetTop);
        while (p) {
            v.x += p.offsetLeft;
            v.y += p.offsetTop;
            p = p.offsetParent;
        }
        point.subtract(v);
        return point;
    },
    remove: function control$remove(element) {
        //element.obj && element.obj.remove();
        for (var i = 0; i < this.controls.length; i++) {
            if (element == this.controls[i]) {
                this.controls.splice(i, 1);
                break;
            }
        }
    },
    resize: function () {
    },
    select: function dq$control$select() {
        ///<summary>
        /// コントロールをアクティブにします。
        ///</summary>
        if (!this.canSelect || !this.obj) {
            return false;
        }

        var r = false,
            p = this;
        //_activeControlを持つ（つまりコンテナ)コントロールを探す
        while (p) {
            if (!p._visible || !p._enabled) {
                break;
            }
            p = p.parent;
            if (p && typeof p._activeControl != "undefined") {
                r = true;
                this.obj.focus();
                break;
            }
        }
        if (r) {
            this.onEnter && this.onEnter(this);
            p.activeControl(this);
        }

        return r;
    },
    selectNextControl: function (ctl, forward, tabStopOnly, nested, wrap) {
        function _sort_tab(a, b) {
            return a._tabIndex - b._tabIndex;
        }
        function _sort_tab_desc(a, b) {
            return b._tabIndex - a._tabIndex;
        }
        var c = this.controls.sort((forward ? _sort_tab : _sort_tab_desc));
        for (var i = 0; i < c.length; i++) {
            if (c[i] == ctl) {
                break;
            }
        }
        if (i == c.length) {
            return false;
        }
        i++;
        if (i == c.length) {
            if (wrap) {
                i = 0;
            } else {
                return false;
            }
        }
        while (i < c.length) {
            if (tabStopOnly && !c[i]._tabStop) {
                i = (i + 1 == c.length && wrap) ? 0 : i + 1;
                continue;
            }
            if (c[i] == ctl) {
                return false;
            }
            break;
        }
        c[i].select();

        return true;
    },
    sendToBack: function () {
        this.parent && this.obj.before(this.parent.obj[0].firstChild);
    },
    show: function () {
        this.obj.show();
        this._visible = true;
        this.onVisibleChanged && this.onVisibleChanged(this, this._visible);
        return this;
    },
    _size: new DQ.Size(0, 0),
    size: function (width, height) {
        ///<summary>
        /// コントロールの幅と高さをpixel単位かつ数値で取得または指定します。
        ///</summary>
        ///<return type="DQ.Size" />
        ///<param name="width" type="number/DQ.Size">
        ///幅もしくはDQ.Sizeを指定
        ///</param>
        ///<param name="height" type="number">
        ///高さを指定
        ///</param>

        if (!arguments.length) {
            return this._size;
        }
        if (width instanceof DQ.Size) {
            this._size = width;
            height = width.heigth;
            width = width.width;
        }

        this.width(width);
        this.height(height);
    },
    _suspendLayoutFlag: false,
    suspendLayout: function () {
        ///<summary>
        ///コントロールのレイアウト ロジックを一時的に中断します（実装は各コントロールに依存) 
        ///</summary>
        this._suspendLayoutFlag = true;
    },
    resumeLayout: function () {
        this._suspendLayoutFlag = false;
    },
    tabIndex: function (value) {
        if (!arguments.length) {
            return this._tabIndex;
        } else {
            this._tabIndex = value;
            var obj = this.client || this.obj;
            if (value == -1) {
                obj.removeAttr('tabIndex');
            } else {
                obj.attr('tabIndex', value);
            }
        }
    },
    tabStop: function (value) {
        if (!arguments.length) {
            return this._tabStop;
        } else {
            this._tabStop = value;
            this.onTabStopChanged && this.onTabStopChanged(this);
        }
    },
    text: function (value) {
        if (!arguments.length) {
            return this._text;
        }
        if (this._text != value) {
            this._text = value;
            this.client.text(value);
            this.onTextChanged && this.onTextChanged(this);
        }
        return this._text;
    },
    toClientX: function (pos) {
        var p = this.obj[0].offsetParent;
        var v = this.obj[0].offsetLeft;
        while (p) {
            v += p.offsetLeft;
            p = p.offsetParent;
        }
        return pos - v;
    },
    toClientY: function (pos) {
        var p = this.obj[0].offsetParent;
        var v = this.obj[0].offsetTop;
        while (p) {
            v += p.offsetTop;
            p = p.offsetParent;
        }
        return pos - v;
    },
    topLevelcontrol: function () {
        var p = this;
        while (p) {
            if (p.parent == null) {
                return p;
            }
            p = p.parent;
        }
        return p;
    },
    visible: function _control$visible(value) {
        if (!arguments.length) {
            return this._visible;
        }
        if (value) {
            this.show();
        } else {
            this.hide();
        }
    },
    width: function (value) {
        if (!arguments.length) {
            return this._width == 0 ? this.obj.width() : this._width;
        } else {
            this.obj.width(value);
            if (value == 'auto') {
                var w;
                if (document.defaultView && document.defaultView.getComputedStyle) {
                    w = parseInt(document.defaultView.getComputedStyle(this.obj[0], '').width);
                } else {
                    w = this.obj[0].style.pixelWidth;
                }
                this._size.width = this._width = w;
            } else {
                this._size.width = this._width = this.obj.width();
            }
        }
    },
    zIndex: 0,
    onVisibleChanged: null,
    onTabStopChanged: null,
    onTextChanged: null,
    onEnter: null,
    onLeave: null
}

DQ.Page = dqextend(DQ.Control, function () {
    ///<summary>
    /// ページのbody要素に相当するコントロールを作成します。
    ///</summary>
    this.base(null, $(document.body));
}, {
    _activeControl: null,
    activeControl: function (value) {
        if (!arguments.length) {
            return this._activeControl;
        }
        this._activeControl && this._activeControl.onLeave && this._activeControl.onLeave(this._activeControl);
        this._activeControl = value;
    },
    dqid: "DQ.Page",
    loaded: false,
    onLoad: function () {
        this.loaded = true;
        for (var i = 0; i < this.controls.length; i++) {
            this.controls[i].onLoaded && this.controls[i].onLoaded(this.controls[i]);
        }
        var w, h;
        $(window).bind("resize", this, function dq$page_resize(e) {
            if (w == $(window).width() && h == $(window).height()) {
                return true;
            }
            var me = e.data;
            if (me._resizing) {
                return true;
            }
            //return true;
            me._resizing = true;
            me._width = me.obj.width();
            me._height = me.obj.height();
            me._size = new DQ.Size(me._width, me._height);
            for (var i = 0; i < me.controls.length; i++) {
                var c = me.controls[i];
                c.resize && c.resize();
            }
            me._resizing = false;
            return true;
        });
    },
    select: function () {
        /// <summary>
        ///子コントロールを選択
        /// </summary>
        var c = null;
        for (var i = 0; i < this.controls.length; i++) {
            var v = this.controls[i];
            if (v._visible &&
                (v.canSelect == null || v.canSelect) &&
                (v._enabled == null || v._enabled) &&
                (c == null || c.zIndex <= v.zIndex)) {
                c = v;
            }
        }
        c && c.select();
    }
});

DQ.Hint = dqextend(DQ.Control, function (parent, options, object) {
    options = options || {};
    object = (object || $('<div>')).addClass('dq-hint');
    this.base(parent, object);
    this.client = $('<div>').addClass("dq-inner").appendTo(this.obj);

    options.text && this.text(options.text);
    var top = options.top || 0,
        left = options.left || 0;
    (top || left) && this.obj.css({ top: top, left: left });

    options.width && this.width(options.width);
    options.height && this.height(options.height);
},
{
    slideDown: function () {
        this.obj.slideDown("slow");
    }
}
);
DQ.page = function () {
    ///<summary>
    /// DQ.Pageコントロールのインスタンスを取得します。
    ///</summary>
    return DQ._page = DQ._page || new DQ.Page();
}

DQ._onLoad = new Array();
DQ.afterLoad = function (callback) {
    DQ._onLoad.push(callback);
}
DQ.loaded = false;

function dq_splash() {
    DQ.__dqloading__ = new DQ.Hint(null, {
        text: '',
        width: '26em',
        top: 16,
        left: 16
    }, $('<div id="dqloading" />'));
    //    DQ.__dqloading__.obj.hide();
    //    DQ.__loadingid__ = setTimeout(function () {
    //        DQ.__dqloading__.obj.show();
    //        delete DQ.__loadingid__;
    //    }, 2000);

    var dq_t = $('<table>').appendTo(DQ.__dqloading__.client);
    DQ.__dqloading__.table = $('<tbody>').appendTo(dq_t);
    DQ.__dqloading__.statusbar = $('<div>').attr('id', 'dqstatusbar').appendTo(DQ.__dqloading__.obj);

    $('<div>').attr('text-align', 'left').text("Loading...").appendTo(DQ.__dqloading__.statusbar);
    var dq_tt = $('<div>').appendTo(DQ.__dqloading__.statusbar);
    $('<span>').attr('id', 'dqchi').text(0).appendTo(dq_tt);
    $('<div>').html('<span id="dqcur"></span>').appendTo(DQ.__dqloading__.statusbar);

    DQ.__dqmoth__ = 0;
    DQ.__dqchi__ = 0;

    delete dq_t;
    delete dq_tt;
}

dq_splash();
var s = $('script[src$="dq.js"]').attr('src');
var subdir = DQ.subdir = "";
try {
    subdir = DQ.subdir = s.substring(0, s.search('dq.js'));
} catch (ex) {
    alert(ex.message);
}
delete s;
delete subdir;

var c = $('link[href$="dq.css"]').attr('href');
var n = 'dq.css';
if (!window.c || !c.length) {
    c = $('link[href$="dq-core.css"]').attr('href');
    n = 'dq-core.css'
}
DQ.cssdir = "";
try {
    DQ.cssdir = window.c ? c.substring(0, c.search(n)) : "css";
} catch (ex) {
    alert("DQ.cssdir::" + ex.message);
}
delete c;
delete n;

DQ.__trigger = function dq$__trigger() {
    if (!DQ.loaded) {
        return;
    }
    for (var i = 0; i < DQ._onLoad.length; i++) {
        DQ._onLoad[i].call();
    }
    DQ._onLoad.length = 0;
    delete DQ.__trigger;
}

DQ._message = DQ._message || [];
DQ.document = $(document);

//iPhone hack
$(DQ.document).bind('touchmove', function (e) { e.preventDefault(); });

_ = DQ.gettext;
DQ._locale = $('html').attr('xml:lang') || 'ja';

$(function () {
    DQ.loaded = true;
    DQ.page().append(DQ.__dqloading__, true);
    DQ.__dqloading__.show();

    if (!Array.clone) {
        Array.prototype.clone = function () {
            //for IE7
            var d = [];
            for (var i = 0; i < this.length; i++) {
                d.push(this[i]);
            }
            return d;

            // else
            //return Array.apply(null, this)
        }
    }
    DQ.lazyLoad(DQ.subdir + "dq-core.js", "DQ.Window", function () {
        DQ.document.keydown(function dq$keydown(e) {
            var me = DQ.page();
            return me._activeControl && me._activeControl._keydown ? me._activeControl._keydown(e) : true;
        });
        DQ.document.keypress(function (e) {
            var me = DQ.page();
            return me._activeControl && me._activeControl._keypress ? me._activeControl._keypress(e) : true;
        });
        DQ.document.keyup(function (e) {
            var me = DQ.page();
            return me._activeControl && me._activeControl._keyup ? me._activeControl._keyup(e) : true;
        });
    });
});