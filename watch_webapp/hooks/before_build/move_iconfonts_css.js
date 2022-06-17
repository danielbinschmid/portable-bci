const { copyFile } = require('fs')
const fse = require('fs-extra')
const path = require('path')

const twoSpaces = '  ' // for log indentation
var projectRoot

module.exports = function (context) {
    console.log(`${context.hook} : ${path.relative(context.opts.projectRoot, context.scriptLocation)}`)

    projectRoot = context.opts.projectRoot
    console.log(twoSpaces + 'Project root directory: ' + projectRoot)

    mutualRoot = path.join(projectRoot, "www", "static")

    copyFolderRecursiveSync(path.join(mutualRoot, "fonts"), path.join(mutualRoot, "css", "static", "fonts"))
}
function copyFileSync( source, target ) {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fse.existsSync( target ) ) {
        if ( fse.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fse.writeFileSync(targetFile, fse.readFileSync(source));
    console.log(targetFile)
}
/**
 * 
 * @param {String} source : Must be the full path
 * @param {String} target : Must be the full path
 */
function copyFolderRecursiveSync(source, target) {
    var files = [];

    // Check if folder needs to be created or integrated
    // var targetFolder = path.join(target, path.basename(source));
    var targetFolder = target;
    if (!fse.existsSync(targetFolder)) {
        fse.mkdirSync(targetFolder, {recursive: true}, err => {});
    }

    
    // Copy
    if (fse.lstatSync(source).isDirectory()) {
        
        files = fse.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fse.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}