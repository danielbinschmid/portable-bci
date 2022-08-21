<template>
    <div id="session-database">
        <overlay-back-button @exit="exit()" />
        <simple-button
                @click="fetch()"
                x_large
            >
                FETCH DATA
            </simple-button>
        <div v-for="(item, i) in trials" :key="i">
            <simple-button
                @click="openTrial(i)"
                x_large
            >
                {{'REPLAY ' + i}} 
            </simple-button>
        </div>

        <v-dialog v-model="trialSelected" fullscreen>
            <v-card :color="layout_data.WHITE_BACKGROUND">
                <trial-vis
                    @exit="closeReplay()"
                    :trialData="trials[selectedTrial]"
                />
            </v-card>
        </v-dialog>
    </div>
</template>



<script>
import TrialVis from "@/components/visualization/TrialVis.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { MITrialDatabase } from "@/tools/database/MITrialDatabase";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
export default {
    components: { OverlayBackButton, SimpleButton, TrialVis },
    name: "SessionLabel",
    data() {
        return {
            layout_data: window.layout,
            trialSelected: false,
            selectedTrial: null,
            trials: [],
            labels: ["FEET", "RIGHT HAND", "LEFT HAND"],
        };
    },
    props: {
        database: MITrialDatabase,
        labelIdx: Number,
    },
    mounted() {},
    activated() {},
    methods: {
        exit() {
            this.$emit("exit")
        },
        async fetch() {
            this.init();
        },
        openTrial(idx) {
            this.selectedTrial = idx;
            this.trialSelected = true;
        },
        closeReplay() {
            this.trialSelected = false;
            this.selectedTrial = null
        },
        async init() {
            const ids = this.database.getTrialIDs();
            const vm = this;
            const targetIDs = []
            for (const id of ids) {
                const trialMetadata = this.database.getTrialMetadata(id);
                if (trialMetadata.label == this.labelIdx) {
                    targetIDs.push(id);
                }
            }
            this.database.getTrials(targetIDs, (res, labels) => {
                vm.trials = res;
            })
        },
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