<template>
    <div id="interface">
        <home @setPage="setPage"/>
        <div v-if="page == 'muse'"> 
            <muse-control/>
        </div>
        <div v-else-if="page == 'start'">
            <start />
        </div>
        
        <!-- <ble-view /> -->
    </div>
</template>

<script>
import MuseControl from "./muse-components/MuseControl.vue";
import Home from "./Home.vue"
import Start from "./startpage/Start.vue"
import { getChromeVersion, webgl_detect} from "@/tools/tools"
export default {
    components: { MuseControl, Home, Start },
    name: "Interface",
    data() {
        // console.log(getChromeVersion())
        // console.log(webgl_detect())
        return {
            page: "muse",
            logs: [],
        };
    },
    methods: {
        setPage(page) {
            // console.log(page)
            
            this.page = page;
        }
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
