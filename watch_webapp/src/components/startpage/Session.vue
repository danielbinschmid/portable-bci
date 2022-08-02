<template>
    <div id="session">
        <!-- <ble-view /> -->

        <overlay-back-button bottomPadding @exit="exit()" />
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

        <v-dialog v-model="recordNew" fullscreen>
            <v-card :color="'rgba(236, 239, 241, 0.95)'">
                <record-new @exit="exitRecordNew()" @newTrial="newTrial" />
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import RecordNew from "@/components/startpage/session/RecordNew.vue";

export default {
    components: { OverlayBackButton, SimpleButton, RecordNew },
    name: "Session",
    data() {
        return {
            layout: window.layout,
            finetuneProgress: 0,
            interval: {},
            isFinetuning: false,
            recordNew: false,
            isFinetuned: false,
            nTrials: 7,
            logs: [],
        };
    },
    props: {
        isCurrentFinetuned: Boolean
    },
    watch: {
        isCurrentFinetuned(neww, old) {
            this.isFinetuned = neww;
        }
    },
    mounted() {
        this.isFinetuned = this.isCurrentFinetuned;
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        startRecordNew() {
            this.recordNew = true;
        },
        exitRecordNew() {
            this.recordNew = false;
        },
        newTrial(labelIdx) {
            this.isFinetuned = false;
            this.nTrials += 1;
            this.$emit("forgetFinetune");
        },
        startFinetuning() {
            this.isFinetuning = true;
            this.interval = setInterval(() => {
                if (this.finetuneProgress == 100) {
                    this.finetuneProgress = 0;
                    clearInterval(this.interval);
                    this.finetuningFinished();
                } else {
                    this.finetuneProgress += 10;
                }
            }, 500);
        },
        finetuningFinished() {
            this.isFinetuning = false;
            this.isFinetuned = true;
            this.$emit("finetune");
        },
        cancelFinetuning() {
            clearInterval(this.interval);
            this.isFinetuning = false;
            this.finetuneProgress = 0;
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