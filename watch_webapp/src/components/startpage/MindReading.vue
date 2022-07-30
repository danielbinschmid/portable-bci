<template>
    <div id="mind-reading">
        <v-list style="padding: 0" color="rgba(0, 0, 0, 0)">
            <overlay-back-button @exit="exit()" bottomPadding />
            <v-divider />
            <v-list-item>
                <v-list-item-content>
                    <div
                        name="muse name"
                        class="mdc-typography-styles-overline"
                        :style="{ color: layout_data.GREY }"
                    >
                        {{ info }}
                    </div>
                </v-list-item-content>
            </v-list-item>
            <v-divider />
            <v-list-item>
                <v-list-item-content>
                    <v-btn
                        class="center"
                        :color="layout_data.GREEN"
                        text
                        rounded
                        outlined
                        x-large
                        @click="startTrial()"
                    >
                        Start Imagine
                    </v-btn>
                </v-list-item-content>
            </v-list-item>
        </v-list>
        <v-dialog v-model="isTrial" fullscreen>
            <v-card color="rgba(236, 239, 241, 0.95)">
                <overlay-back-button @exit="cancelTrial()" bottomPadding />
                <div v-if="isImagining">
                    <v-progress-circular
                        class="center"
                        :rotate="180"
                        :size="100"
                        :width="15"
                        :value="value"
                        :color="'pink'"
                    >
                        {{ (value * 4) / 100 + "s" }}
                    </v-progress-circular>
                </div>
                <div v-else-if="predictionLoading">
                    <breeding-rhombus-spinner
                        :animation-duration="1800"
                        :size="layout_data.MAX_WIDTH / 6"
                        class="topcenter"
                        :color="'dark-pink'"
                    />
                </div>
                <div v-else>
                    <div class="texttop">
                        {{ prediction }}
                    </div>

                    <simple-button @click="startTrial()"> RETRY </simple-button>
                </div>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints";
import { BreedingRhombusSpinner } from "epic-spinners/dist/lib/epic-spinners.min.js";
export default {
    components: { BreedingRhombusSpinner, OverlayBackButton, SimpleButton },
    name: "MindReading",
    data() {
        return {
            prediction: "CLASS A",
            interval: {},
            value: 0,
            isTrial: false,
            isImagining: false,
            predictionLoading: false,
            layout_data: LAYOUT_DATA,
            logs: [],
        };
    },
    props: {
        finetunedSession: undefined,
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        startTrial() {
            this.isImagining = true;
            this.isTrial = true;
            this.interval = setInterval(() => {
                if (this.value === 100) {
                    this.value = 0;
                    this.isImagining = false;
                    this.predictionLoading = true;
                    clearInterval(this.interval);
                    this.interval = setInterval(() => {
                        this.predictionLoading = false;
                        clearInterval(this.interval);
                    }, 1000);
                } else {
                    this.value += 20;
                }
            }, 800);
        },
        cancelTrial() {
            clearInterval(this.interval);
            this.isTrial = false;
            this.value = 0;
        },
    },
    computed: {
        info() {
            if (this.finetunedSession.idx != -1) {
                return "FINETUNED ON " + this.finetunedSession.name;
            } else {
                return "NETWORK PRETRAINED";
            }
        },
    },
    beforeDestroy() {
        clearInterval(this.interval);
    },
};
</script>

<style scoped>
.texttop {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
    margin-top: 10%;
    margin-bottom: 10%;
}
.mdc-typography-styles-overline {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
}
.center {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}

.topcenter {
    margin-top: 10%;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
</style>
