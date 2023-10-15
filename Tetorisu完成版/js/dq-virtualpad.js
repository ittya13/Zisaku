/// <reference path="jquery.js" />
/// <reference path="dq.js" />
/// <reference path="dq-core.js" />

DQ.VirtualPad = function (options) {
    options = DQ.options(options, {
        engine: null
    });
    this._engine = options.engine;
    this.obj = $('<div>').addClass('dq-i-keypad').appendTo(DQ.page().obj);
    this.client = $('<div>').addClass('dq-i-keypad-inner').appendTo(this.obj);

    var tt = $('<table>')
        .attr({ 'cellpadding': 0, 'border': 0, 'cellspacing': 0 })
        .addClass('dq-pad').appendTo(this.client);
    var tb = $('<tbody>').appendTo(tt);
    var tr1 = $('<tr>').appendTo(tb);
    var tr2 = $('<tr>').appendTo(tb);
    var tr3 = $('<tr>').appendTo(tb);
    var td_lt = $('<td>').appendTo(tr1);
    var td_ct = $('<td>').appendTo(tr1).css('background-color', "Silver");
    var td_rt = $('<td>').appendTo(tr1);
    var td_lm = $('<td>').appendTo(tr2).css('background-color', "Silver");
    var td_cm = $('<td>').appendTo(tr2).css('background-color', "Silver");
    var td_rm = $('<td>').appendTo(tr2).css('background-color', "Silver");
    var td_lb = $('<td>').appendTo(tr3);
    var td_cb = $('<td>').appendTo(tr3).css('background-color', "Silver");
    var td_rb = $('<td>').appendTo(tr3);
    this.cells = [td_lt, td_ct, td_rt, td_lm, td_cm, td_rm, td_lb, td_cb, td_rb];
    this.a_button = $('<div>').addClass('dq-abutton').appendTo(this.client).text('A');
    this.b_button = $('<div>').addClass('dq-bbutton').appendTo(this.client).text('B');

    var style = this.obj[0].currentStyle || document.defaultView.getComputedStyle(this.obj[0], '');
    var pX = parseInt(style.left);
    var pY = parseInt(style.top);
    var cX = this.client.width() / 2;
    var cY = this.client.height() / 2;

    var me = this, dir,
    _make_dir = function (e) {
        var dir = 0;
        var dx = e.pageX - pX;
        var dy = e.pageY - pY;
        if (dx <= 35) {
            dir += 1;
        } else if (70 < dx) {
            dir += 2;
        }
        if (dy <= 35) {
            dir += 4;
        } else if (70 < dy) {
            dir += 8;
        }
        return dir;
    },
    touch_start = function (e) {
        $(tt).bind('mousemove', tt, touch_move);
        $(tt).one('mouseup', tt, touch_end);

        if (e.originalEvent.touches && e.originalEvent.touches.length) {
            e = e.originalEvent.touches[0];
        } else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
            e = e.originalEvent.changedTouches[0];
        }
        me.dir = _make_dir(e);
        me.onMousedown && me.onMousedown(me.dir, e);
        if (me._engine && me._engine.onKeydown) {
            if (me.dir & DQ.DIR.UP) {
                me._engine.onKeydown({ which: 38 });
            }
            if (me.dir & DQ.DIR.DOWN) {
                me._engine.onKeydown({ which: 40 });
            }
            if (me.dir & DQ.DIR.LEFT) {
                me._engine.onKeydown({ which: 37 });
            }
            if (me.dir & DQ.DIR.RIGHT) {
                me._engine.onKeydown({ which: 39 });
            }
        }
        return false;
    },
    touch_move = function (e) {
        if (e.originalEvent.touches && e.originalEvent.touches.length) {
            e = e.originalEvent.touches[0];
        } else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
            e = e.originalEvent.changedTouches[0];
        }
        var back = me.dir;
        me.dir = _make_dir(e);
        if (back != me.dir) {
            me.onMousedown && me.onMousedown(me.dir, e);
        }
        return false;
    },
    touch_end = function (e) {
        $(tt).unbind('mousemove', touch_move);
        me.onMouseup && me.onMouseup(me.dir, e);
        if (me._engine && me._engine.onKeydown) {
            if (me.dir & DQ.DIR.UP) {
                me._engine.onKeyup({ which: 38 });
            }
            if (me.dir & DQ.DIR.DOWN) {
                me._engine.onKeyup({ which: 40 });
            }
            if (me.dir & DQ.DIR.LEFT) {
                me._engine.onKeyup({ which: 37 });
            }
            if (me.dir & DQ.DIR.RIGHT) {
                me._engine.onKeyup({ which: 39 });
            }
        }
        me.dir = DQ.DIR.NONE;
        return false;
    },
    button_touch_start = function (e) {
        var btn = e.data;
        if (me._engine && me._engine.onKeydown) {
            if (btn.text() == "A") {
                me._engine.onKeydown({ which: 86 });
            } else if (btn.text() == "B") {
                me._engine.onKeydown({ which: 67 });
            } else if (btn.text() == "S") {
                me._engine.onKeydown({ which: 13 });
            }
        }
        return false;
    },
    button_touch_end = function (e) {
        var btn = e.data;
        me.onButtonClick && me.onButtonClick(btn.text(), e);
        if (me._engine && me._engine.onKeyup) {
            if (btn.text() == "A") {
                me._engine.onKeyup({ which: 86 });
            } else if (btn.text() == "B") {
                me._engine.onKeyup({ which: 67 });
            } else if (btn.text() == "S") {
                me._engine.onKeyup({ which: 13 });
            }
        }
        return false;
    }

    $(tt).bind('mousedown touchstart MozTouchDown', this, touch_start);
    $(tt).bind('touchmove MozTouchMove', this, touch_move);
    $(tt).bind('touchend MozTouchRelease', this, touch_end);

    $(this.a_button).bind('mousedown touchstart MozTouchDown', this.a_button, button_touch_start);
    $(this.a_button).bind('mouseup touchend MozTouchRelease', this.a_button, button_touch_end);

    $(this.b_button).bind('mousedown touchstart MozTouchDown', this.b_button, button_touch_start);
    $(this.b_button).bind('mouseup touchend MozTouchRelease', this.b_button, button_touch_end);
}
DQ.VirtualPad.prototype = {
    onClick: null,
    onButtonClick: null,
    onMouseup: null,
    onMousedown: null,
    buttonclick: function (fn) {
        this.onButtonClick = fn;
    },
    click: function (fn) {
        this.onClick = fn;
    },
    mouseup: function (fn) {
        this.onMouseup = fn;
    },
    mousedown: function (fn) {
        this.onMousedown = fn;
    }
}
