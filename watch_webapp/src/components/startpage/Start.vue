<template>
    <div id="start">
        <overlay-back-button @exit="exit()" :color="layout.ORANGE"/>
        <simple-card
            :popupName="'mind reading'"
            :isMenuOpened="mindReading"
            topMargin
            bottomMargin
            :colorCard="layout.ORANGE"
            :colorText="layout.WHITE_BACKGROUND"
            isOpaque
            @openMenu="mindReading = true"
        >
            <mind-reading @exit="mindReading = false" :finetunedSession="finetunedSession"  :museDevInfo="museDevInfo" />
        </simple-card>
        <simple-card
            :popupName="'record'"
            :isMenuOpened="train"
            topMargin
            bottomMargin
            isOpaque
            :colorCard="layout.ORANGE"
            :colorText="layout.WHITE_BACKGROUND"
            @openMenu="train = true"
        >   
            <record @exit="train = false" @changeFinetunedSession="changeFinetunedSession" :museDevInfo="museDevInfo" :finetunedSession="finetunedSession"/>

        </simple-card>

        <simple-settings-card :isOpened="settings" @openSettings="settings = true" isOpaque>
            <settings @exit="settings = false" />
        </simple-settings-card>
    </div>
</template>

<script>
import Settings from "@/components/startpage/Settings.vue"
import SimpleCard from "@/components/ui-comps/SimpleCard.vue";
import MindReading from "@/components/startpage/MindReading.vue";
import Record from "@/components/startpage/Record.vue";
import SimpleSettingsCard from "@/components/ui-comps/SimpleSettingsCard.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue"
import { EEGNet } from "@/tools/eegnet/load";
export default {
    components: { SimpleCard, SimpleSettingsCard, MindReading, Record, Settings, OverlayBackButton },
    name: "Start",
    data() {
        return {
            finetunedSession: {name: "default", idx: -1},
            settings: false,
            train: false,
            mindReading: false,
            layout: window.layout,
            logs: [],
        };
    },
    props: {
        museDevInfo: undefined
    },

    mounted() {
        const eegnet = new EEGNet();
        eegnet.init().then((model) => {
            const m = model;
            model.warmUpPrediction().then(() => {
                window.eegnet = m;
            })
        })
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        mindReadingWindow() {
            this.mindReading = !this.mindReading;
        },
        changeFinetunedSession(session) {
            this.finetunedSession = session;
        }
    },
};
</script>