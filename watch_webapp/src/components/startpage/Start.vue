<template>
    <div id="start">
        <small-card
            :icon="'mdi-brain'"
            :isMenuOpened="isOpen"
            :popupName="'READ MIND'"
            @openMenu="open()"
            topMargin
            isOpaque
            hideMenuIcon
        >
            <overlay-back-button @exit="exit()" :color="layout.ORANGE" withText>
                <div>READ MIND</div>
            </overlay-back-button>

            <small-card
                :icon="'mdi-brain'"
                :isMenuOpened="mindReading"
                :popupName="'READ'"
                @openMenu="mindReading = true"
                topMargin
                isOpaque
                hideMenuIcon
            >
                <mind-reading
                    @exit="mindReading = false"
                    :finetunedSession="finetunedSession"
                    :museDevInfo="museDevInfo"
                     :isStreamingEnabled="isStreamingEnabled"
                />
            </small-card>

            <small-card
                :icon="'mdi-record-rec'"
                :isMenuOpened="train"
                :popupName="'RECORD'"
                @openMenu="train = true"
                topMargin
                isOpaque
                hideMenuIcon
            >
                <record
                 :isStreamingEnabled="isStreamingEnabled"
                    @exit="train = false"
                    @changeFinetunedSession="changeFinetunedSession"
                    :museDevInfo="museDevInfo"
                    :finetunedSession="finetunedSession"
                />
            </small-card>
            

            <simple-settings-card
                :isOpened="settings"
                @openSettings="settings = true"
                isOpaque
            >
                <settings @exit="settings = false" />
            </simple-settings-card>

            <bottom-padding />
        </small-card>
    </div>
</template>

<script>
import BottomPadding from "@/components/ui-comps/BottomPadding.vue"
import SmallCard from "@/components/ui-comps/SmallCard.vue";
import Settings from "@/components/startpage/Settings.vue";
import SimpleCard from "@/components/ui-comps/SimpleCard.vue";
import MindReading from "@/components/startpage/MindReading.vue";
import Record from "@/components/startpage/Record.vue";
import SimpleSettingsCard from "@/components/ui-comps/SimpleSettingsCard.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { EEGNet } from "@/tools/eegnet/load";
export default {
    components: {
        SimpleCard,
        SimpleSettingsCard,
        MindReading,
        Record,
        Settings,
        OverlayBackButton,
        SmallCard,
        BottomPadding
    },
    name: "Start",
    data() {
        return {
            finetunedSession: { name: "default", idx: -1 },
            isOpen: false,
            settings: false,
            train: false,
            mindReading: false,
            layout: window.layout,
            logs: [],
        };
    },
    props: {
        museDevInfo: undefined,
        isStreamingEnabled: Boolean
    },

    mounted() {
        const eegnet = new EEGNet();
        eegnet.init().then((model) => {
            const m = model;
            window.eegnet = m;
        });
    },
    methods: {
        open() {
            this.isOpen = true;
        },
        exit() {
            this.isOpen = false;
        },
        mindReadingWindow() {
            this.mindReading = !this.mindReading;
        },
        changeFinetunedSession(session) {
            this.finetunedSession = session;
        },
    },
};
</script>