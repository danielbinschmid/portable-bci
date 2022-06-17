<template>
    <div id="settings-card">
        <v-card
            class="center"
            :max-width="layout_data.MAX_WIDTH"
            shaped
            :color="layout_data.ORANGE"
            :style="cardStyleObject"
        >
            <v-list-item>
                <v-list-item-icon class="abitright-2">
                    <v-icon
                        large
                        :size="layout_data.MAX_WIDTH / 12"
                        color="#F2F2F2"
                        class="icon"
                    >
                        {{ icon }}
                    </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <v-btn
                        class="center"
                        color="#F2F2F2"
                        text
                        rounded
                        outlined
                        x-large
                        :disabled="disabled"
                        @click="openMain()"
                    >
                        {{ text }}
                    </v-btn>
                </v-list-item-content>
            </v-list-item>
            <v-divider> </v-divider>
            <v-dialog v-model="isOpened" fullscreen>
                <v-card color="rgba(236, 239, 241, 0.8)">
                    <slot> </slot>
                </v-card>
            </v-dialog>
            <v-list-item>
                <v-btn
                    rounded
                    class="center"
                    @click="openSettings()"
                >
                    <v-icon> mdi-cogs </v-icon>
                </v-btn>
            </v-list-item>
        </v-card>
    </div>
</template>

<script>
import { LAYOUT_DATA } from "@/data/layout_constraints"
export default {
    name: "SettingsCard",
    data() {
        return {
            cardStyleObject: {
                marginTop: LAYOUT_DATA.MARGIN_TOP,
            },
            layout_data: LAYOUT_DATA
        }
    },
    props: {
        icon: String,
        text: String,
        disabled: Boolean,
        isOpened: Boolean
    },
    methods: {
        openMain() {
            this.$emit("openMain");
        },
        openSettings() {
            this.$emit("openSettings");
        }
    }
}
</script>

<style scoped>
.abitright-2 {
    margin-right: 8% !important;
    margin-left: 0%;
}
.center {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
.icon {
    margin-top: 10%;
}
</style>