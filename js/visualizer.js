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
  $.extend(Visualizer, (function () {
    var PROBLEM_SET = [
      [ 250, [ 0, 10, 30], [0.5, 0,   0]],
      [ 500, [10, 35, 55], [0,   0.5, 0]],
      [1000, [35, 75, 75], [0,   0,   0.5]]
    ];
    
    return {
      PROBLEM_SET: PROBLEM_SET
    };
  })());
})(jQuery);

(function ($) {
  var Context = CanvasRenderingContextPostscript;

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

  var Point = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
  };

  $.extend(Point.prototype, (function () {
    var RADIUS = 3;
    var MARGIN = 2;

    function draw(context, dm) {
      context.moveTo(this.x, this.y);

      context.matrixexec(dm, function () {
        var p = this.currentPoint();

        var color = this.currentRGBColor();

        this.setGray(1);

        this.arc(p[0], p[1], RADIUS + MARGIN, 0, 360);

        this.fill();

        Context.prototype.setRGBColor.apply(this, color);

        this.arc(p[0], p[1], RADIUS, 0, 360);

        this.fill();
      });
    }

    return {
      draw: draw
    };
  })());

  var Problem = function (score) {
    this.score = score;

    this.color = Problem.COLOR;

    this.ps = new Point();
    this.pe = new Point();
    this.pr = new Point();
  };

  $.extend(Problem, (function () {
    var COLOR = [0.9, 0.9, 0.9];

    return {
      COLOR: COLOR
    };
  })());

  $.extend(Problem.prototype, (function () {
    var RE_TWODECIMAL = new RegExp(/(\...).*/);

    function twodecimal(x) {
      x = x + '';
      
      x += (x.indexOf('.') >= 0) ? '00' : '.00';

      return x.replace(RE_TWODECIMAL, '$1');
    }

    function draw(context, dm) {
      var xs = this.ps.x;
      var xe = this.pe.x;
      var xr = this.pr.x;

      this.ps.y = this.score;
      this.pe.y = this.score * Score.calc(Visualizer.T, xe - xs);
      this.pr.y = this.score * Score.calc(Visualizer.T, xr - xs) * Visualizer.P;

      var ys = this.ps.y;
      var ye = this.pe.y;
      var yr = this.pr.y;

      Context.prototype.setRGBColor.apply(context, this.color);

      {
        context.moveTo(xs, ys);

        for (var x = xs + 1; x <= xe; x ++) {
          var y = this.score * Score.calc(Visualizer.T, x - xs);

          context.lineTo(x, y);
        }

        context.matrixexec(dm, function () {
          context.stroke();
        });
      }

      context.setDash([5, 2]);

      if (xr > xe) {
        context.moveTo(xe, ye);

        context.lineTo(xr, ye);

        context.lineTo(xr, yr);

        for (var x = xr + 1; x <= Visualizer.T; x ++) {
          var y = this.score * Score.calc(Visualizer.T, x - xs) * Visualizer.P;

          context.lineTo(x, y);
        }

        context.matrixexec(dm, function () {
          context.stroke();
        });
      }
      else if (false) {		// Suppressed
        context.moveTo(xe, ye);

        context.lineTo(Visualizer.T, ye);

        context.matrixexec(dm, function () {
          context.stroke();
        });
      }

      context.setDash([]);

      this.ps.draw(context, dm);
      this.pe.draw(context, dm);
      this.pr.draw(context, dm);
    }

    function drawAnnotation(context, dm) {
      var xs = this.ps.x;
      var xe = this.pe.x;
      var xr = this.pr.x;

      // We are assuming that y is already calculated.
      var ys = this.ps.y;
      var ye = this.pe.y;
      var yr = this.pr.y;

      context.findFont('Helvetica').scaleFont('12px').setFont();

      Context.prototype.setRGBColor.apply(context, this.color);

      {
        context.moveTo(xe, ye);
        
        context.matrixexec(dm, function () {
          context.rmoveTo(5, 5);

          context.show(twodecimal(ye) + ' pt / ' + (xe - xs) + ' min');
        });
      }

      if (xr != xe) {
        context.moveTo(xr, yr);
        
        context.matrixexec(dm, function () {
          context.rmoveTo(5, 5);
          
          context.show(twodecimal(yr) + ' pt / ' + (xr - xs) + ' min');
        });
      }
    }

    return {
      draw:           draw,
      drawAnnotation: drawAnnotation
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

      var points = [];

      for (var i = 0; i < 3; i ++) {
        points.push(this.problems[i].ps);
        points.push(this.problems[i].pe);
        points.push(this.problems[i].pr);
      }

      $(canvas).mousedown(function (e) {
        var nearest = [undefined, undefined, INF];
        
        $.each(points, function (i) {
          context.moveTo(this.x, this.y);

          context.matrixexec(I, function () {
            var p = context.currentPoint();

            var d = hypot(e.offsetX, e.offsetY, p[0], p[1]);

            if (d < nearest[2])
              nearest = [i, points[i], d];
          });
        })

        if (nearest[2] < THRESHOLD) {
          dragging = [nearest[0], nearest[1].x, 0, Visualizer.T - 1, e.offsetX];

          if (i % 3) {
            dragging[2] += 1;
            dragging[3] += 1;
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
        var dcx = dragging[1];
        var xm  = dragging[2];
        var xp  = dragging[3];
        var ox  = dragging[4];

        context.moveTo(dcx, 0);

        context.matrixexec(I, function () {
          context.moveTo(context.currentPoint()[0] + e.offsetX - ox, 0);
        });

        var p = context.currentPoint();

        points[ind].x = Math.round(Math.max(Math.min(p[0], xp), xm));

        if (ind % 3 == 0) {
          if (points[ind].x >= points[ind+1].x)
            points[ind+1].x = points[ind].x + 1;

          if (points[ind].x >= points[ind+2].x)
            points[ind+2].x = points[ind].x + 1;
        }
        else if (ind % 3 == 1) {
          if (points[ind].x <= points[ind-1].x)
            points[ind-1].x = points[ind].x - 1;

          if (points[ind].x > points[ind+1].x)
            points[ind+1].x = points[ind].x;
        }
        else {
          if (points[ind].x <= points[ind-1].x)
            points[ind-1].x = points[ind].x;

          if (points[ind].x <= points[ind-2].x)
            points[ind-2].x = points[ind].x - 1;
        }

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

      this.problems = $.map(Visualizer.PROBLEM_SET, function (template) {
        var score = template[0];
        var ticks = template[1];
        var color = template[2];

        var problem = new Problem(score);

        problem.ps.x = ticks[0];
        problem.pe.x = ticks[1];
        problem.pr.x = ticks[2];

        problem.color = color;

        return problem;
      });

      this.draw();
      
      this.event();
    }

    function draw() {
      var context = this.context;
      var dm      = this.dm;

      clear(context);

      grid(context, dm);

      $.each(this.problems, function () {
        this.draw(context, dm);
      });

      $.each(this.problems, function () {
        this.drawAnnotation(context, dm);
      });
    }

    return {
      doit:  doit,
      draw:  draw,
      event: event
    };
  })());
})(jQuery);
