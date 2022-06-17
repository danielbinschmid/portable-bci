<template>
    <div id="app">
        <v-app :style="myStyle">
            <router-view />
        </v-app>
    </div>
</template>

<script>
import {Riemann} from "@/tools/riemann/riemann";
export default {
  name: 'App',
  data () {
      return {
          myStyle:{
            backgroundColor:"#ECEFF1" 
            }
      }
    },
    beforeCreate() {
        new Riemann((copy) => {
            console.log("compiled!");
            window.riemann = copy;
        });
    }
}
</script>


<style>
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 20px;
    margin-bottom: 20px;
}
</style>
