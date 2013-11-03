var CanvasRenderingContextPostscript = function (context) {
  this.context = context;
  
  this.m = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0];
  
  this.p = undefined;
};

(function ($) {
  function degtorad(degree) {
    return degree / 180.0 * Math.PI;
  }

  $.extend(CanvasRenderingContextPostscript.prototype, (function () {
    function translate(tx, ty) {
      var m = this.m;

      this.m = [m[0],
	        m[1],
	        m[2],
	        m[3],
	        tx * m[0] + ty * m[2] + m[4],
	        tx * m[1] + ty * m[3] + m[5]];
      
      // Apply reverse transformation.
      if (!! this.p) {
        this.p[0] -= tx;
        this.p[1] -= ty;
      }
      
      this.context.translate(tx, ty);
    }

    function scale(sx, sy) {
      this.m = [sx * this.m[0], sx * this.m[1],
                sy * this.m[2], sy * this.m[3],
                     this.m[4],      this.m[5]];

      this.context.scale(sx, sy);

      // Apply reverse transformation.
      if (!! this.p)
        this.p = [this.p[0] / sx,
                  this.p[0] / sy];
    }

    return {
      translate: translate,
      scale:     scale
    };
  })());

  $.extend(CanvasRenderingContextPostscript.prototype, (function () {
    function moveTo(x, y) {
      this.p = [x, y];

      this.context.moveTo(x, y);
    }

    function rmoveTo(x, y) {
      this.p[0] += x;
      this.p[1] += y;

      this.context.moveTo(this.p[0], this.p[1]);
    }

    function lineTo(x, y) {
      this.p = [x, y];

      this.context.lineTo(x, y);
    }
    
    function rlineTo(x, y) {
      this.p[0] += x;
      this.p[1] += y;

      this.context.lineTo(this.p[0], this.p[1]);
    }

    function arc(x, y, r, s, e, c) {
      if (c == undefined)
        c = true;

      this.context.arc(x, y, r, degtorad(s), degtorad(e), c);

      // XXX: Do something with this.p.
    }
    
    function closePath() {
      this.context.closePath();
    }
    
    function stroke() {
      this.context.stroke();
      
      this.context.beginPath();

      this.p = undefined;
    }

    function fill() {
      this.context.fill();

      this.context.beginPath();

      this.p = undefined;
    }

    function setGray(g, a) {
      this.setRGBColor(g, g, g, a);
    }

    function setRGBColor(r, g, b, a) {
      if (a == undefined)
        a = 1;

      r = Math.round(r * 255);
      g = Math.round(g * 255);
      b = Math.round(b * 255);
      a = Math.round(a * 255);

      this.strokeStyle =
        this.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }
    
    function setDash(dash, offset) {
      this.context.setLineDash(dash);
    }

    return {
      moveTo:      moveTo,
      rmoveTo:     rmoveTo,
      lineTo:      lineTo,
      rlineTo:     rlineTo,
      arc:         arc,
      closePath:   closePath,
      stroke:      stroke,
      fill:        fill,
      setGray:     setGray,
      setRGBColor: setRGBColor,
      setDash:     setDash
    };
  })());

  $.extend(CanvasRenderingContextPostscript.prototype, (function () {
    function clearRect(x, y, w, h) {
      this.context.clearRect(x, y, w, h);
    }

    return {
      clearRect: clearRect
    };
  })());

  $.extend(CanvasRenderingContextPostscript.prototype, (function () {
    function setTransform(m11, m12, m21, m22, m31, m32) {
      var m = this.m;
      var p = this.p;

      if (!! p) {
        // Transform current point into world coordinate.
        p = [m[0] * p[0] + m[2] * p[1] + m[4],
	     m[1] * p[0] + m[3] * p[1] + m[5]];
        
        // Calculate inverse matrix from current matrix, and apply to
        // the point in world coordinate.
        // XXX: What if determinant is equal to 0?
        var det = m11 * m22 - m21 * m12;

        this.p = [(  p[0] * m22 - p[1] * m21 + (m21 * m32 - m31 * m22)) / det,
	          (- p[0] * m12 + p[1] * m11 - (m11 * m32 - m31 * m12)) / det];
      }

      this.m = [m11, m12, m21, m22, m31, m32];
      
      this.context.setTransform(m11, m12, m21, m22, m31, m32);
    }
    
    function currentMatrix() {
      return this.m.concat();
    }

    return {
      setTransform:  setTransform,
      currentMatrix: currentMatrix
    };
  })());

  $.extend(CanvasRenderingContextPostscript.prototype, (function () {
    function currentPoint() {
      return this.p;
    }

    return {
      currentPoint: currentPoint
    };
  })());

  $.extend(CanvasRenderingContextPostscript.prototype, (function () {
    function show(text) {
      var p = this.p;

      if (!! p)
        this.context.fillText(text, p[0], p[1]);
    }

    return {
      show: show
    };
  })());

  $.extend(CanvasRenderingContextPostscript.prototype, (function () {
    var Font = function (context, font) {
      this.context = context;
      this.font    = font || 'Helvetica';
      this.scale   = '10px';
    };
    
    $.extend(Font.prototype, (function () {
      function scaleFont(scale) {
        this.scale = scale;

        return this;
      }

      function setFont() {
        this.context.font = this.scale + ' ' + this.font;
      }
      
      return {
        scaleFont: scaleFont,
        setFont:   setFont
      };
    })());
    
    function findFont(font) {
      return new Font(this, font);
    }
    
    return {
      findFont: findFont
    }
  })());

  CanvasRenderingContextPostscript.prototype.__defineSetter__('font', function (font) {
    return this.context.font = font;
  });

  CanvasRenderingContextPostscript.prototype.__defineSetter__('strokeStyle', function (style) {
    return this.context.strokeStyle = style;
  });

  CanvasRenderingContextPostscript.prototype.__defineGetter__('strokeStyle', function (style) {
    return this.context.strokeStyle;
  });

  CanvasRenderingContextPostscript.prototype.__defineSetter__('fillStyle', function (style) {
    return this.context.fillStyle = style;
  });

  CanvasRenderingContextPostscript.prototype.__defineGetter__('fillStyle', function () {
    return this.context.fillStyle;
  });
})(jQuery);



(function ($) {
  var get_context = HTMLCanvasElement.prototype.getContext;

  if (!! get_context)
    HTMLCanvasElement.prototype.getContext = function (contextId) {
      if (contextId == 'postscript') {
        return new CanvasRenderingContextPostscript(get_context.call(this, '2d'));
      }
      else {
        return get_context.call(this, contextId);
      }
    };
})(jQuery);
