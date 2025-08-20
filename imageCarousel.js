/*

Image Carousel for displaying web page images
=============================================
Created by Jörgen Damberg. Provided under the MIT license.

Usage
-------------------
Include references to this file and the CSS file in the HEAD section of your HTML, like below:

<head>
    <script type="text/javascript" src="imageCarousel.js"></script>
    <link rel="stylesheet" href="imageCarousel.css">
</head>

Then make sure to load an instance of the image carousel itself, for example by including it in window.onload, or:

<body onload="new ImageCarousel('.test-image');">

The argument string is the CSS locator for the images to include in the image carousel.

You may also include a relative path to a folder with higher resolution images so you may combine a quick display of the web page with full image resolution in the image carousel.

<body onload="new ImageCarousel('.test-image', './fullsizeimagefolder');">


------------------------------------

Copyright 2025 Jörgen Damberg

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

var imageCarouselRootZIndex = 0;
const imageCarouselSettings = {
        millisecondsUntilHidingNavigationSymbols: 2000,
        millisecondsUntilHidingImageText: 3000,
        hidingCheckIntervalInMilliseconds: 50,
        displayDownloadIcon: true,
        displayOpenImageInNewTabIcon: true,
        enableEscapeKeyToClose: true,
        enableArrowKeysForBrowsing: true,
        swipeThreshold: 100, //required min swipe distance (px) traveled to be considered swipe
        swipeAllowedTime: 200 // maximum swipe time (ms) allowed to travel that distance
};

function imageCarouselIdentifyHighestZIndex() {
    let allElements = document.querySelectorAll('*');
    for (var i = 0; i < allElements.length; i++) {
        if (allElements[i].style.zIndex > imageCarouselRootZIndex) {
            imageCarouselRootZIndex = allElements[i].style.zIndex;
        }
    }
}

class CloseIcon extends HTMLElement {

    constructor() {
        super();
    }

    connectedCallback() {
        this.style.zIndex = +imageCarouselRootZIndex + 3;
        this.innerHTML = '&times;';
        this.title = "Close image carousel overlay";
        this.id = 'image-carousel-overlay-close-marker';
        this.classList.add('image-carousel-pause-hiding');
        this.classList.add('image-carousel-hideable');
    }
}


class ViewImageOnNewTabIcon extends HTMLElement {

    static get observedAttributes() {
        return ['src'];
    }

    constructor() {
        super();
    }
    connectedCallback() {
        this.id = "image-carousel-open-image-new-tab-icon";
        this.rel = "noopener";
        this.title = "Open in new tab";
        this.innerHTML = "↗";
        this.classList.add('image-carousel-pause-hiding');
        this.classList.add('image-carousel-hideable');
        this.setAttribute('onclick', 'window.open("' + this.src + '", "new_window");');
        this.addEventListener('touchstart', function (e) {
            if (e.touches.lengt > 1) return;
            window.open(this.src, "new_window");
        }.bind(this));

    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'src') {
            let link = document.querySelector('#image-carousel-open-image-new-tab-icon');
            if (!link) return;
            this.src = newValue;
            link.setAttribute('onclick', ' window.open("' + newValue + '", "new_window");');
        }
    };

}

class DownloadIcon extends HTMLElement {

    static get observedAttributes() {
        return ['src'];
    }

    constructor() {
        super();
    }
    connectedCallback() {
        this.id = "image-carousel-download-icon";
        let a = document.createElement('a');
        a.setAttribute('download', this.fileName());
        a.setAttribute('href', this.src);
        a.innerHTML = "&dArr;";
        /*
        a.addEventListener('click', function(evt){
            if(this.getAttribute('href').contains('\\')){
                this.disabled = true;
                alert("Download doesn't work on local files, but you might try right clicking it to find a download option?");
            }
        }.bind(a));
        */
        this.appendChild(a);
        this.title = "Download image";
        this.classList.add('image-carousel-pause-hiding');
        this.classList.add('image-carousel-hideable');
    }

    fileName(){
        let parts = [];
        let forwardParts = this.src.split('/');
        for(var i = 0; i < forwardParts.length; i++){
            let backwardParts = forwardParts[i].split('\\');
            for(var y = 0; y < backwardParts.length; y++){
                parts.push(backwardParts[y]);
            }
        }
        return parts[parts.length - 1];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'src') {
            let link = document.querySelector('#image-carousel-download-icon > a');
            if (!link) return;
            this.src = newValue;
            link.setAttribute('href', this.src);
            link.setAttribute('download', this.fileName());
        }
    };

}

class Dot extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '&bull;';
    }
}

class PositionMarker extends HTMLElement {

    static get observedAttributes() {
        return ['count', 'current'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.container = document.createElement('div');
        this.container.id = "image-carousel-position-marker-container";
        this.appendChild(this.container);
    }

    set count(val) {
        this.setAttribute('count', val);
        let children = this.container.childNodes;
        for (var i = 0; i < children.length; i++) {
            children[i].parentNode.remove(children[i]);
        }
        for (var i = 0; i < val; i++) {
            let dot = document.createElement('image-carousel-position-marker-dot');
            dot.setAttribute('imageNumber', i);
            this.container.appendChild(dot);
        }
    }

    set current(val) {
        if (val >= this.count) return;
        if (val < 0) return;
        let dots = this.container.querySelectorAll('image-carousel-position-marker-dot');
        for (var i = 0; i < dots.length; i++) {
            if (dots[i].classList.contains('active'))
                dots[i].classList.remove('active');
        }
        if (dots.length > 0 && dots.length >= val)
            dots[val].classList.add('active');
    }
}

/**
 * The image in the Image Carousel that correspond to one
 * image on the image scope.
 */
class ImageCarouselImage extends HTMLElement {

    constructor() {
        super();
    }

    static get observedAttributes() { //Immutable. No listeners.
        return ['src', 'text', 'order', 'originalSrc'];
    }

    connectedCallback() {
        this.id = 'image-carousel-image-container' + this.order;
        this.image = document.createElement('img');
        this.image.src = this.src;
        this.image.classList.add('image-carousel-image');
        this.image.id = "image-carousel-image" + this.order;
        this.image.alt = "Image carousel image " + this.order;
        this.image.setAttribute('originalSrc', this.originalSrc);
        this.image.setAttribute('onerror', 'this.setAttribute("src", this.getAttribute("originalSrc"));');
        this.image.addEventListener('click', function () {
            if (this.classList.contains('fullsize')) {
                this.classList.remove('fullsize');
            } else {
                this.classList.add('fullsize');
            }

            //Hide navigation symbols
            let elems = document.querySelectorAll('.image-carousel-hideable');
            for (var i = 0; i < elems.length; i++) {
                elems[i].style.opacity = '0';
            }

        }.bind(this.image));

        if (this.text && this.text.length > 0) {
            let textPlaceholder = document.createElement('div');
            textPlaceholder.classList.add('image-carouse-image-text-container');
            let text = document.createElement('span');
            text.style.zIndex = imageCarouselRootZIndex + 2;
            text.classList.add('image-carousel-image-text');

            text.addEventListener('click', function (evt) {
                //Close text if text is clicked
                if (this.style.display == 'block') {
                    this.style.display = 'none';
                    evt.stopPropagation();
                }
            }.bind(text));

            text.id = 'image-carousel-image-text' + this.order;
            text.style.zIndex = +this.topZLevel + 2;
            text.innerHTML = this.text;
            textPlaceholder.appendChild(text)
            this.appendChild(textPlaceholder);

        }

        this.appendChild(this.image);
    }

    revertToOriginalSrc(){
        console.log('Image ' + this.image.getAttribute('src') + ' not found. Reverting to ' + this.image.getAttribute('originalSrc') + '.');
        this.image.setAttribute('src', this.image.getAttribute('originalSrc'));
    }
}

class ImageCarousel {
    constructor(cssLocator, relativePathFullSizeImageFolder) {

        //Initiating internal variables
        this.currentImageNumber = 0;            //default
        this.pauseHidingElements = false;       //Controlling if tick counts below should be paused
        this.hideTextElementTicks = 0;          //For determining when to hide image text
        this.hideElementTicks = 0;              //For determining when to hide elements
        this.activeTimeouts = [];               //Array of navigation symbols timeouts until fade (needed for navigation before timeouts end)
        this.textTimeout = {};                  //Image text timeout reference for timeout clearance upon navigation before timeout end 
        imageCarouselIdentifyHighestZIndex();   //Scans page for highest Z number and use one Z-level higher

        //Create image carousel overlay
        if (!relativePathFullSizeImageFolder.endsWith('/')) relativePathFullSizeImageFolder += "/";
        let originalImages = document.querySelectorAll(cssLocator);
        this.imageCount = originalImages.length;
        let carouselOverlay = document.createElement('div');
        carouselOverlay.id = "image-carousel-overlay";
        carouselOverlay.style.zIndex = +imageCarouselRootZIndex + 1;

        let closeMarkerContainer = document.createElement('div');
        closeMarkerContainer.classList.add('image-carousel-hideable');
        let innerContainer = document.createElement('div');
        innerContainer.id = 'image-carousel-top-icon-container';
        closeMarkerContainer.id = "image-carousel-top-central-button-container";
        closeMarkerContainer.style.zIndex = +imageCarouselRootZIndex + 2;

        let closeMarker = document.createElement('image-carousel-close-icon');
        closeMarker.style.zIndex = +imageCarouselRootZIndex + 3;
        closeMarker.addEventListener('click', function (evt) {
            this.closeOverlay();
            evt.stopPropagation();
        }.bind(this));

        closeMarker.addEventListener('touchstart', function (e) {
            if (e.touches.lengt > 1) return;
            e.stopPropagation();
            this.closeOverlay();
        }.bind(this));

        innerContainer.appendChild(closeMarker);

        if(imageCarouselSettings.displayDownloadIcon){
            this.downloadIcon = document.createElement('image-carousel-download-icon');
            this.downloadIcon.style.zIndex = +imageCarouselRootZIndex + 3;
            this.downloadIcon.src = originalImages[0].src;
            innerContainer.appendChild(this.downloadIcon);
        }

        if(imageCarouselSettings.displayOpenImageInNewTabIcon){
            this.newTabIcon = document.createElement('image-carousel-new-tab-icon');
            this.newTabIcon.style.zIndex = +imageCarouselRootZIndex + 3;
            this.newTabIcon.src = originalImages[0].src;
            innerContainer.appendChild(this.newTabIcon);
        }

        closeMarkerContainer.appendChild(innerContainer);
        carouselOverlay.appendChild(closeMarkerContainer);

        let leftBrowser = document.createElement('span');
        leftBrowser.style.zIndex = +imageCarouselRootZIndex + 2;
        leftBrowser.innerHTML = '&lt;';
        leftBrowser.title = 'Previous image';
        leftBrowser.id = 'image-overlay-previous-image-symbol';
        leftBrowser.classList.add('image-carousel-browse-symbol');
        leftBrowser.classList.add('image-carousel-hideable');
        leftBrowser.classList.add('image-carousel-pause-hiding');
        leftBrowser.style.left = '0px';
        leftBrowser.addEventListener('touchstart', function (e) {
            if (e.touches.lengt > 1) return;
            this.previousImage();
        }.bind(this));
        leftBrowser.addEventListener('click', function (evt) {
            evt.stopPropagation();
            this.previousImage();
        }.bind(this));
        carouselOverlay.appendChild(leftBrowser);

        let rightBrowser = document.createElement('span');
        rightBrowser.id = 'image-overlay-next-image-symbol';
        rightBrowser.title = 'Next image';
        rightBrowser.style.zIndex = +imageCarouselRootZIndex + 2;
        rightBrowser.classList.add('image-carousel-browse-symbol');
        rightBrowser.classList.add('image-carousel-hideable');
        rightBrowser.classList.add('image-carousel-pause-hiding');
        rightBrowser.innerHTML = '&gt;';
        rightBrowser.style.right = '0px';
        rightBrowser.addEventListener('touchstart', function (e) {
            if (e.touches.lengt > 1) return;
            this.nextImage();
        }.bind(this));
        rightBrowser.addEventListener('click', function (evt) {
            evt.stopPropagation();
            this.nextImage();
        }.bind(this));
        carouselOverlay.appendChild(rightBrowser);

        for (var i = 0; i < originalImages.length; i++) {
            originalImages[i].addEventListener('click', function (evt) {
                document.querySelector('#image-carousel-overlay').style.visibility = 'visible';
                this.currentImageNumber = evt.target.getAttribute('carouselnumber');
                this.displayImage();
                window.scrollTo(0, 0);
            }.bind(this));
            originalImages[i].classList.add('image-carousel-cursor-pointer');
            originalImages[i].setAttribute('carouselnumber', i);
            let overlayImage = document.createElement('image-carousel-image');
            overlayImage.originalSrc = originalImages[i].src;
            overlayImage.order = i;
            if (relativePathFullSizeImageFolder) {
                let imageName = originalImages[i].src.split('\\').pop().split('/').pop();
                overlayImage.src = relativePathFullSizeImageFolder + imageName;
            } else {
                overlayImage.src = originalImages[i].src;
            }
            overlayImage.text = originalImages[i].alt;
            overlayImage.addEventListener('click', function () {
                this.displayNavigationSymbols();
                let imgTxt = document.querySelector('#image-carousel-image-text' + this.currentImageNumber)
                if(imgTxt) imgTxt.style.display = 'block';
            }.bind(this));
            carouselOverlay.appendChild(overlayImage);
        }
        document.body.appendChild(carouselOverlay);
        document.onkeydown = function (evt) {
            evt = evt || window.event;
            if (evt.keyCode == 27 && imageCarouselSettings.enableEscapeKeyToClose) {
                let fullsizeImage = document.querySelectorAll('image-carousel-image img.fullsize'); //Close full size image if exist
                if (fullsizeImage.length > 0) {
                    for (var i = 0; i < fullsizeImage.length; i++) {
                        fullsizeImage[i].classList.remove('fullsize');
                    }
                    return;
                }
                this.closeOverlay();
            } else if (evt.keyCode == 37 && imageCarouselSettings.enableArrowKeysForBrowsing) {
                this.previousImage();
            } else if (evt.keyCode == 39 && imageCarouselSettings.enableArrowKeysForBrowsing) {
                this.nextImage();
            }
        }.bind(this);
        let hideableElements = document.querySelectorAll('.image-carousel-hideable');
        for (var i = 0; i < hideableElements.length; i++) {
            hideableElements[i].addEventListener('mouseover', function () {
                this.displayNavigationSymbols();
            }.bind(this));
        }
        window.addEventListener("resize", function () {
            this.arrangeElements();
        }.bind(this));

        this.positionMarker = document.createElement('image-carousel-position-marker');
        this.positionMarker.classList.add('image-carousel-hideable');
        this.positionMarker.classList.add('image-carousel-pause-hiding');
        carouselOverlay.appendChild(this.positionMarker);
        this.positionMarker.count = +originalImages.length;
        this.positionMarker.current = 0;
        this.initializePositionDots();

        //Swipe functionality
        this.scaling = false;
        this.swipeStartX;
        this.swipeStartY;
        this.touchStartElementType;
        this.swipeDistance;
        this.swipeElapsedTime;
        this.swipeStartTime;
        carouselOverlay.addEventListener('touchstart', function (e) {
            var touchobj = e.changedTouches[0];
            this.swipeStartX = touchobj.pageX;
            this.swipeStartY = touchobj.pageY;
            this.touchStartElement = e.target;
            this.swipeStartTime = new Date().getTime(); // record time when finger first makes contact with surface
            e.preventDefault();
        }.bind(this), false);

        carouselOverlay.addEventListener('touchmove', function (e) {
            e.preventDefault(); // prevent swipe scrolling 
        }, false);

        carouselOverlay.addEventListener('touchend', function (e) {
            var touchobj = e.changedTouches[0];
            if (this.touchStartElement.tagName == 'image-carousel-position-marker-dot') return;

            //Close any open fullsize image if exist
            if (this.touchStartElement.parentNode.querySelector('.fullsize') != null) {
                this.touchStartElement.parentNode.querySelector('.fullsize').classList.remove('fullsize');
                this.displayNavigationSymbols();
                document.querySelector('#image-carousel-image-text' + this.currentImageNumber).style.display = 'block';
                this.hideTextElementTicks = 0; 
                e.stopPropagation();
                return;
            }

            var dist = touchobj.pageX - this.swipeStartX; // get total dist traveled by finger while in contact with surface
            var elapsedTime = new Date().getTime() - this.swipeStartTime;
            if (elapsedTime > imageCarouselSettings.swipeAllowedTime) return; //Swipe to slow
            if (Math.abs(touchobj.pageY - this.swipeStartY) < Math.abs(dist / 2) && Math.abs(dist) >= imageCarouselSettings.swipeThreshold) {  //Horizontal swipe
                if (dist >= 1) {
                    this.previousImage();
                } else {
                    this.nextImage();
                }
            } else if (Math.abs(touchobj.pageY - this.swipeStartY) > Math.abs(dist * 2) && Math.abs(touchobj.pageY - this.swipeStartY) >= imageCarouselSettings.swipeThreshold) { // Close overlay if clearly swiping up or down or Close full size image if exist
                let fullsizeImage = document.querySelectorAll('image-carousel-image img.fullsize'); 
                if (fullsizeImage.length > 0) {
                    for (var i = 0; i < fullsizeImage.length; i++) {
                        fullsizeImage[i].classList.remove('fullsize');
                    }
                    return;
                }
                this.closeOverlay();
            } else if (Math.abs(dist) < imageCarouselSettings.swipeThreshold && Math.abs(touchobj.pageY - this.swipeStartY) < imageCarouselSettings.swipeThreshold) { 
                if (this.touchStartElement.classList.contains('image-carousel-image')) {
                    if (this.touchStartElement.classList.contains('fullsize')) {
                        this.touchStartElement.classList.remove('fullsize');
                        this.displayNavigationSymbols();
                        document.querySelector('#image-carousel-image-text' + this.currentImageNumber).style.display = 'block';
                        this.hideTextElementTicks = 0;
                    } else {
                        this.touchStartElement.classList.add('fullsize');
                    }
                    e.stopPropagation();
                }

                //e.target.dispatchEvent(new Event('click'));
            }
            e.preventDefault();
        }.bind(this), false);

        //Prevent hiding of elements when mouse is over elements that would hide
        let elementsPausingSymbolsHiding = document.querySelectorAll('.image-carousel-pause-hiding');
        for (var i = 0; i < elementsPausingSymbolsHiding.length; i++) {
            elementsPausingSymbolsHiding[i].addEventListener('mouseover', function () {
                this.pauseHidingElements = true;
                this.hideElementTicks = 0;
            }.bind(this));
            elementsPausingSymbolsHiding[i].addEventListener('mouseout', function () {
                this.pauseHidingElements = false;
                this.hideElementTicks = 0;
            }.bind(this));
        }

        let imageTexts = document.querySelectorAll('.image-carousel-image-text');
        for (var i = 0; i < imageTexts.length; i++) {
            imageTexts[i].addEventListener('mouseover', function () {
                this.pauseHidingImageText = true;
                this.hideTextElementTicks = 0;
            }.bind(this));
            imageTexts[i].addEventListener('mouseout', function () {
                this.pauseHidingImageText = false;
                this.hideTextElementTicks = 0;
            }.bind(this));
        }

        setInterval(function () {
            if (!this.pauseHidingElements) {
                if (this.hideElementTicks < imageCarouselSettings.millisecondsUntilHidingNavigationSymbols) {
                    this.hideElementTicks = +this.hideElementTicks + imageCarouselSettings.hidingCheckIntervalInMilliseconds;
                    return;
                } else {
                    this.hideNavigationSymbol();
                    this.hideElementTicks = 0;
                }
            }
            if (!this.pauseHidingTextElements) {
                if (this.hideTextElementTicks < imageCarouselSettings.millisecondsUntilHidingImageText) {
                    this.hideTextElementTicks = +this.hideTextElementTicks + +imageCarouselSettings.millisecondsUntilHidingImageText;
                    return;
                } else {
                    let img = document.querySelector('#image-carousel-image-text' + this.currentImageNumber);
                    if (!img) return;
                    img.style.display = 'none';
                    this.hideTextElementTicks = 0;
                }
            }
        }.bind(this), imageCarouselSettings.hidingCheckIntervalInMilliseconds);
        window.addEventListener('popstate', () => {
            this.closeOverlay();
        });
    }

    hideNavigationSymbol() {
        let elems = document.querySelectorAll('.image-carousel-hideable');
        for (var i = 0; i < elems.length; i++) {
            elems[i].style.opacity = '0';
        }
    }

    displayNavigationSymbols() {
        let elems = document.querySelectorAll('.image-carousel-hideable');
        for (var i = 0; i < elems.length; i++) {
            elems[i].style.opacity = '1';
        }

        let imgTxt = document.querySelector('#image-carousel-image-text' + this.currentImageNumber);
        if(imgTxt) imgTxt.style.display = 'block';

        this.hideElementTicks = 0;
    }

    initializePositionDots() {
        let dots = this.positionMarker.querySelectorAll('image-carousel-position-marker-dot');
        for (var i = 0; i < dots.length; i++) {
            dots[i].addEventListener('click', function (evt) {
                if (evt.target.hasAttribute('imageNumber')) {
                    this.currentImageNumber = evt.target.getAttribute('imageNumber');
                    this.displayImage();
                }
                evt.stopPropagation();
            }.bind(this));
            dots[i].addEventListener('touchstart', function (e) {
                if (e.touches.lengt > 1) return;
                if (e.target.hasAttribute('imageNumber')) {
                    this.currentImageNumber = e.target.getAttribute('imageNumber');
                    this.displayImage();
                }
                e.stopPropagation();
            }.bind(this));

        }
    }

    previousImage() {
        document.querySelector('#image-overlay-previous-image-symbol').style.opacity = '1';
        setTimeout(function () {
            document.querySelector('#image-overlay-previous-image-symbol').style.opacity = '0.5';
        }, 300);
        this.currentImageNumber--;
        if (this.currentImageNumber < 0)
            this.currentImageNumber = this.imageCount - 1;
        this.displayImage();
    }

    nextImage() {
        document.querySelector('#image-overlay-next-image-symbol').style.opacity = '1';
        setTimeout(function () {
            document.querySelector('#image-overlay-next-image-symbol').style.opacity = '0.5';
        }, 300);
        this.currentImageNumber++;
        if (this.currentImageNumber >= this.imageCount)
            this.currentImageNumber = 0;
        this.displayImage();
    }

    closeOverlay() {
        if (history.state && history.state.fullscreenOpen) {
            history.back();
        }
        document.querySelector('#image-carousel-overlay-close-marker').style.opacity = '1';
        setTimeout(function () {
            document.querySelector('#image-carousel-overlay-close-marker').style.opacity = '0.5';
        }, 300);
        document.querySelector('#image-carousel-overlay').style.visibility = 'hidden';
    }

    arrangeElements() { //To enable device rotation variations or window resizing
        //this.closeMarker.style.left = "50%";
        //this.closeMarker.style.left = (+this.closeMarker.getBoundingClientRect().left - +(this.closeMarker.getBoundingClientRect().width / 2)) + "px";
    }

    displayImage() {
        if (history.state && history.state.fullscreenOpen) {
            //console.log('Overlay already displayed')
        } else {
            history.pushState({ fullscreenOpen: true }, '');
        }

        //Re-set any image that has been clicked to display in full-size
        let fullscreenImages = document.querySelector('#image-carousel-overlay').querySelectorAll('.fullsize');
        for (var i = 0; i < fullscreenImages.length; i++) {
            fullscreenImages[i].classList.remove('fullsize');
        }

        //Set correct active image position
        let carouselImages = document.querySelectorAll('image-carousel-image');
        this.positionMarker.current = this.currentImageNumber;
        for (var y = 0; y < carouselImages.length; y++) {
            carouselImages[y].style.display = 'none';
        }

        //Display image and text
        let image = document.querySelector('#image-carousel-image-container' + this.currentImageNumber);
        if(image) image.style.display = 'block';

        let imgTxt = document.querySelector('#image-carousel-image-text' + this.currentImageNumber);
        if(imgTxt) imgTxt.style.display = 'block';
        this.hideTextElementTicks = 0;

        if(this.downloadIcon)
            this.downloadIcon.setAttribute('src', image.querySelector('img').getAttribute('src'));

        if(this.newTabIcon)
            this.newTabIcon.setAttribute('src', image.querySelector('img').getAttribute('src'));

        this.displayNavigationSymbols();
        this.arrangeElements();
    }
}

customElements.define('image-carousel-position-marker-dot', Dot);
customElements.define('image-carousel-position-marker', PositionMarker);
customElements.define('image-carousel-image', ImageCarouselImage);
customElements.define('image-carousel-download-icon', DownloadIcon);
customElements.define('image-carousel-close-icon', CloseIcon);
customElements.define('image-carousel-new-tab-icon', ViewImageOnNewTabIcon);
