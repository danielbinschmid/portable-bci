<template>
    <div id="session-database">
        <overlay-back-button @exit="exit()" />
        
        <div v-for="(item, i) in labels" :key="i">
             <simple-button @click="openDatabase = true" x_large :disabled="isFinetuning">
                DATABASE
            </simple-button>
        </div>
    </div>
</template>



<script>
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { MITrialDatabase} from "@/tools/database/MITrialDatabase";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
export default {
    components: { OverlayBackButton, SimpleButton },
    name: "SessionDatabase",
    data() {

        return {
            trials: [],
            labels: ["FEET", "RIGHT HAND", "LEFT HAND"]
        };
    },
    props: {
        database: MITrialDatabase
    },
    mounted() {
        this.syncWithDatabase()
    },
    activated() {
        this.syncWithDatabase()
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        syncWithDatabase() {
            const trials = []
            const trialIDs = this.database.getTrialIDs();
            const vm = this
            for (const id of trialIDs) {
                this.database.getTrial(id, (data, label) => {
                    trials.push({
                        data: data,
                        label: label
                    })
                })
            }


        }
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