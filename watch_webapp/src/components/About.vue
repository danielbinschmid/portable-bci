<template>
    <div id="about">
        <small-card
            :icon="'mdi-information-outline '"
            :isMenuOpened="isOpen"
            :popupName="'About'"
            @openMenu="open()"
            topMargin
            hideMenuIcon
        >
            <overlay-back-button
                @exit="exit()"
                :color="layout.ORANGE"
                bottomPadding
                withText
            >
                ABOUT
            </overlay-back-button>

            
            <v-list-item>
                <v-list-item-icon>
                    <v-icon :color="layout.ORANGE">
                        mdi-information-variant
                    </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <div>Motor Imagery Brain-Computer Interface</div>
                </v-list-item-content>
            </v-list-item>
            <v-list-item>
                <v-list-item-icon>
                    <v-icon :color="layout.ORANGE">
                        mdi-account-circle-outline
                    </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <div>by Daniel Bin Schmid</div>
                </v-list-item-content>
            </v-list-item>
            <v-list-item>
                <v-list-item-icon>
                    <v-icon :color="layout.ORANGE"> mdi-bio </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <div>In context of a thesis about learning algorithms</div>
                </v-list-item-content>
            </v-list-item>
            <v-list-item>
                <v-list-item-icon>
                    <v-icon :color="layout.ORANGE"> mdi-api </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <div>Vue, Vuetify, TensorflowJs, Webassembly</div>
                </v-list-item-content>
            </v-list-item>

            <div :style="{ color: 'rgba(0, 0, 0 ,0)' }">_</div>
        </small-card>
    </div>
</template>

<script>
import SmallCard from "@/components/ui-comps/SmallCard.vue";
import Settings from "@/components/startpage/Settings.vue";
import SimpleCard from "@/components/ui-comps/SimpleCard.vue";
import MindReading from "@/components/startpage/MindReading.vue";
import Record from "@/components/startpage/Record.vue";
import SimpleSettingsCard from "@/components/ui-comps/SimpleSettingsCard.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
export default {
    components: {
        SimpleCard,
        SimpleSettingsCard,
        MindReading,
        Record,
        Settings,
        OverlayBackButton,
        SmallCard,
    },
    name: "About",
    data() {
        return {
            isOpen: false,
            layout: window.layout,
        };
    },
    props: {},

    methods: {
        open() {
            this.isOpen = true;
        },
        exit() {
            this.isOpen = false;
        },
    },
};
</script>

<style scoped>
.text2 {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
    text-align: center;
}
.mdc-typography-styles-overline {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
}
</style>