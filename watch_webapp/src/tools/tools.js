export function webgl_detect(return_context) {
    if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
            names = [
                "webgl2",
                "experimental-webgl2",
                "webgl",
                
                "moz-webgl",
                "webkit-3d",
            ],
            context = false;

        for (var i = 0; i < names.length; i++) {
            try {
                context = canvas.getContext(names[i]);
                if (
                    context &&
                    typeof context.getParameter == "function"
                ) {
                    // WebGL is enabled
                    if (return_context) {
                        // return WebGL object if the function's argument is present
                        return { name: names[i], gl: context };
                    }
                    // else, return just true
                    return true;
                }
            } catch (e) {}
        }

        // WebGL is supported, but disabled
        return false;
    }

    // WebGL not supported
    return false;
}

export function getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);

    return raw ? parseInt(raw[2], 10) : false;
}