import React from 'react';
import './App.css';
import DeckGL from '@deck.gl/react';
import { TerrainLayer, TileLayer, } from '@deck.gl/geo-layers';
import { BitmapLayer,  } from '@deck.gl/layers';

const bitmapLayerDefaults = ({
  wrapLongitude: true,
  renderSubLayers: props => (
    new BitmapLayer((props), {
      data: null,
      image: props.data,
      bounds: [props.tile.bbox.west, props.tile.bbox.south, props.tile.bbox.east, props.tile.bbox.north],
    })
  ),
})
const terrainLayerDefaults = ({
  elevationDecoder: {
    rScaler: 0,
    gScaler: 0,
    bScaler: 337,
    offset: 0,
  },
  meshMaxError: 1,
  wrapLongitude: true,
  workerUrl: "./terrain-loader.worker.js",
  material: {
    ambient: 0.2,
    diffuse: 1,
    shininess: 128,
    specularColor: [255, 192, 64]
  },
});

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      viz: "bumpy-light",
      viewState: {longitude: -122.4, latitude: 37.7, zoom: 6, pitch: 50, bearing: 0, maxZoom: 10},
      isDrone: true,
      fullLoopDuration: 200,
      pitchChange: 0.5,
      bearingChange: 3,
      tickSize: 5,
    };
  }
  componentDidMount() {
    setTimeout(() => this.startAnimating(), 1000);
  }
  async startAnimating() {
    const {viewState: {pitch, bearing}, fullLoopDuration, pitchChange, bearingChange, tickSize} = this.state;
    if((typeof pitch) !== "number" || (typeof bearing) !== "number") {
      console.log({"deckgl appearance": "loading", pitch, bearing, pitchChange, time: Date.now()});
      setTimeout(() => this.startAnimating(), 0);
    } else {
      // for me, on my graphics card, the map view was glitching out (blank white flashes) with transitions longer than ~10ms
      let i = 0;
      do {
        const raf = await new Promise(resolve => requestAnimationFrame(resolve));
        const delay = await new Promise(resolve => setTimeout(resolve, tickSize));
        const eased = Math.sin(Math.PI * 2 * i / fullLoopDuration);
        const eased2x = Math.sin(Math.PI * 2 * 2 * i / fullLoopDuration);
        this.setState({viewState: {
          ...this.state.viewState,
          bearing: bearing + eased * bearingChange,
          pitch: pitch + eased2x * pitchChange,
          transitionDuration: tickSize,
          onTransitionInterrupt: () => this.setState({isDrone: false}),
        }})
      } while (i++ < fullLoopDuration && this.state.isDrone);
      if(this.state.isDrone) { this.startAnimating() }
    }
  }
  render() {
    const {viz} = this.state;
    const smog = new TileLayer({
      ...bitmapLayerDefaults,
      data: './tiles/greys-{z}-{x}-{y}.png',
      maxZoom: 7,
      id: 'smog',
    })
    const watercolor = new TileLayer({
      ...bitmapLayerDefaults,
      data: './stamen-tiles/watercolor/{z}/{x}/{y}.jpg',
      id: 'watercolor',
    });
    const tonerlabel = new TileLayer({
      ...bitmapLayerDefaults,
      data: './stamen-tiles/toner-labels/{z}/{x}/{y}.png',
      id: 'tonerlabel',
    });
    const terrain = new TileLayer({
      ...bitmapLayerDefaults,
      data: './stamen-tiles/terrain/{z}/{x}/{y}.png',
      id: 'greenhills',
    })
    const bumpyLight = new TerrainLayer({
      ...terrainLayerDefaults,
      id: 'bumpyLight',
      elevationData: './tiles/globe-{z}-{x}-{y}.png',
      texture: './tiles/globe-{z}-{x}-{y}.png',
      workerUrl: "./terrain-loader.worker.js",
    });
    const bumpyTerrain = new TerrainLayer({
      ...terrainLayerDefaults,
      id: 'bumpyTerrain',
      elevationData: './tiles/globe-{z}-{x}-{y}.png',
      texture: './stamen-tiles/terrain/{z}/{x}/{y}.png',
    });
    const bumpyWatercolor = new TerrainLayer({
      ...terrainLayerDefaults,
      id: 'bumpyWatercolor',
      elevationData: './tiles/globe-{z}-{x}-{y}.png',
      texture: './stamen-tiles/watercolor/{z}/{x}/{y}.jpg',
    })
    const layerMapping = ({
      "bumpy-light": [bumpyLight],
      "bumpy-terrain": [bumpyTerrain],
      "bumpy-watercolor": [bumpyWatercolor],
      "hazy-terrain": [terrain, smog],
      "hazy-watercolor": [watercolor, tonerlabel, smog],
      "hazy-gouache": [watercolor, smog],
    })
    const layers = layerMapping[viz];
    return (
      <div>
        <div>
          <DeckGL viewState={this.state.viewState} controller={true} layers={layers} id={"maincanvas"} onViewStateChange={({viewState}) => this.setState({viewState})} />
        </div>
        <div className="tweaks">
          <div id="colophon">
            © Lee Butterman 2020. Made in Oakland, California.<br/>
            Map tiles by Stamen Design, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.<br/>
            Map data by OpenStreetMap, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY SA 3.0</a><br/>
            Light pollution from <a href="https://dx.doi.org/10.1126/sciadv.1600377">Falchi et al</a>, <a href="https://doi.org/10.5880/GFZ.1.4.2016.001">World Atlas 2015</a>, <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY NC 4.0</a>.<br/>
            <div id="legend"><hr/>Light pollution legend (as haze):<br/><span id="no-human-light">no human light</span>/<span id="horizon-glow">horizon glow</span>/<span id="no-milky-way">no milky way</span>/<span id="mesopic">colors visible</span></div>
          </div>
          <div id="tweaks">
            View light pollution as:<br/>
            <form>
              <div>
                <label>
                  <input type="radio" name="viz" value="bumpy-light" checked={viz === "bumpy-light"} onChange={e => this.setState({viz: e.target.value})} />
                  topography, on a white/blue world
                </label>
              </div>
              <div>
                <label>
                  <input type="radio" name="viz" value="bumpy-terrain" checked={viz === "bumpy-terrain"} onChange={e => this.setState({viz: e.target.value})} />
                  topography, on a terrain map world
                </label>
              </div>
              <div>
                <label>
                  <input type="radio" name="viz" value="bumpy-watercolor" checked={viz === "bumpy-watercolor"} onChange={e => this.setState({viz: e.target.value})} />
                  topography, on a watercolor world
                </label>
              </div>
              <div>
                <label>
                  <input type="radio" name="viz" value="hazy-terrain" checked={viz === "hazy-terrain"} onChange={e => this.setState({viz: e.target.value})} />
                  haze, on a terrain map world
                </label>
              </div>
              <div>
                <label>
                  <input type="radio" name="viz" value="hazy-watercolor" checked={viz === "hazy-watercolor"} onChange={e => this.setState({viz: e.target.value})} />
                  haze, on a watercolor world with labels
                </label>
              </div>
              <div>
                <label>
                  <input type="radio" name="viz" value="hazy-gouache" checked={viz === "hazy-gouache"} onChange={e => this.setState({viz: e.target.value})} />
                  haze, on a watercolor world
                </label>
              </div>
            </form>
            <label>
              <input type="checkbox" checked={this.state.isDrone} onChange={e => { this.setState({isDrone: e.target.checked}); if(!this.state.isDrone) this.startAnimating() } } />
              drone hover
            </label>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
