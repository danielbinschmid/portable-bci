<template>
    <div id="interface">
        <simple-card
            isOpaque
            :popupName="'MUSE CONTROL'"
            @openMenu="page = 'muse'"
            :isMenuOpened="page == 'muse'"
            :colorCard="layout.ORANGE"
            :colorText="layout.PLAIN_WHITE"
            bottomMargin
        >
            <muse-control @exit="exitMuseControl" />
        </simple-card>
        
        <simple-card
            isOpaque
            :popupName="'READ MIND'"
            @openMenu="page = 'start'"
            :isMenuOpened="page == 'start'"
            :colorCard="layout.ORANGE"
            :colorText="layout.PLAIN_WHITE"
            bottomMargin
        >
            <start @exit="page = 'home'" :museDevInfo="museControlData.pairedDevice"/>
        </simple-card>

        <!-- <ble-view /> -->
    </div>
</template>

<script>
import MuseControl from "./muse-components/MuseControl.vue";
import SimpleCard from "./ui-comps/SimpleCard.vue";
import Home from "./Home.vue";
import Start from "./startpage/Start.vue";
import { getChromeVersion, webgl_detect } from "@/tools/tools";
export default {
    components: { MuseControl, Home, Start, SimpleCard },
    name: "Interface",
    data() {
        // console.log(getChromeVersion())
        // console.log(webgl_detect())
        return {
            layout: window.layout,
            page: "home",
            logs: [],
            museControlData: {},
        };
    },
    methods: {
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
