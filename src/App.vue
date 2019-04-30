<template>
  <div id="app" class="container-fluid">

    <div class="row">

      <div id="mapSettings" class="col-sm-3">
        <!-- <input type="checkbox" id="cbCountryBoundary" v-model="countryBoundary">
        <label for="cbCountryBoundary">Show country boundaries</label>
        <br> -->
        <div id="displayMode">
          <p> Display mode </p>
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" id="singleYear" value="single" v-model="displayMode">
            <label class="form-check-label" for="singleYear">Single year</label>
          </div>
          <div class="from-check form-check-inline">
            <input class="form-check-input" type="radio" id="multiYearAverage" value="multi" v-model="displayMode">
            <label class="form-check-label" for="multiYearAverage">Multi-year average</label>
          </div>
        </div>
        <br>
        <div id="singleMode" v-show="displayMode==='single'">
          <p> Select year </p>
          <vue-slider
            v-model="selectedYear"
            :min="2006" :max="2015" :interval="1"
            :lazy="true"
            :tooltip="'always'"
            tooltip-placement="bottom"
            :process="false"
            :adsorb="true"
          >
          </vue-slider>
        </div>
        <div id="multiMode" v-show="displayMode==='multi'">
          <p> Select period </p>
          <vue-slider
            v-model="selectedPeriod"
            :min="2006" :max="2015" :interval="1"
            :lazy="true"
            :tooltip="'always'"
            tooltip-placement="bottom"
            :adsorb="true"
            :enableCross="false"
            :minRange="1"
          >
          </vue-slider>
        </div>
      </div>

      <div id="map" class="col-sm-5">
        <svg id="map-frame" :width="mapWidth" :height="mapHeight" v-if="ready">

          <!-- Legend -->
          <rect v-for="point in legendColour" :key="point.colour"
            :x="mapWidth - 30"
            :y="mapHeight/2 - point.Q*scaleFactor*3"
            :width="10"
            :height="scaleFactor*3"
            :fill="point.colour"
            style="stroke-width: 0"
          />
          <!-- Legend text -->
          <text v-for="point in legendText" :key="-point.num"
            :x="mapWidth - 15"
            :y="mapHeight/2 - point.Q*scaleFactor*3.21 + 11"
            :font-size="9"
          > {{ point.Q }}
          </text>

          <!-- Map -->
          <rect
            v-for="(point, index) in topo" :key="point.id"
            @click="mapClick(point.id)"
            :x="(point.lon-minLong)*scaleFactor"
            :y="mapHeight-(point.lat-minLat)*scaleFactor"
            :width="0.5*scaleFactor"
            :height="0.5*scaleFactor"
            :fill="selectedFlow[index].colour"
            style="stroke-width: 0"
            data-toggle="tooltip"
            class="cursor-hand"
          > <title> {{ point.id }} </title>
          </rect>
        </svg>
      </div>

      <div id="historgram" class="col-sm-4">
        <vgg-graphic :width="450" :height="350" :data="selectedFlow">
          <vgg-section
            :x1="50" :x2="420" :y1="100" :y2="300"
            :transform="[
              { binning: { groupBy: 'Q',
                          method: 'Manual', manualClasses: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] } },
              { summarise: { count: { Q: 'count' } } },
              { mutate: { freq: (row) => row.count / 10280 * 100 }}
            ]"
            :scale-x="'bins'"
            :scale-y="{ domain: 'freq', domainMin: 0 }"
          >
            <vgg-map v-slot="{ row }">
                <vgg-rectangle
                  :x1="row.bins[0]"
                  :x2="row.bins[1]"
                  :y1="0"
                  :y2="row.freq"
                  fill="#D3D3D3"
                />
            </vgg-map>
            <vgg-y-axis
              :scale="{ domain: 'freq', domainMin: 0 }"
              :tick-count="3"
              title="Frequency [%]"
              :title-hjust="-0.3"
              :title-angle="-90"
            />
            <vgg-x-axis
              :tick-count="11"
              scale="bins"
              title="Streamflow index [-]"
              :title-vjust="-1"
            />
          </vgg-section>
        </vgg-graphic>
      </div>

    </div>

    <div class="row">

      <div id="tsSettings" class="col-sm-3">
        <div id="tsMode" v-show="ready">
          <p> Display selected time series as </p>
          <div class="from-check form-check-inline">
            <input class="form-check-input" type="radio" id="newMode" value="new" v-model="tsMode">
            <label class="form-check-label" for="newMode">new graph</label>
          </div>
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" id="addMode" value="add" v-model="tsMode">
            <label class="form-check-label" for="addMode">new line added to graph</label>
          </div>
        </div>
        <br>
        <!-- <input type="button" value= "Clear time series graph" v-show="numTS > 0" @click="clearTS()"> -->
        <button type="button" class="btn btn-primary" value="Clear time series graph" v-show="numTS > 0" @click="clearTS()">Clear</button>
      </div>

      <div id="tsPlot" class="col-sm-9">
        <vgg-graphic :width="tsWidth" :height="tsHeight" v-if="numTS > 0" :data="selectedTimeSeries">
          <vgg-section
            :x1="50" :x2="500" :y1="50" :y2="280"
            :transform="{ groupBy: 'id' }"
          >
            <vgg-scales :scales="{ QScale: { domain: [-5, 5] } }" />
            <vgg-scales :scales="{ yearScale: { domain: [firstYear, lastYear] } }" />
            <vgg-map v-slot="{ row }">
              <vgg-multi-line
                :x="{ val: row.grouped.year, scale: '#yearScale' }"
                :y="{ val: row.grouped.Q, scale: '#QScale' }"
                :stroke="{ val: row.id, scale: { type: 'category10', domain: 'id' } }"
              />
            </vgg-map>
            <vgg-symbol-legend
              :scale="'id'"
              :stroke="{ type: 'category10' }"
              shape="line"
              :stroke-width="2"
              :x="550"
              :y="tsHeight/2"
              :w="60"
              :h="(numTS + 1)*scaleFactor*4"
              title="Cell ID"
              :title-padding="4"
            />
            <vgg-x-axis
              :scale="'#yearScale'"
              :tick-count="11"
              title="Year"
              :title-vjust="-0.7"
            />
            <vgg-y-axis
              :scale="'#QScale'"
              :tick-count="11"
              title="Streamflow index [-]"
              :title-angle="-90"
              :title-hjust="-0.2"
            />
          </vgg-section>
        </vgg-graphic>

      </div>

    </div>
  </div>
</template>

<script>
import { csv } from 'd3-fetch'
import { interpolateBrBG } from 'd3-scale-chromatic'
import topo from './topo.json'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

export default {
  name: 'app',
  components: {
    VueSlider
  },
  data () {
    return {
      topo: Object.freeze(topo),
      allFlow: [],
      countryBoundary: true,
      displayMode: 'single',
      tsMode: 'new',
      numTS: 0,
      selectedYear: 2015,
      firstYear: 2006,
      lastYear: 2015,
      selectedPeriod: [2006, 2015],
      mapWidth: 550,
      mapHeight: 400,
      tsWidth: 600,
      tsHeight: 300,
      scaleFactor: 6,
      minLong: 61.25,
      minLat: -8.75,
      legendArrayLength: 51,
      selectedTimeSeries: [],
      ready: false
    }
  },
  methods: {
    getData () {
      // allFlow
      let af = Array(10280)
      for (let i = 0; i < 10280; i++) {
        af[i] = { id: i, Q: Array(10) }
      }
      csv('/data/gr-10yrs.csv').then(data => {
        data.forEach((d, i) => {
          af[+d.id].Q[+d.year - 2006] = +d.Q
        })
        this.allFlow = Object.freeze(af)
        this.ready = true
      })
    },
    getColourStr (num, min, max) {
      // let normNum = num > 0 ? (num / max) * 62 : (-num / min) * 62
      // return normNum > 0 ? 'hsl(160,50%,' + Math.round(normNum) + '%)' : 'hsl(28,50%,' + -Math.round(normNum) + '%)'
      let normNum = num > 0 ? num / max / 2 + 0.5 : 0.5 - (num / min / 2)
      return interpolateBrBG(normNum)
    },
    getSelectedTimeSeries: function (id) {
      let year = Array(this.numYears)
      for (let i = 0; i < this.numYears; i++) {
        year[i] = i + this.firstYear
      }
      return { id: Array(this.numYears).fill(id),
        year: year,
        Q: this.allFlow[id].Q
      }
    },
    mapClick (id) {
      let newTS = this.getSelectedTimeSeries(id)
      if (this.tsMode === 'add' && this.numTS > 0) {
        for (let i = 0; i < this.numYears; i++) {
          this.selectedTimeSeries.Q.push(newTS.Q[i])
          this.selectedTimeSeries.id.push(newTS.id[i])
          this.selectedTimeSeries.year.push(newTS.year[i])
        }
        this.numTS += 1
      } else {
        this.selectedTimeSeries = newTS
        this.numTS = 1
      }
    },
    clearTS () {
      this.numTS = 0
    }
  },
  computed: {
    selectedFlow: function () {
      let sf = this.ready ? Array(10280) : []
      if (this.ready) {
        if (this.displayMode === 'single') {
          for (let i = 0; i < 10280; i++) {
            let Q = this.allFlow[i].Q[this.selectedIndex]
            sf[i] = { Q: Q, colour: this.getColourStr(Q, -5, 5) }
          }
        } else {
          for (let i = 0; i < 10280; i++) {
            let sumQ = 0
            for (let j = this.startIndex; j <= this.endIndex; j++) {
              sumQ += this.allFlow[i].Q[j]
            }
            let meanQ = sumQ / this.periodLength
            sf[i] = { Q: meanQ, colour: this.getColourStr(meanQ, -5, 5) }
          }
        }
      }
      return sf
    },
    legendColour: function () {
      let x = Array(this.legendArrayLength + 1)
      for (let i = 0; i <= this.legendArrayLength; i++) {
        x[i] = { num: i / this.legendArrayLength,
          Q: (i / this.legendArrayLength - 0.5) * 10,
          colour: this.getColourStr((i / this.legendArrayLength - 0.5) * 10, -5, 5)
        }
      }
      return x
    },
    legendText: function () {
      let x = Array(11)
      for (let i = 0; i <= 10; i++) {
        x[i] = { num: i / 10,
          Q: Math.round((i / 10 - 0.5) * 10)
        }
      }
      return x
    },
    numYears: function () { return this.lastYear - this.firstYear + 1 },
    selectedIndex: function () { return this.selectedYear - this.firstYear },
    startIndex: function () { return this.selectedPeriod[0] - this.firstYear },
    endIndex: function () { return this.selectedPeriod[1] - this.firstYear },
    periodLength: function () { return this.selectedPeriod[1] - this.selectedPeriod[0] + 1 }
  },
  mounted () {
    this.getData()
  }
}
</script>
