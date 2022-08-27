<template>
    <div id="simple-settings-card">
        <v-card
            class="center"
            :max-width="layout_data.MAX_WIDTH"
            shaped
            :color="layout_data.ORANGE"
            :style="cardStyleObject"
        >
            <v-dialog v-model="isOpened" fullscreen>
                <v-card :color="'rgba(236, 239, 241,'+ transparentness +')'">
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
    name: "SimpleSettingsCard",
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
        isOpened: Boolean,
        isOpaque: Boolean
    },
    methods: {
        openSettings() {
            this.$emit("openSettings");
        }
    },
    computed: {
        transparentness() {
            if (this.isOpaque) {
                return 1
            } else {
                return 0.8
            }
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
    width: 90%;
}
.icon {
    margin-top: 10%;
}
</style>