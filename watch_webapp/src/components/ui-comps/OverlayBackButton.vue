<template>
    <div id="OverlayBackButton">
        <v-list-item
            :style="{
                paddingTop: layout.SMALL_PADDING_TOP,
                paddingBottom: bottomPadding ? layout.SMALL_PADDING_TOP: '0px'
            }"
        >
            <v-btn
                class="center"
                :color="colorText"
                text
                rounded
                outlined
                x-large
                @click="exit()"
            >
                <v-icon> mdi-close-circle-multiple-outline </v-icon>
            </v-btn>
        </v-list-item>
    </div>
</template>

<script>

export default {
    name: "OverlayBackButton",
    props: {
        bottomPadding: Boolean,
        color: String
    },
    data() {
        return {
            layout: window.layout
        }
       
    },
    methods: {
        exit() {
            this.$emit("exit")
        }
    },
    computed: {
        colorText() {
            if (!this.color) {
                return this.layout.GREEN;
            } else {
                return this.color;
            }
        }
    }
};
</script>

<style scoped>
.center {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
</style>