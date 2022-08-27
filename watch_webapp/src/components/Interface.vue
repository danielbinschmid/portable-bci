<template>
    <div id="interface" :style="{paddingTop: layout.PADDING_TOP_GLOBAL_STARTMENU, paddingBottom: layout.PADDING_BOTTOM_GLOBAL}">

        <muse-control @exit="exitMuseControl" @streamingChange="streamingChange" />

        <vis :isStreamingEnabled="isStreamingEnabled" :museDevInfo="museControlData.pairedDevice" />


        <start :museDevInfo="museControlData.pairedDevice" :isStreamingEnabled="isStreamingEnabled"/>

        

        <about />
    </div>
</template>

<script>
import About from "./About.vue"
import MuseControl from "./muse-components/MuseControl.vue";
import SimpleCard from "./ui-comps/SimpleCard.vue";
import Home from "./Home.vue";
import Vis from "./visualization/Vis.vue"
import Start from "./startpage/Start.vue";
import { getChromeVersion, webgl_detect } from "@/tools/tools";
export default {
    components: { MuseControl, Home, Start, SimpleCard, Vis, About },
    name: "Interface",
    data() {
        console.log("chromium version: " + getChromeVersion())
        console.log("webgl: " + webgl_detect())
        return {
            isStreamingEnabled: false,
            layout: window.layout,
            page: "home",
            logs: [],
            museControlData: {},
        };
    },
    methods: {
        streamingChange(isStreaming) {
            this.isStreamingEnabled = isStreaming
        },
        setPage(page) {
            // console.log(page)

            this.page = page;
        },
        exitMuseControl(museControlData) {
            this.museControlData = museControlData;
            this.page = "home";
        },
    },
    computed: {
        isControlOpened() {
            return this.page == "muse";
        },
    },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.background {
    color: rgb(36, 36, 36);
}
h1,
h2 {
    font-weight: normal;
}
ul {
    list-style-type: none;
    padding: 0;
}
li {
    display: inline-block;
    margin: 0 10px;
}
a {
    color: #42b983;
}
</style>
