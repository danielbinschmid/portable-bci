import { BatchMatMul, valueAndGrad } from "@tensorflow/tfjs";


export class MITrialDatabase {
    _databaseID;
    _metadata;
    nTrials;
    _initSuccCallback;
    /** @type {FileSystemDirectoryEntry} */
    _appDirEntry;
    /** @type {FileSystemDirectoryEntry} */
    _databaseDirEntry;

    constructor(initSuccCallback, appDirEntry, databaseID = "MITrials") {
        this._appDirEntry = appDirEntry
        const vm = this;
        this._databaseID = databaseID;
        this.nTrials = -1
        this._initSuccCallback = initSuccCallback;

        this._appDirEntry.getDirectory(databaseID, { create: true }, (fileEntry) => {
            vm._databaseDirEntry = fileEntry;
            vm._init(vm)
        }, (err) => {
            console.error(err);
        })




    }

    _metadataReadCallback(result, vm) {
        if (result === "" || result === null || result === undefined) {
            vm._initMetadata(vm._init)
        } else {
            const metadata = JSON.parse(result)
            vm._metadata = metadata;
            vm._updateDatabaseProperties()
            vm._initSuccCallback()
        }
    }

    _updateDatabaseProperties() {
        this.nTrials = this._metadata.trials.length;
    }

    _writeMetadata(succCallback) {
        const vm = this;
        function upd() {
            // write new metadata
            vm._databaseDirEntry.getFile("metadata.json", { create: true, exclusive: false }, (fileEntry) => {
                const objstring = JSON.stringify(vm._metadata);
                const bytes = new TextEncoder().encode(objstring);
                const metaDataBlob = new Blob([bytes], {
                    type: "application/json;charset=utf-8"
                });
                vm._writeFile(fileEntry, metaDataBlob, succCallback);
            }, (error) => {
                console.error(error);
            });
        }

        vm._databaseDirEntry.getFile("metadata.json", { create: true, exclusive: false }, (fileEntry) => {
            /** @type {FileEntry} */
            const fileEntry_ = fileEntry
            fileEntry_.remove(upd, (err) => { console.error(err); })
        }, (err) => {
            console.error(err);
        })
    }


    _initMetadata(initSuccCallback) {
        function createMetadataJson() {
            const data = {
                id: "metadata",
                trials: []
            }
            const objstring = JSON.stringify(data);
            const bytes = new TextEncoder().encode(objstring);
            const blob = new Blob([bytes], {
                type: "application/json;charset=utf-8"
            });
            return blob
        }
        const vm = this;
        vm._databaseDirEntry.getFile("metadata.json", { create: true, exclusive: false }, (fileEntry) => {
            const metaDataBlob = createMetadataJson()
            vm._writeFile(fileEntry, metaDataBlob, initSuccCallback);
        }, (err) => {
            console.error(err);
        })
    }

    _init(vm) {
        // metadata
        vm._databaseDirEntry.getFile("metadata.json", { create: true, exclusive: false }, function (fileEntry) {
            vm._readFile(fileEntry, vm._metadataReadCallback);
        }, (error) => {
            console.error(error);
        });
    }

    getTrialIDs() {
        if (this._metadata === undefined) {
            throw "metadata not initialized"
        }
        const ids = []
        for (const trial of this._metadata.trials) {
            ids.push(trial.id);
        }
        return ids;
    }

    getTrialMetadata(id) {
        if (this._metadata === undefined) {
            throw "metadata not initialized"
        }
        const ids = []
        for (const trial of this._metadata.trials) {
            if (trial.id == id) {
                return trial;
            }
        }
        return null;
    }

    getTrial(id, succCallback) {
        const vm = this;
        const trialMetaData = this.getTrialMetadata(id)
        vm._databaseDirEntry.getFile(trialMetaData.filename, { create: false, exclusive: false }, function (fileEntry) {
            vm._readFile(fileEntry, (res, vm) => {

                const resParsed = JSON.parse(res)
                const resData = []
                for (var channelIdx = 0; channelIdx < trialMetaData.nChannels; channelIdx++) {
                    const channelData = []
                    for (var t = 0; t < trialMetaData.nTimesteps; t++) {
                        channelData.push(resParsed[channelIdx * trialMetaData.nTimesteps + t]);
                    }
                    resData.push(channelData)
                }

                const label = trialMetaData.label;
                succCallback(resData, label)
            })
        }, (error) => {
            console.error(error);
        });
    }

    /**
     * 
     * @param {number[][]} trial - of shape (nChannels, nSteps) 
     */
    trialToBlob(trial, label) {
        const allData = []
        for (var i = 0; i < trial.length; i++) {
            allData.push(...trial[i])
        }
        const objstring = JSON.stringify(allData);
        const bytes = new TextEncoder().encode(objstring);
        const blob = new Blob([bytes], {
            type: "application/json;charset=utf-8"
        });
        return blob;
    }

    createTrialMetadata(label) {
        const id = Date.now()
        const filename = id + ".json"
        return {
            id: id,
            filename: filename,
            label: label
        };
    }

    getTrials(ids, succCallback) {
        const results = []
        const labels = []
        const vm = this
        for (const id of ids) {
            this.getTrial(id, (res, label) => {
                results.push(res);
                labels.push(label);
                if (results.length == ids.length && labels.length == ids.length) {
                    succCallback(results, labels);
                }
            })
        }
    }

    /**
     * 
     * @param {number[][]} trial 
     * @param {string} label 
     */
    saveTrial(trial, label, succCallback) {
        const fileName = "default"
        const trialBlob = this.trialToBlob(trial, label)
        const vm = this;
        const trialMetaData = this.createTrialMetadata(label)
        vm._databaseDirEntry.getFile(trialMetaData.filename, { create: true, exclusive: false }, function (fileEntry) {
            vm._writeFile(fileEntry, trialBlob, (vm) => {
                vm._metadata.trials.push({
                    id: trialMetaData.id,
                    filename: trialMetaData.filename,
                    label: trialMetaData.label,
                    nChannels: trial.length,
                    nTimesteps: trial[0].length
                })
                vm._updateDatabaseProperties()
                vm._writeMetadata(succCallback)
            });
        }, (error) => {
            console.error(error);
        });

    }

    _readFile(fileEntry, readCallback) {
        const vm = this;
        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function () {
                readCallback(this.result, vm);
            };
            reader.readAsText(file);
        }, (err) => {
            console.error(err);
        });
    }


    /**
     * @param {FileEntry} fileEntry
     * @param {Blob} dataObj
     */
    _writeFile(fileEntry, dataObj, writeSuccCallback) {
        const vm = this;
        fileEntry.createWriter(function (fileWriter) {

            fileWriter.onwriteend = function () {
                writeSuccCallback(vm);
            }

            fileWriter.onerror = function (e) {
                console.error("Failed file write: " + e.toString());
            };

            fileWriter.write(dataObj);
        })
    }
}

