# Image Carousel - a web page image viewer component

Free image carousel stand-alone plain javascript library for use on any web site.

## What's this?

This is a plain javascript library that uses a CSS locator expression to identify images on a web page. After the regular page is loaded the CSS locator is used to identify images that are then arranged in an image carousel component, so when any of the images are clicked they open in a browsable and zoomable mode in the image carousel component that's been automatically added to the page in the background.

## Try it out

Try it out here: [https://damberg.one](https://damberg.one/alster/private/crafts/image-carousel/](https://damberg.one/alster/private/crafts/image-carousel/index.html)

## Features

Current features include:

### User friendly

* The displayed image should be shown as large as possible, filling the viewport either horizontally or vertically depending on what's best for size.
* Images caption is shown briefly in the center over image.
* Back navigation close overlay (since it was an annoyance on mobile devices).
* Navigation buttons:
    - Previous image
    - Next image
    - Close overlay
    - Open current image in new tab
    - Download current image icon
    - Hiding symbols and text after a short delay for full view of image
    - Re-displaying the navigation symbols and text upon interaction
* Swiping enabled:
    - Touching image view it fullscreen in image carousel
    - Touching image in image carousel toggles full size view and full screen view
    - Swipe left: Next image
    - Swipe right: Previous image
    - Swipe up or down: Close full size image view if exist, or else close image carousel
    - Touching image text hide it
    - Touching the screen rather than swiping will awaken any sleeping image texts and navigation symbols.
* Mouse use enabled:
    - Clicking page image view it fullscreen in image carousel
    - Clicking image in image carousel toggles full size view and full screen view
    - Hovering image text or navigation symbols pauses their disappearance
    - Clicking image text hides it
* Keyboard use enabled:
    - Escape key: Closes image caraousel
    - Left arrow key: Previous image
    - Right arrow key: Next image
* Position markers
    - Each image is represented by a clickable bullet row on screen
    - Clickable position bullets for displaying image count and active image

### Programatic ease of use
* The image carousel should be a stand-alone Javascript class library and a CSS file.
* Usage is initiated with a single image CSS locator expression as constructor parameter to enable ease of use on any web page.
* Included images alt text is used as image text if they exist.
* Providing an optional argument to full size image folder path will show full size images in image carousel.
* Including the relative path to a folder with higher resolution images enables a low resolution image page for quick rendering of the web page with full image resolution in the image carousel.

### Stability and robustness

* Browser window resizing re-positions close symbol and image text.
* Non-existing alt-texts for images are supressed.
* No full size image resort to using original image URL.

### Customization

* Optional high resolution folder for using images of higher resolution than on original page for the image carousel
* Settings to tweak component behavior:
    - If download icon is enabled or not
    - If icon for open image in new tab is enabled or not
    - Setting touch distances for swipe effect rather than touch effect

## Licensing

This is available under the [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0), in simple terms meaning you are free to use it and modify it, but not re-sell it or sue the creator.

## Usage

Include both the following files:

imageCarousel.js (Javascript class file for all functionality)   
imageCarousel.css (visual style instructions)

Include references to this file and the CSS file in the HEAD section of your HTML, like below:

    <head>
    
        <script type="text/javascript" src="imageCarousel.js"></script>
        <link rel="stylesheet" href="imageCarousel.css">
    
        <script> 
            window.addEventListener("load", (event) => {
                new ImageCarousel('.test-image', 'fullsize'); 
            });
        </script> 
    
    </head>

The argument string is the CSS locator for identifying the images to include in the image carousel.

If you want the image carousel to display full size images of the thumbnails on the actual page you may also include a path to full size images.

    new ImageCarousel('.image-for-carousel', './fullsizeimages/');

___________

## Tweaking the behaviour of the image carousel
The currently available settings in the object imageCarouselSettings, and their default values are:


|Field name|Default value|Description|
|----------|-------------|-----------|
|imageCarouselSettings.millisecondsUntilHidingNavigationSymbols|2000|Delay (ms) until navigation elements are hidden|
|imageCarouselSettings.millisecondsUntilHidingImageText|3000|Delay (ms) until image text is hidden|
|imageCarouselSettings.hidingCheckIntervalInMilliseconds|50|Delay (ms) between checks for potentially hiding elements|
|imageCarouselSettings.displayDownloadIcon|true|Icon inclusion for download current image icon|
|imageCarouselSettings.displayOpenImageInNewTabIcon|true|Icon inclusion for open current image in new tab icon|
|imageCarouselSettings.enableEscapeKeyToClose|true|Key control for closing image overlay with escape key. Set to false if conflicting with other key listeners on your page.|
|imageCarouselSettings.enableArrowKeysForBrowsing|true|Key control for browing images with arrow keys. Set to false if conflicting with other key listeners on your page.|

Tweaking the behaviour could be done by altering the code, or by using the imageCarouselSettings object.

Altering these parameters must be done BEFORE instantiation of the image carousel for them to have effect due to the nature of the lazy image loading.

Example:

    <head>
    
        <script type="text/javascript" src="imageCarousel.js"></script>
        <link rel="stylesheet" href="imageCarousel.css">
    
        <script> 
    
            imageCarouselSettings.displayDownloadIcon = false;
            imageCarouselSettings.displayOpenImageInNewTabIcon = false;
        
            window.addEventListener("load", (event) => {
                new ImageCarousel('img', 'fullsize-images-folder');
            });
    
        </script> 
    
    </head>
