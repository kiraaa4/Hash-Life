<template>
  <div id="app" tabindex="1" @keydown="handleKeydown">
    <header>
      <span>Generation {{generation}}{{generationTime !== null ? ` (${generationTime}ms)` : ''}}</span>
      <span>Cell count: {{liveCount}}</span>
      <span>Step: {{pow2(stepSize)}}</span>
     </header>

    <Universe ref="Universe"
      @toggle="toggle"
    />

    <footer><div style="padding:10px; display:flex; align:center">
      <span class="controls">
        <b-button variant="primary" @click="resume">{{timerID ? 'Stop' : 'Start'}}</b-button>
        <b-button variant="primary" @click="step">Step</b-button>
        <b-button variant="primary" @click="clear">Clear</b-button>
      
        <b-button variant="primary" @click="save">Save</b-button>
        <b-button variant="primary" @click="loadPrompt">Load</b-button>
        <select v-model="preset">
          <option value="">--Select a pattern--</option>
          <optgroup v-for="(group, label) in examples" :key="label" :label="label">
            <option v-for="(rle, name) in group" :key="name" v-text="name" :value="rle"></option>
          </optgroup>
        </select>
      
        <label for="speed-input">Speed</label>
        <input id="speed-input" type="range" v-model.number="speed" min="1" max="100">
     <b-button variant="primary" :disabled="zoom <= -32" @click="handleZoom(-1)"> - </b-button>
        <span style="margin: 0 8px;">Zoom</span>
        <b-button variant="primary" :disabled="zoom >= 8" @click="handleZoom(+1)"> + </b-button>
     
        <b-button variant="primary" :disabled="stepSize <= 0" @click="stepSize--">-</b-button>
        <span style="margin: 0 8px;">Step Size</span>
        <b-button variant="primary" :disabled="stepSize >= 32" @click="stepSize++">+</b-button>
      </span></div>
    </footer>
  </div>
</template>

<script>
import Universe from './components/Universe.vue'
import { RLE_RE } from './assets/rle'
import { LifeUniverse } from './assets/hashlife'
import examples from './assets/examples.json'
import Swal from 'sweetalert2'

export default {
  name: 'app',
  data() {
    return {
      zoom: 4,
      speed: 2,
      stepSize: 0,
      generation: 0,
      generationTime: null,
      liveCount: 0,
      preset: '',
      timerID: null,
      examples: examples
    }
  },
  methods: {
    pow2(k) {
      return Math.pow(2, k)
    },
    handleWheel(evt) {
      if (evt.deltaY < 0)
        this.handleZoom(+1, evt.pageX, evt.pageY)
      else
        this.handleZoom(-1, evt.pageX, evt.pageY)
    },
    handleKeydown(evt) {
      if (evt.keyCode === 219) 
        this.handleZoom(-1)
      else if (evt.keyCode === 221) 
        this.handleZoom(+1)
      else if (evt.keyCode === 189) 
        this.stepSize = Math.max(this.stepSize - 1, 0)
      else if (evt.keyCode === 187) 
        this.stepSize = Math.min(this.stepSize + 1, 32)
    },
    handleZoom(k, dx, dy) {
      if (this.zoom + k > 8 || this.zoom + k < -32)
        return
      this.zoom += k
      dx = dx || document.body.clientWidth / 2
      dy = dy || document.body.clientHeight / 2
      this.$refs.Universe.zoom(k, dx, dy)
    },
    update() {
      this.liveCount = this.universe.population
      this.$refs.Universe.setUniverse(this.universe)
    },
    toggle(cell) {
      this.universe.toggle(cell[0], cell[1])
      this.update()
    },
    step() {
      this.generation += Math.pow(2, this.stepSize)
      const t0 = performance.now()
      this.universe.step(this.stepSize)
      this.generationTime = Math.ceil(performance.now() - t0)
      this.update()
    },
    clear() {
      this.universe = new LifeUniverse()
      this.generation = 0
      this.generationTime = null
      this.update()
    },
    resume() {
      if (this.timerID) {
        clearInterval(this.timerID)
        this.timerID = null
      }
      else
        this.timerID = setInterval(this.step, 1000 / this.speed)
    },
    save() {
      Swal({
        title: 'Save Pattern',
        text: 'Current pattern in RLE format:',
        input: 'text',
        inputValue: this.universe.toRLE()
      })
    },
    load(rle) {
      if (rle) {
        const universe = LifeUniverse.fromRLE(rle)
        this.clear()
        this.$refs.Universe.center()
        this.universe = universe
        this.update()
        const px = Math.min(document.body.clientWidth, document.body.clientHeight)
        const zoomGoal = Math.min(4, Math.round(Math.log2(px) - universe.root.level))
        this.handleZoom(zoomGoal - this.zoom)
      }
    },
    loadPrompt() {
      Swal({
        title: 'Load Pattern',
        text: 'Enter pattern RLE:',
        input: 'text',
        inputPlaceholder: 'b2o$2o$bo!',
        showCancelButton: true,
        inputValidator(value) {
          if (!RLE_RE.test(value))
            return 'Invalid RLE format, please check your input.'
        }
      }).then(({ value }) => {
        this.load(value)
      })
    }
  },
  watch: {
    speed(val) {
      if (this.timerID) {
        clearInterval(this.timerID)
        this.timerID = setInterval(this.step, 1000 / val)
      }
    },
    preset(val) {
      this.load(val)
    }
  },
  mounted() {
    window.addEventListener('wheel', this.handleWheel)
    // this.universe = new LifeUniverse()
    const allExamples = []
    for (const group in this.examples)
      for (const name in this.examples[group])
        allExamples.push(this.examples[group][name])
    this.preset = allExamples[Math.floor(Math.random() * allExamples.length)]
  },
  beforeDestroy() {
    window.removeEventListener('wheel', this.handleWheel)
  },
  components: {
    Universe
  }
}
</script>

<style>
body {
  font-family: 'Courier New', Courier, monospace;position: absolute;
  width: 100%;
  top: 0;
  bottom: 0;
  margin: 0;
  overflow: hidden;
  font-family: 'Avenir', Helvetica, Arial, sans-serif; 
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  text-align: center;
}

header {
  padding: 20px;
  background: rgba(120, 211, 211, 0.7);
  z-index: 1;
  text-align: right; font-family: 'Courier New', Courier, monospace;
}

header > span {
  padding: 0 20px;
}

header > span::before {
  position: relative;
  left: -20px;
  content: "|";
}

footer {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  height: 120px;
  width: 100%;
  box-sizing: border-box;
  border-top: 1px solid black;
  padding: 10px;
  background: rgba(70, 211, 211, 0.8);
  z-index: 1; font-family: 'Courier New', Courier, monospace;
}

.controls {
  display: flex;
  align-items: center; margin-right:20px
}

.controls button, .controls select {
  margin: 10px;
}

.controls label {
  margin-right: 8px;
}
</style>
