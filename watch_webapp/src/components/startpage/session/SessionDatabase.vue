<template>
    <div id="session-database">
        <overlay-back-button @exit="exit()" />
        
        <div v-for="(item, i) in labels" :key="i">
             <simple-button @click="openLabel(i)" x_large :disabled="trials[item].length <= 0">
                {{ item + ": " + trials[item].length }}
            </simple-button>
        </div>

        <v-dialog v-model="openLabelDialog" fullscreen>
            <v-card :color="'rgba(236, 239, 241, 0.95)'">
                <session-label @exit="exitLabel" :database="database" :labelIdx="selectedLabel" />
            </v-card>
        </v-dialog>
    </div>
</template>



<script>
import SessionLabel from "./SessionLabel.vue"
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { MITrialDatabase} from "@/tools/database/MITrialDatabase";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
export default {
    components: { OverlayBackButton, SimpleButton, SessionLabel },
    name: "SessionDatabase",
    data() {

        return {
            selectedLabel: null,
            openLabelDialog: false,
            trials: {"FEET": [], "RIGHT HAND": [], "LEFT HAND": []},
            labels: ["FEET", "RIGHT HAND", "LEFT HAND"]
        };
    },
    props: {
        database: MITrialDatabase,
        sync: Boolean
    },
    mounted() {
        this.syncWithDatabase()
    },
    activated() {
        this.syncWithDatabase();
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        openLabel(idx) {
            this.selectedLabel = idx;
            this.openLabelDialog = true;
        },
        exitLabel() {
            this.openLabelDialog = false;
        },
        syncWithDatabase() {
            const trials = {"FEET": [], "RIGHT HAND": [], "LEFT HAND": []}
            const trialIDs = this.database.getTrialIDs();
            const vm = this
            for (const id of trialIDs) {
                this.database.getTrial(id, (data, label) => {
                    trials[vm.labels[label]].push({
                        data: data,
                        label: label
                    })
                })
            }
            this.trials = trials
        }
    },
    watch: {
        sync() {
            this.syncWithDatabase()
        }
    }
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