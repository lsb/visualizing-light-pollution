import React from 'react';
import './App.css';
import DeckGL from '@deck.gl/react';
import { TerrainLayer, TileLayer, } from '@deck.gl/geo-layers';
import { BitmapLayer,  } from '@deck.gl/layers';
import {DirectionalLight, LightingEffect} from '@deck.gl/core';

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
      viewState: {longitude: -122.4, latitude: 37.7, zoom: 6, pitch: 0, bearing: 0, maxZoom: 10},
      isDrone: true,
      fullLoopDuration: 234,
      tickSize: 10,
      d1x: 0, // -1
      d1y: 5, // -3
      d1z: -13, // -1
      d2x: 1,
      d2y: 8,
      d2z: -2.5,
    };
  }
  componentDidMount() {
    setTimeout(() => this.startAnimating(), 1000);
  }
  async startAnimating() {
    const {fullLoopDuration, tickSize} = this.state;
    if((typeof fullLoopDuration) !== "number" || (typeof tickSize) !== "number") {
      console.log({"deckgl appearance": "loading", fullLoopDuration, tickSize, time: Date.now()});
      setTimeout(() => this.startAnimating(), 0);
    } else {
      let i = 0;
      do {
        const raf = await new Promise(resolve => requestAnimationFrame(resolve));
        const delay = await new Promise(resolve => setTimeout(resolve, tickSize));
        const easedsin = Math.sin(Math.PI * 2 * i / fullLoopDuration) * 5;
        const easedcos = Math.cos(Math.PI * 2 * i / fullLoopDuration) * 5;
        this.setState({d1x: easedsin, d1y: easedcos});
      } while (i++ < fullLoopDuration && this.state.isDrone);
      if(this.state.isDrone) { this.startAnimating() }
    }
  }
  render() {
    const {viz, d1x, d1y, d1z, d2x, d2y, d2z} = this.state;
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
    const directionalLight = [new DirectionalLight({color: [255,255,255], intensity: 0.25, _shadow: true, direction: [d1x,d1y,d1z]}), new DirectionalLight({color: [255,255,255], intensity: 0.9, direction: [d2x,d2y,d2z]})];
    const effects = [new LightingEffect({a: directionalLight[0], b: directionalLight[1]})];//, new LightingEffect({directionalLight: directionalLight[1]}) ]
    return (
      <div>
        <div>
          <DeckGL viewState={this.state.viewState} controller={true} layers={layers} effects={effects} id={"maincanvas"} onViewStateChange={({viewState}) => this.setState({viewState})} />
        </div>
        <div className="tweaks">
          <div id="colophon">
            © Lee Butterman 2020. Made in Oakland CA.
            <span className="tiny-credits">
              Map tiles <a href="https://creativecommons.org/licenses/by/3.0/">by</a> Stamen Design.
              Map data <a href="https://creativecommons.org/licenses/by-sa/3.0/">by</a> OpenStreetMap.
              Light pollution <a href="https://creativecommons.org/licenses/by-nc/4.0/">by</a> <a href="https://dx.doi.org/10.1126/sciadv.1600377">Falchi et al</a>, <a href="https://doi.org/10.5880/GFZ.1.4.2016.001">World Atlas 2015</a>.
            </span>
            {/* <div>
              d1x <input type="range" min="-200" max="200" step="0.5" value={d1x} onChange={e => this.setState({d1x: e.target.value * 1})} /> {d1x} <br/>
              d1y <input type="range" min="-200" max="200" step="0.5" value={d1y} onChange={e => this.setState({d1y: e.target.value * 1})} /> {d1y} <br/>
              d1z <input type="range" min="-200" max="200" step="0.5" value={d1z} onChange={e => this.setState({d1z: e.target.value * 1})} /> {d1z} <br/>
              d2x <input type="range" min="-200" max="200" step="0.5" value={d2x} onChange={e => this.setState({d2x: e.target.value * 1})} /> {d2x} <br/>
              d2y <input type="range" min="-200" max="200" step="0.5" value={d2y} onChange={e => this.setState({d2y: e.target.value * 1})} /> {d2y} <br/>
              d2z <input type="range" min="-200" max="200" step="0.5" value={d2z} onChange={e => this.setState({d2z: e.target.value * 1})} /> {d2z} <br/>
            </div> */}
            {/* <div id="legend"><hr/>Light pollution legend (as haze):<br/><span id="no-human-light">no human light</span>/<span id="horizon-glow">horizon glow</span>/<span id="no-milky-way">no milky way</span>/<span id="mesopic">colors visible</span></div> */}
          </div>
          <div id="tweaks">
            View light pollution as:
            <select id="viz-style" onChange={e => this.setState({viz: e.target.value})} value={viz}>
              <option value="bumpy-light">topography, on a white/blue world</option>
              <option value="bumpy-terrain">topography, on a terrain map world</option>
              <option value="bumpy-watercolor">topography, on a watercolor world</option>
              <option value="hazy-terrain">haze, on a terrain map world</option>
              <option value="hazy-watercolor">haze, on a watercolor world with labels</option>
              <option value="hazy-gouache">haze, on a watercolor world</option>
            </select>
            &nbsp; &nbsp;
            <label>
              <input type="checkbox" checked={this.state.isDrone} onChange={e => { this.setState({isDrone: e.target.checked}); if(!this.state.isDrone) this.startAnimating() } } />
              spotlight circling&nbsp;
            </label>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
