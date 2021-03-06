import ImageViewerWidget from './base';

var GeojsImageViewerWidget = ImageViewerWidget.extend({
    initialize: function (settings) {
        ImageViewerWidget.prototype.initialize.call(this, settings);

        $.getScript(
            'https://cdnjs.cloudflare.com/ajax/libs/geojs/0.10.3/geo.min.js',
            () => this.render()
        );
    },

    render: function () {
        // If script or metadata isn't loaded, then abort
        if (!window.geo || !this.tileWidth || !this.tileHeight) {
            return;
        }

        var geo = window.geo; // this makes the style checker happy

        // TODO: if a viewer already exists, do we render again?
        var w = this.sizeX, h = this.sizeY;
        var mapW = $(this.el).innerWidth(), mapH = $(this.el).innerHeight();
        var mapParams = {
            node: this.el,
            ingcs: '+proj=longlat +axis=esu',
            gcs: '+proj=longlat +axis=enu',
            maxBounds: {left: 0, top: 0, right: w, bottom: h},
            center: {x: w / 2, y: h / 2},
            min: Math.min(0, Math.floor(Math.log(Math.min(
                (mapW || this.tileWidth) / this.tileWidth,
                (mapH || this.tileHeight) / this.tileHeight)) / Math.log(2))),
            max: Math.ceil(Math.log(Math.max(
                w / this.tileWidth,
                h / this.tileHeight)) / Math.log(2)),
            clampBoundsX: true,
            clampBoundsY: true,
            zoom: 0
        };
        var maxLevel = mapParams.max;
        mapParams.unitsPerPixel = Math.pow(2, maxLevel);
        var layerParams = {
            useCredentials: true,
            url: this._getTileUrl('{z}', '{x}', '{y}'),
            maxLevel: mapParams.max,
            wrapX: false,
            wrapY: false,
            tileOffset: function () {
                return {x: 0, y: 0};
            },
            attribution: '',
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            tileRounding: Math.ceil,
            tilesAtZoom: (level) => {
                var scale = Math.pow(2, maxLevel - level);
                return {
                    x: Math.ceil(this.sizeX / this.tileWidth / scale),
                    y: Math.ceil(this.sizeY / this.tileHeight / scale)
                };
            },
            tilesMaxBounds: (level) => {
                var scale = Math.pow(2, maxLevel - level);
                return {
                    x: Math.floor(this.sizeX / scale),
                    y: Math.floor(this.sizeY / scale)
                };
            }
        };
        this.viewer = geo.map(mapParams);
        this.viewer.createLayer('osm', layerParams);

        return this;
    },

    destroy: function () {
        if (this.viewer) {
            this.viewer.exit();
            this.viewer = null;
        }
        if (window.geo) {
            delete window.geo;
        }
        ImageViewerWidget.prototype.destroy.call(this);
    }
});

export default GeojsImageViewerWidget;
