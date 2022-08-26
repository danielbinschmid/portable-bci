# starhciwearable

> A Vue Cordova App which can be deployed on a SmartWatch and Android-Phone to control and stream data from wearable EEG devices

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader). Cordova crosswalk webview plugin can be found [here](https://github.com/ardabeyazoglu/cordova-plugin-crosswalk-webview-v3)  

## How to install
First, install cordova and @vue/cli globally via npm. Second, run cordova create proj name. Then, install a Vue webpack `vue init webpack project-name`
project into the same folder via vue install webpack proj name. Next, cd into the project folder and add the android 
platform using cordova platform add android@8.0.0. The version here is important for compatibility with the crosswalk plugin. 
Next, delete all content in the www folder. Then, change the target build folder of Vue to the www folder, that is 
configuring config/index.js with the content in the build section
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
into the index.html folder. Next, before building for the first time, install the crosswalk plugin via cordova plugin add cordova-crosswalk-webview-v3 and modify gradle.properties and the config.xml by adding cdvMinSdkVersion=26 and 
```
<platform name="android">
        <preference name="android-minSdkVersion" value="26" />
        <preference name="xwalkMultipleApk" value="false" />
    </platform>
```
as described on the crosswalk webview v3 github.

Then yarn build, yarn dev to hot-reload debug the UI, cordova build android and cordova run android

## TODOs
Minify files to reduce bundle size:
https://gist.github.com/jfoclpf/5be2694f47327ce7969c7b4dc942b528

```s
adb logcat -s chromium 
```
for logging

```s
cordova plugin add https://github.com/wingzx3/cordova-plugin-crosswalk-webview-v3
```
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

