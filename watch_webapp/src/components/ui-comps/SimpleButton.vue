<template>
    <div id="simple-button">
        <v-list-item
            :style="{
                paddingTop: layout.SMALL_PADDING_TOP,
                paddingBottom: bottomPadding ? layout.SMALL_PADDING_TOP: '0px'
            }"
        >
            <v-btn
                class="center"
                :color="getColor"
                text
                rounded
                outlined
                :disabled="disabled"
                :x-large="isXLarge"
                :large="large"
                @click="exit()"
            >
                <slot></slot>
            </v-btn>
        </v-list-item>
    </div>
</template>

<script>
export default {
    name: "SimpleButton",
    props: {
        color: String,
        bottomPadding: Boolean,
        x_large: Boolean,
        large: Boolean,
        disabled: Boolean
    },
    data() {
        return {
            layout: window.layout
        }
       
    },
    methods: {
        exit() {
            this.$emit("click")
        }
    },
    computed: {
        isXLarge() {
            console.log(this.x_large)
            if (!this.x_large && !this.large) {
                return true;
            } else {
                return this.x_large;
            }
        },
        getColor() {
            if (!this.color) {
                return window.layout.GREEN;
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