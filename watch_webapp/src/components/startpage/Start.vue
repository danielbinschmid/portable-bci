<template>
    <div id="start">
        <simple-card
            :popupName="'mind reading'"
            :isMenuOpened="mindReading"
            topMargin
            bottomMargin
            :colorCard="layout_data.ORANGE"
            :colorText="layout_data.WHITE_BACKGROUND"
            isOpaque
            @openMenu="mindReading = true"
        >
            <mind-reading @exit="mindReading = false" :finetunedSession="finetunedSession"  />
        </simple-card>
        <simple-card
            :popupName="'record'"
            :isMenuOpened="train"
            topMargin
            bottomMargin
            isOpaque
            :colorCard="layout_data.ORANGE"
            :colorText="layout_data.WHITE_BACKGROUND"
            @openMenu="train = true"
        >   
            <record @exit="train = false" @changeFinetunedSession="changeFinetunedSession" :finetunedSession="finetunedSession"/>

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
import { LAYOUT_DATA } from "@/data/layout_constraints";
export default {
    components: { SimpleCard, SimpleSettingsCard, MindReading, Record, Settings },
    name: "Start",
    data() {
        return {
            finetunedSession: {name: "default", idx: -1},
            settings: false,
            train: false,
            mindReading: false,
            layout_data: LAYOUT_DATA,
            logs: [],
        };
    },
    methods: {
        mindReadingWindow() {
            this.mindReading = !this.mindReading;
        },
        changeFinetunedSession(session) {
            this.finetunedSession = session;
        }
    },
};
</script>