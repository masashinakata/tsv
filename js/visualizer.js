(function ($) {
  var Context = CanvasRenderingContextPostscript;

  $.extend(Context.prototype, (function () {
    function matrixexec(m, fn) {
      var mm = this.currentMatrix();

      Context.prototype.setTransform.apply(this, m);

      var r = fn.apply(this);

      Context.prototype.setTransform.apply(this, mm);
      
      return r;
    };

    return {
      matrixexec: matrixexec
    };
  })());
})(jQuery);

(function ($) {
  var Context = CanvasRenderingContextPostscript;

  var show = Context.prototype.show;
  
  Context.prototype.show = function (text) {
    this.matrixexec(this.currentMatrix(), function () {
      var p = this.currentPoint();

      this.translate(p[0], p[1]);

      this.scale(1, -1);

      show.call(this, text);
    });
  };
})(jQuery);

var Visualizer = function (canvas) {
  this.canvas  = canvas;
  this.context = canvas.getContext('postscript');
  
  this.scores = [250, 500, 1000];

  this.ticks = [[ 0, 10, 30],
                [10, 35, 55],
                [35, 75, 75]
               ];
  
  this.colors = [[0.5, 0,   0],
                 [0,   0.5, 0],
                 [0,   0,   0.5]
                ];

  this.points = [];
};

(function ($) {
  $.extend(Visualizer, (function () {
    var T = 75;
    var P = 0.9;

    return {
      T: T,
      P: P
    };
  })());
})(jQuery);

(function ($) {
  function hypot(x1, y1, x2, y2) {
    var x = x2 - x1;
    var y = y2 - y1;

    return Math.sqrt(x * x + y * y);
  }

  var Score = function () {
  };

  $.extend(Score, (function () {
    function calc(T, t) {
      return 0.3 + (0.7 * T * T) / (10 * t * t + T * T);
    }

    return {
      calc: calc
    };
  })());

  var Point = function (x, y, color) {
    this.x     = x;
    this.y     = y;
    this.color = color;
  };

  $.extend(Point.prototype, (function () {
    var RADIUS = 3;

    function draw(context, dm) {
      var color = this.color;

      context.moveTo(this.x, this.y);

      context.matrixexec(dm, function () {
        var p = this.currentPoint();

        this.setGray(1);

        this.arc(p[0], p[1], RADIUS + 2, 0, 360);

        this.fill();

        CanvasRenderingContextPostscript.prototype.setRGBColor.apply(this, color);

        this.arc(p[0], p[1], RADIUS, 0, 360);

        this.fill();
      });
    }

    return {
      draw: draw
    };
  })());

  $.extend(Visualizer.prototype, (function () {
    function clear(context) {
      context.clearRect(-20, -250, 150, 1500);
    }

    function grid(context, dm) {
      context.setGray(0);

      context.moveTo(75,    0);
      context.lineTo(-5,    0);
      context.lineTo(-5, 1000);

      context.findFont('Times').scaleFont('12px').setFont();

      for (var i = 0; i <= 75; i += 5) {
        context.moveTo(i, 0);

        context.matrixexec(dm, function () {
          var p = context.currentPoint();

          context.lineTo(p[0], p[1] + ((i % 10 == 0) ? 7 : 5));

          context.moveTo(p[0], p[1]);

          context.rmoveTo(-5, -13);

          context.show(i);
        });
      }

      for (var i = 250; i <= 1000; i += 250) {
        context.moveTo(-5, i);

        context.matrixexec(dm, function() {
          var p = context.currentPoint();

          context.lineTo(p[0] + ((i % 500 == 0) ? 7 : 5), p[1]);

          context.moveTo(p[0], p[1]);

          context.rmoveTo(-24 - 6 * (i - 250) / 750, -3);

          context.show(i);
        });
      }

      context.matrixexec(dm, function () {
        this.stroke();
      });
    }

    var I = [1, 0, 0, 1, 0, 0];

    var INF = 1000000000;
    
    var THRESHOLD = 10;

    function event() {
      var dragging = undefined;

      var self    = this;
      var context = this.context;

      $(canvas).mousedown(function (e) {
        var nearest = [undefined, INF];

        for (var i = 0; i < 9; i ++) {
          var x = self.points[i].x;
          var y = self.points[i].y;

          context.moveTo(x, y);

          context.matrixexec(I, function () {
            var p = context.currentPoint();

            var d = hypot(e.offsetX, e.offsetY, p[0], p[1]);

            if (d < nearest[1])
              nearest = [i, d];
          });
        }

        if (nearest[1] < THRESHOLD) {
          var i = nearest[0];

          dragging = [i, self.points[i].x, undefined, undefined, e.offsetX];

          var x = self.points[i].x;

          if (i % 3 == 0) {
            dragging[2] = 0;
            dragging[3] = Visualizer.T - 1;
          }
          else {
            dragging[2] = 1;
            dragging[3] = Visualizer.T;
          }
        }
      })
      .mouseup(function (e) {
        dragging = undefined;
      })
      .mousemove(function (e) {
        if (dragging == undefined)
          return false;

        var ind = dragging[0];
        var x   = dragging[1];
        var xm  = dragging[2];
        var xp  = dragging[3];
        var ox  = dragging[4];

        context.moveTo(x, 0);

        context.matrixexec(I, function () {
          var p = context.currentPoint();

          context.moveTo(p[0] + e.offsetX - ox, 0);
        });

        var p = context.currentPoint();

        self.points[ind].x = Math.round(Math.max(Math.min(p[0], xp), xm));

        if (ind % 3 == 0) {
          if (self.points[ind].x >= self.points[ind+1].x)
            self.points[ind+1].x = self.points[ind].x + 1;

          if (self.points[ind].x >= self.points[ind+2].x)
            self.points[ind+2].x = self.points[ind].x + 1;
        }
        else if (ind % 3 == 1) {
          if (self.points[ind].x <= self.points[ind-1].x)
            self.points[ind-1].x = self.points[ind].x - 1;

          if (self.points[ind].x > self.points[ind+1].x)
            self.points[ind+1].x = self.points[ind].x;
        }
        else {
          if (self.points[ind].x <= self.points[ind-1].x)
            self.points[ind-1].x = self.points[ind].x;

          if (self.points[ind].x <= self.points[ind-2].x)
            self.points[ind-2].x = self.points[ind].x - 1;
        }

        var i = Math.floor(ind / 3);

        var xo = self.points[i*3].x;

        self.points[i*3+1].y = self.scores[i] * Score.calc(Visualizer.T, self.points[i*3+1].x - xo);
        self.points[i*3+2].y = self.scores[i] * Score.calc(Visualizer.T, self.points[i*3+2].x - xo) * Visualizer.P;

        self.draw();
      });
    }

    function doit() {
      var canvas  = this.canvas;
      var context = this.context;

      context.translate(0, canvas.height);

      context.scale(1, -1);

      this.dm = context.currentMatrix();

      context.translate(80, 30);

      context.scale((canvas.width - 200) / 75.0, (canvas.height - 50) / 1000.0);

      for (var i = 0; i < 3; i ++) {
        var s = this.ticks[i][0];
        var e = this.ticks[i][1];
        var r = this.ticks[i][2];

        var ss = this.scores[i];
        var se = this.scores[i] * Score.calc(Visualizer.T, e - s);
        var sr = this.scores[i] * Score.calc(Visualizer.T, r - s) * Visualizer.P;

        var color = this.colors[i];

        this.points.push(new Point(s, ss, color));
        this.points.push(new Point(e, se, color));
        this.points.push(new Point(r, sr, color));
      }

      this.draw();
      
      this.event();
    }

    function twodecimal(x) {
      x = x + '';
      
      x += (x.indexOf('.') >= 0) ? '00' : '.00';

      return x.replace(/(\...).*/, '$1');
    }

    function draw() {
      var context = this.context;
      var dm      = this.dm;

      clear(context);

      grid(context, dm);

      context.findFont('Helvetica').scaleFont('12px').setFont();

      context.setDash([5, 2]);

      for (var i = 0; i < 3; i ++) {
        var xs = this.points[i*3  ].x;
        var xe = this.points[i*3+1].x;
        var xr = this.points[i*3+2].x;

        var ys = this.points[i*3  ].y;
        var ye = this.points[i*3+1].y;
        var yr = this.points[i*3+2].y;

        if (xr > xe) {
          context.moveTo(xe, ye);

          context.lineTo(xr, ye);

          for (var j = xr; j <= Visualizer.T; j += 1) {
            var y = this.scores[i] * Score.calc(Visualizer.T, j - xs) * Visualizer.P;

            context.lineTo(j, y);
          }
        }

        CanvasRenderingContextPostscript.prototype.setRGBColor.apply(context, this.colors[i]);

        context.matrixexec(this.dm, function () {
          context.stroke();
        });
      }

      context.setDash([]);

      for (var i = 0; i < 3; i ++) {
        var xs = this.points[i*3  ].x;
        var xe = this.points[i*3+1].x;
        var xr = this.points[i*3+2].x;

        context.moveTo(xs, this.points[i*3].y);

        for (var j = 1; j <= xe - xs; j += 1) {
          var y = this.scores[i] * Score.calc(Visualizer.T, j);

          context.lineTo(xs + j, y);
        }

        var p = context.currentPoint();

        CanvasRenderingContextPostscript.prototype.setRGBColor.apply(context, this.colors[i]);

        context.matrixexec(this.dm, function () {
          context.stroke();
        });
      }

      for (var i = 0; i < 3; i ++) {
        var ps = this.points[i*3  ];
        var pe = this.points[i*3+1];
        var pr = this.points[i*3+2];

        ps.draw(context, dm);
        pe.draw(context, dm);
        pr.draw(context, dm);
      }

      $.each(this.points, function (i) {
        this.draw(context, dm);
      });
      
      for (var i = 0; i < 3; i ++) {
        var s = this.points[i*3];
        var e = this.points[i*3+1];
        var r = this.points[i*3+2];

        CanvasRenderingContextPostscript.prototype.setRGBColor.apply(context, this.colors[i]);

        context.moveTo(e.x, e.y);
        
        context.matrixexec(this.dm, function () {
          context.rmoveTo(5, 5);
          
          context.show(twodecimal(e.y) + ' pt / ' + (e.x - s.x) + ' min');
        });

        if (r.x != e.x) {
          context.moveTo(r.x, r.y);

          context.matrixexec(this.dm, function () {
            context.rmoveTo(5, 5);
            
            context.show(twodecimal(r.y) + ' pt / ' + (r.x - s.x) + ' min');
          });
        }
      }
    }

    return {
      doit:  doit,
      draw:  draw,
      event: event
    };
  })());
})(jQuery);
