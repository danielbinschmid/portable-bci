<template>
    <div id="bottom-padding">
        <div :style="{ color: 'rgba(0, 0, 0 ,0)', paddingBottom: layout.PADDING_BOTTOM_GLOBAL_REDUCED }">_</div>
    </div>
</template>

<script>

export default {
    name: "BottomPadding",
    props: {
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