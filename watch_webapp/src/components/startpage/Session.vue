<template>
    <div id="session">
        <!-- <ble-view /> -->

        <overlay-back-button bottomPadding @exit="exit()" withText> {{name}} </overlay-back-button>
        <v-list-item>
            <v-list-item-content>
                <div
                    class="mdc-typography-styles-overline"
                    :style="{
                        color: isFinetuned ? layout.GREEN : layout.ORANGE,
                    }"
                >
                    {{ isFinetuned ? "- FINETUNED" : "- UNUSED" }}
                </div>
                <div
                    class="mdc-typography-styles-overline"
                    :style="{ color: layout.GREY }"
                >
                    {{ "- # TRIALS: " + nTrials }}
                </div>
            </v-list-item-content>
        </v-list-item>

        <simple-button @click="openDatabase = true" x_large :disabled="isFinetuning">
            DATABASE
        </simple-button>

        <simple-button @click="startRecordNew()" x_large :disabled="isFinetuning">
            RECORD NEW
        </simple-button>

        <div v-if="isFinetuning">
            <v-list-item>
                <v-list-item-content>
                    <div class="texttop" :style="{ color: layout.ORANGE }">
                        {{ "FINETUNING .." }}
                    </div>
                    <v-progress-linear
                        :buffer-value="finetuneProgress"
                        stream
                        :color="layout.ORANGE"
                    />
                    <simple-button
                        @click="cancelFinetuning()"
                        large
                        bottomPadding
                        :color="layout.ORANGE"
                    >
                        CANCEL
                    </simple-button>
                </v-list-item-content>
            </v-list-item>
        </div>

        <div v-else>
            <simple-button @click="startFinetuning()" x_large bottomPadding :disabled="isFinetuned">
                FINETUNE
            </simple-button>
        </div>

        <bottom-padding />

        <v-dialog v-model="recordNew" fullscreen>
            <v-card :color="'rgba(236, 239, 241, 0.95)'">
                <record-new @exit="exitRecordNew()" @newTrial="newTrial" :museDevInfo="museDevInfo"/>
            </v-card>
        </v-dialog>

        <v-dialog v-model="openDatabase" fullscreen>
            <v-card :color="'rgba(236, 239, 241, 0.95)'">
                <session-database @exit="openDatabase = false" :database="database" :sync="sync"/>
                <bottom-padding />
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import Vue from "vue";
import BottomPadding from "@/components/ui-comps/BottomPadding.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import RecordNew from "@/components/startpage/session/RecordNew.vue";
import { EEG_FREQUENCY } from "@/data/constants";
import { EEGNet} from "@/tools/eegnet/load";
import { resample2ndDim, slice2ndDim, maxIdx} from "@/tools/data_utils/array_utils"
import { MITrialDatabase} from "@/tools/database/MITrialDatabase";
import SessionDatabase from "@/components/startpage/session/SessionDatabase.vue";
import * as tf from '@tensorflow/tfjs';
export default {
    components: { OverlayBackButton, SimpleButton, RecordNew, SessionDatabase, BottomPadding },
    name: "Session",
    data() {
        return {
            curEpoch: 0,
            nEpochs: 12,
            layout: window.layout,
            finetuneProgress: 0,
            interval: {},
            isFinetuning: false,
            recordNew: false,
            openDatabase: false,
            isFinetuned: false,
            nTrials: -1,
            sync: false,
            logs: [],
        };
    },
    props: {
        name: "default",
        isCurrentFinetuned: Boolean,
        museDevInfo: undefined,
        database: MITrialDatabase
    },
    watch: {
        isCurrentFinetuned(neww, old) {
            this.isFinetuned = neww;
        }
    },
    mounted() {
        this.databaseInitCallback()
    },
    methods: {
        databaseInitCallback() {
            this.nTrials = this.database.nTrials;
            this.sync = !this.sync
        },
        exit() {
            this.$emit("exit");
        },
        startRecordNew() {
            this.recordNew = true;
        },
        exitRecordNew() {
            this.recordNew = false;
        },
        newTrial(timeseries, labelIdx) {
            this.isFinetuned = false;

            this.database.saveTrial(timeseries, labelIdx, this.databaseInitCallback)
            this.$emit("forgetFinetune");
        },
        /**
         * onTrainBegin(logs)`: called when training starts.
        *   - `onTrainEnd(logs)`: called when training ends.
        *   - `onEpochBegin(epoch, logs)`: called at the start of every epoch.
         */
        onTrainBegin(logs) {
            this.curEpoch = 0
            this.finetuneProgress = 0
        },
        onEpoch(epoch, logs) {
            this.curEpoch += 1;
            this.finetuneProgress = Math.floor((this.curEpoch * 100) / this.nEpochs);
        },
        async finetune(X_, Y_, ids) {
            
            for (const id of ids) {
                if (X_[id] === undefined || Y_[id] === undefined) {
                    return null;
                }
            }
            const X__ = []
            const Y__ = []
            for (const id of ids) {
                X__.push(X_[id])
                Y__.push(Y_[id])
            }

            /** @type {EEGNet} */
            const eegnet = window.eegnet
            const [X, Y] = eegnet.uploadAsBatch(X__, Y__)
            console.log("finetuning with backend: " + tf.getBackend())
            
            eegnet.finetune(X, Y, this.nEpochs, this.onTrainBegin, this.onTrainEnd, this.onEpoch)
        },
        async startFinetuning() {
            this.isFinetuning = true;
            const ids = this.database.getTrialIDs()
            const X_ = {}
            const Y_ = {}
            const vm = this;
            for (const id of ids) {
                const trial = this.database.getTrial(id, (res, label) => {
                    const targetFrequency = 128;
                    const trial = resample2ndDim(targetFrequency * 4.0, slice2ndDim(2.5 * EEG_FREQUENCY, 6.5 * EEG_FREQUENCY, res));
                    X_[id] = trial;
                    Y_[id] = label;
                    vm.finetune(X_, Y_, ids);
                });
            }
            
        },
        onTrainEnd(logs) {
            this.curEpoch = 0
            this.finetuneProgress = 0
            this.isFinetuning = false;
            this.isFinetuned = true;
            this.$emit("finetune");
        },
        cancelFinetuning() {
            if (false) {
                clearInterval(this.interval);
                this.isFinetuning = false;
                this.finetuneProgress = 0;
            }
            
        },
    },
};
</script>

<style scoped>
.mdc-typography-styles-overline {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
}
.texttop {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
    margin-top: 10%;
    margin-bottom: 10%;
}
</style>