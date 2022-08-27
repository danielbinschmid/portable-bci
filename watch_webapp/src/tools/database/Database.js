import { MITrialDatabase } from "./MITrialDatabase"

const MI_TRIAL_DATABASE_ID = "MITrials"

/**
 * Manages the app's global database
 */
export class Database {
    _appID;
    /** @type {FileSystemDirectoryEntry} */
    _appDirEntry;
    _metadata;
    _initSuccCallback;
    _databases;
    constructor(appID = "bciMI", initSuccCallback) {
        this._databases = {}
        this._appID = appID;
        this._init()
        this._initSuccCallback = initSuccCallback;

    }


    _init() {
        const vm = this;

        window.requestFileSystem(1, 0, (fileSystem) => {
            fileSystem.root.getDirectory(vm._appID, { create: true }, (dirEntry) => {
                vm._appDirEntry = dirEntry;
                vm._initAppMetadata(vm);
            });
        }, (fileError) => {
            console.error(fileError)
        });
    }

    _updateDatabaseProperties() {
        const vm = this
        for (const entry of this._metadata.entries) {
            if (entry.type != MI_TRIAL_DATABASE_ID) {
                throw "database type not known"
            }
            const database = new MITrialDatabase(() => { }, this._appDirEntry, entry.id);
            this._databases[entry.id] = database;
        }
    }

    _initAppMetadata(vm) {
        vm._appDirEntry.getFile("metadata.json", { create: true }, (fileEntry) => {
            vm._readFile(fileEntry, (readResult, vm) => {
                if (readResult === "" || readResult === null || readResult === undefined) {
                    vm._createAppMetadata(vm._initAppMetadata)
                } else {
                    const metadata = JSON.parse(readResult)
                    vm._metadata = metadata;
                    vm._updateDatabaseProperties()
                    vm._initSuccCallback()
                }
            })
        }, (err) => {
            console.error(err);
        })
    }

    createEntry(succCallback, type = MI_TRIAL_DATABASE_ID) {
        if (type != MI_TRIAL_DATABASE_ID) {
            throw "entry type not known"
        } else {
            const entryID = "MITrials_" + Date.now()
            const database = new MITrialDatabase(() => {
                this._metadata.entries.push({
                    id: entryID,
                    foldername: entryID,
                    type: type,
                })
                this._writeMetadata(succCallback);
            }, this._appDirEntry, entryID);
            this._databases[entryID] = database;
        }
    }

    getEntryDatabase(id) {
        return this._databases[id];
    }

    getIDs(type = MI_TRIAL_DATABASE_ID) {
        const ids = []
        for (const entry of this._metadata.entries) {
            if (entry.type == MI_TRIAL_DATABASE_ID) {
                ids.push(entry.id);
            }
        }
        return ids;
    }

    _writeMetadata(succCallback) {
        const vm = this;
        function upd() {
            // write new metadata
            vm._appDirEntry.getFile("metadata.json", { create: true, exclusive: false }, (fileEntry) => {
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

        vm._appDirEntry.getFile("metadata.json", { create: true, exclusive: false }, (fileEntry) => {
            /** @type {FileEntry} */
            const fileEntry_ = fileEntry
            fileEntry_.remove(upd, (err) => { console.error(err); })
        }, (err) => {
            console.error(err);
        })
    }

    deleteEntry(id, succCallback) {
        const vm = this;
        for (const entry of vm._metadata.entries) {
            if (entry.id == id) {
                vm._appDirEntry.getDirectory(entry.foldername, { create: true, exclusive: false }, (fileEntry) => {
                    /** @type {FileEntry} */
                    const fileEntry_ = fileEntry
                    fileEntry_.remove(() => {
                        vm._metadata.entries = vm._metadata.entries.filter((val, ind, arr) => { return val.id != id })
                        vm._writeMetadata(succCallback);
                    }, (err) => { console.error(err); })
                }, (err) => {
                    console.error(err);
                })
            }
        }
        
    }

    deleteAll(succCallback) {
        const vm = this;
        this._metadata.entries = []
        this._writeMetadata(succCallback);
    }

    _createAppMetadata(createCallback) {
        function createMetadataJson() {
            const data = {
                id: "metadata",
                entries: []
            }
            const objstring = JSON.stringify(data);
            const bytes = new TextEncoder().encode(objstring);
            const blob = new Blob([bytes], {
                type: "application/json;charset=utf-8"
            });
            return blob
        }
        const vm = this;
        window.requestFileSystem(1, 0, (fileSystem) => {
            fileSystem.root.getFile(vm._appID + "/" + "metadata.json", { create: true, exclusive: false }, function (fileEntry) {
                const metaDataBlob = createMetadataJson()
                vm._writeFile(fileEntry, metaDataBlob, createCallback);
            }, (error) => {
                console.error(error);
            });
        }, (fileError) => {
            console.error(fileError)
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