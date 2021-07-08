 //Moveable coordinates
 class Bubble{
    constructor(item, contain,positionX, positionY){
        this.item = item;
        this.container = contain;
        this.positionX = parseInt(positionX);
        this.positionY = parseInt(positionY);
        this.set(this.positionX,this.positionY);
    }
    set(positionX, positionY) {
        let dragItem = document.querySelector(`${this.item}`);
        dragItem.style.left = `${parseInt(positionX)-dragItem.offsetWidth/2}px`
        dragItem.style.top = `${parseInt(positionY)-dragItem.offsetHeight/2}px`
        let container = document.querySelector(`${this.container}`);
        let active = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        container.addEventListener("touchstart", dragStart, false);
        container.addEventListener("touchend", dragEnd, false);
        container.addEventListener("touchmove", drag, false);

        container.addEventListener("mousedown", dragStart, false);
        container.addEventListener("mouseup", dragEnd, false);
        container.addEventListener("mousemove", drag, false);

        function dragStart(e) {
          if (e.type === "touchstart") {
              initialX = e.touches[0].clientX - xOffset;
              initialY = e.touches[0].clientY - yOffset;
          } else {
              initialX = e.clientX - xOffset;
              initialY = e.clientY - yOffset;
          }

          if (e.target === dragItem) {
              active = true;
          }
        }

        function dragEnd(e) {
          initialX = currentX;
          initialY = currentY;
          active = false;
        }

        function drag(e) {
          if (active) {
              e.preventDefault();
              if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
              } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
              }
              xOffset = currentX;
              yOffset = currentY;
              setTranslate(currentX, currentY, dragItem);
              changePosition(currentX,currentY);
          }
        }


        var changePosition = function(x,y){
          this.positionX = x+parseInt(positionX);
          this.positionY = y+parseInt(positionY);
        }.bind(this);

        
        function setTranslate(xPos, yPos, el) {
          el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        }
    }
 }


function drawQuad(canvas,points){
    //this function draws a line
    function drawLine(ctx, begin, end, stroke = 'red', width = 1) {
      if (stroke) {
          ctx.strokeStyle = stroke;
      }
      if (width) {
          ctx.lineWidth = width;
      }
      ctx.beginPath();
      ctx.moveTo(...begin);
      ctx.lineTo(...end);
      ctx.stroke();
  }
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let i=0; i<points.length; i++){
    if(i==points.length-1){
      drawLine(ctx, points[i],points[0],'red',2)
    }else{
      drawLine(ctx, points[i], points[i+1],'red',2);
    }
  }
}


//Trigger the file input virtually using the custom upload button
const inputBtn = document.getElementById("file-input");
const uploadBtn = document.getElementById("upload-button");
uploadBtn.addEventListener("click", function(){
      inputBtn.click();
});

  
//get the image source
let img = document.createElement("img")
inputBtn.addEventListener('change', (e) => {
    img.src =  URL.createObjectURL(e.target.files[0]);  
  })

var points = [];


img.onload = function(){
    //Drawing the image on the input-canvas
    let canvas = document.getElementById('canvas-input');
    canvas.style.display = "inline-block";
    let mat = cv.imread(img);
    cv.imshow('canvas-input', mat);
    let container = document.getElementById("container");
    container.style.height = `${canvas.offsetHeight}px`;
    container.style.width = `${canvas.offsetWidth}px`;

    //Creating and positioning the moveable bubbles
    var bubbles= []
    bubbles[0] = new Bubble("#item1","#container","50","50");
    bubbles[1] = new Bubble("#item2","#container", `${canvas.offsetWidth-50}`,`50`);
    bubbles[2] = new Bubble("#item3","#container",`${canvas.offsetWidth-50}`,`${canvas.offsetHeight-50}`);
    bubbles[3] = new Bubble("#item4","#container",`50`,`${canvas.offsetHeight-50}`);

    //This function will initialize and change the cropping lines when the points are moved
    function transformQuad(){
      let editCanvas = document.getElementById('edit-canvas');
      editCanvas.height = `${canvas.offsetHeight}`
      editCanvas.width = `${canvas.offsetWidth}`

      //drawing the initial lines
      for(let i =0; i<bubbles.length; i++){
        points.push([bubbles[i].positionX,bubbles[i].positionY]);
      }
      drawQuad(editCanvas,points);

      //changing the lines when the bubbles are moved
      for(let i=0; i<bubbles.length; i++){
        let item = document.querySelector(bubbles[i].item);
        let active =false;
        item.addEventListener('mousedown',()=>{
          active = true;
        })
        item.addEventListener('mouseup',()=>{
          active = false;
        })
        item.addEventListener('mousemove',()=>{
          if(active){
            let ar = [];
            for(let i =0; i<bubbles.length; i++){
              ar.push([bubbles[i].positionX,bubbles[i].positionY]);
              points = ar;
            }
            drawQuad(editCanvas,points);
          }
        })
      }
    }
    transformQuad()
    document.getElementById('form').style.display = "block";
  }

//Perfoming transformation on the image when the form is submitted
const form = document.getElementById("resize-form");
form.onsubmit = function(e){
  e.preventDefault();
  let src = cv.imread('canvas-input');
  let dst = new cv.Mat();
  let coordinates = [...points[0],...points[1], ...points[2], ...points[3]];
  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, coordinates);
  let width1 = Math.sqrt(Math.pow(coordinates[0]-coordinates[2],2)+Math.pow(coordinates[1]-coordinates[3],2));
  let width2 = Math.sqrt(Math.pow(coordinates[4]-coordinates[6],2)+Math.pow(coordinates[5]-coordinates[7],2));
  let maxWidth = width1>width2?width1:width2;
  let height = parseInt(document.getElementById("height").value);
  let dsize = new cv.Size(maxWidth,height);
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, maxWidth-1, 0, maxWidth-1, height, 0, height]);
  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
  cv.imshow('canvas-output',dst)
  document.getElementById('output').style.display = "block";
}

//downloading the output image
var download_image = function(e){
  let canvas = document.getElementById("canvas-output");
  var image = canvas.toDataURL("image/jpg");
  e.href = image;
}

function onOpenCvReady() {
  document.getElementById('status').style.display = "none";
  document.getElementById('input').style.display  = "block"
}