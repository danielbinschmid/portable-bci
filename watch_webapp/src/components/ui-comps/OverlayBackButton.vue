<template>
    <div id="OverlayBackButton">
        <v-list-item
            :style="{
                paddingTop: layout.PADDING_TOP_GLOBAL,
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
                <v-icon :style="{marginRight: withText? '10px': '0px'}"> mdi-close-circle-multiple-outline </v-icon>
                <slot> </slot>
            </v-btn>
        </v-list-item>
    </div>
</template>

<script>

export default {
    name: "OverlayBackButton",
    props: {
        bottomPadding: Boolean,
        color: String,
        withText: Boolean
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