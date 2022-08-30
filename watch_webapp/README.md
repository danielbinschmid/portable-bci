# starhciwearable

> A Vue Cordova App which can be deployed on a SmartWatch and Android-Phone to control and stream data from wearable EEG devices

The application is written in javascript and NodeJs. It is an "offline" web-application, which can be embedded 
into mobile devices. 
For embedding the app into mobile devices, Cordova is used because it features a plugin that allows deployment on 
the Smartwatch.
During development of the UI, it is not needed to debug on the Smartwatch. The UI can be developed like any other 
web-application in the browser.
For debugging of functionalities which access 
the Smartwatch's native functions such as Bluetooth or memory, Cordova tools must be used.

## Deployment
The deployment is done in two steps:
- Step 1: Export the web-application into a bundled website. The exported bundled website is located in the www/ subfolder. The website can also be opened by opening the index.html. 
- Step 2: Embed the export web-application into a mobile-executable (.apk for Android). The mobile-executable can then be installed on mobile devices

### Web-application commands
Developing and exporting the web-application can be done with following commands:

``` bash
# install dependencies
yarn

# serve with hot reload at localhost:8080
yarn dev

# build for production with minification
yarn build

# build for production and view the bundle analyzer report
yarn build --report
```

### Cordova commands
``` bash
# build application for android
cordova build android

# install application on android device
cordova run android
```

### References

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader). Cordova crosswalk webview plugin can be found [here](https://github.com/ardabeyazoglu/cordova-plugin-crosswalk-webview-v3)  

## Folder structure
The src/ folder contains the source code of the application. Relevant subfolders are:
```
- components
- data
- tools
```
The `component` subfolder contains the Vue application. The `tools` subfolder contains all business logic, neural 
networks, database management, digital signal processing code, hyperdimensional computing models and more. The Vue 
application in the `component` subfolder uses the scripts and tools in `tools`. `data` contains constant, 
UI constraints, and enums.

### Vue application
The Vue application can be found in the `src/components` subfolder. The `src/components/ui-comps` folder 
contains UI design components. The UI design components do not contain any application logic.
The `src/components/startpage` folder contains the application logic for the Motor Imagery functionalities,
the `src/components/muse-components` for establishing a connection with the Muse, and `src/components/visualization`
visualization functions. Refer to [Vue](https://vuejs.org/) and [Vuetify](https://vuetifyjs.com/en/) for behind-the-hood
explanations.

### Tools
- `src/components/riemann`
- `src/components/scripts`
- `src/components/hdc`
- `src/components/evaluation`
- `src/components/eegnet`
- `src/components/database`
- `src/components/data_utils`
- `src/components/ble`

## From scratch
This subsection provides details about how to create the project from scratch. If a new project is started from scratch,
it is advised to use the [Quasar framework](https://quasar.dev/) instead of following this tutorial.

First, install cordova and @vue/cli globally via npm. Second, run `cordova create $proj_name$`. Then, install a Vue webpack `vue init webpack $proj_name$`
project into the same folder via `vue install webpack $proj_name$`. Next, `cd` into the project folder and add the android 
platform using `cordova platform add android@8.0.0`. 
Next, delete all content in the www folder. Then, change the target build folder of Vue to the www folder by 
configuring `config/index.js` in the build section with
```
index: path.resolve(__dirname, '../www/index.html'),
assetsRoot: path.resolve(__dirname, '../www'),
assetsSubDirectory: 'static',
assetsPublicPath: '',
```
Also, set assetsPublicPath: '', in the dev section. Next, copy paste
```
<head>
    <meta charset="utf-8">
    <meta name="format-detection" content="telephone=no">
    <meta name="msapplication-tap-highlight" content="no">
    <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *; img-src 'self' data: content:; connect-src 'self' ws:;">
    <title>starhciwearable</title>
    <script src="cordova.js"></script>
  </head>
```
into the index.html folder. Next, before building for the first time, install the crosswalk plugin via `cordova plugin add https://github.com/wingzx3/cordova-plugin-crosswalk-webview-v3` and modify gradle.properties and the config.xml by adding cdvMinSdkVersion=26 and 
```
<platform name="android">
        <preference name="android-minSdkVersion" value="26" />
        <preference name="xwalkMultipleApk" value="false" />
    </platform>
```
as described [here](https://github.com/ardabeyazoglu/cordova-plugin-crosswalk-webview-v3)  .


## Webworker
Machine learning inference and training currently blocks the UI thread. This happens because Webgl is used to accelerate 
the networks, which can not be ported to a webworker. Sources about moving webgl to a webworker are 
https://github.com/ai/offscreen-canvas , and https://github.com/tensorflow/tfjs/issues/5045

## Screenshots and videos
adb shell screenrecord /sdcard/example.mp4
#Create a temporary folder to save a screenshot.
mkdir tmp
#Capture a screenshot and save to /sdcard/screen.png on your Android divice.
adb shell screencap -p /sdcard/screen.png

#Grab the screenshot from /sdcard/screen.png to /tmp/screen.png on your PC.
adb pull /sdcard/screen.png /tmp/screen.png

#Delete /sdcard/screen.png
adb shell rm /sdcard/screen.png

#open the screenshot on your PC. 
open /tmp/screen.png

move webgl to webworker sources: 
