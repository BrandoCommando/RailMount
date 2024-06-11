(function(){
var canvas = window.canvas = new fabric.Canvas('canvas', {
  isDrawingMode: true
});

var svg_preview = document.querySelector("#svg_preview");
if(svg_preview)
  canvas.on("after:render", () => {svg_preview.innerHTML = canvas.toSVG();});
else console.warn("No SVG element");

window.loadFromSVG = (path)=> {
  fabric.loadSVGFromURL(path, function(objects, options) {
    var shape = fabric.util.groupSVGElements(objects, options);
    canvas.add(shape);
  });
};

if(window.toload)
  loadFromSVG(window.toload);

var $ = function(id){return document.getElementById(id)};

fabric.Object.prototype.transparentCorners = false;

var drawingModeEl = $('drawing-mode'),
    drawingOptionsEl = $('drawing-mode-options'),
    drawingColorEl = $('drawing-color'),
    clearEl = $('clear-canvas');

clearEl.onclick = function() { canvas.clear() };

drawingModeEl.onclick = function() {
  canvas.isDrawingMode = !canvas.isDrawingMode;
  if (canvas.isDrawingMode) {
    drawingModeEl.innerHTML = 'Cancel drawing mode';
    drawingOptionsEl.style.display = '';
  }
  else {
    drawingModeEl.innerHTML = 'Enter drawing mode';
    drawingOptionsEl.style.display = 'none';
  }
};

drawingColorEl.onchange = function() {
  var brush = canvas.freeDrawingBrush;
  brush.color = this.value;
  if (brush.getPatternSrc) {
    brush.source = brush.getPatternSrc.call(brush);
  }
};

if (canvas.freeDrawingBrush) {
  canvas.freeDrawingBrush.color = drawingColorEl.value;
  canvas.freeDrawingBrush.width = 1;
} else console.warn("No brush!");
})();