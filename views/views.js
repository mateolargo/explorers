DEBUG = true;
var GameView = Backbone.View.extend({

    initialize: function(options) {
        this.mapView = new MapView({model: this.model.gameMap, el: $('#Map')});
        this.mapView.render();

        this.model.get('players').forEach(function(player, index, players) {
            var playerView = new PlayerView({model: player});
            $('#Players').append(playerView.render().el);
        }, this);
    },

    render: function() {

    },

    promptPlacement: function() {
    }
});

var PlayerView = Backbone.View.extend({

    initialize: function(options) {
        _.bindAll(this, 'render', 'renderCards');

        this.model.get('resources').bind('all', this.renderCards);
        this.model.get('devCards').bind('all', this.renderCards);
    },

    render: function() {
        var templateStr = document.getElementById('PlayerT').innerHTML;
        var context = {
            id: this.model.id,
            name: this.model.get('name'),
            points: 0
        };
        var markup = _.template(templateStr, context);
        this.el = $(markup).get(0);

        this.renderCards();

        return this;
    },

    renderCards: function() {
        var rMarkup = this.model.get('resources').map(function(rCard, i, resources) {
            return '<span>' + rCard.get('type') + '</span>';
        }, this);
        this.$('.resources').html('&nbsp;' + rMarkup.join(', '));
        
        var dMarkup = this.model.get('devCards').map(function(dCard, i, devCards) {
            return '<span>' + dCard.get('type') + '</span>';
        }, this);
        this.$('.dev-cards').html('&nbsp;' + dMarkup.join(', '));
    }
});

var MapView = Backbone.View.extend({

    defaults: {
        placedBuildings: []
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'renderBuildings');

        var mapSize = this.model.get('mapSize');

        this.model.get('placedBuildings').bind('all', this.renderBuildings); 
        
        //this.hexSize = 'small';
        this.hexSize = 'big';

        //this.rowIndexesSmall = [3,7,12,16,19];
        //this.rowIndexesBig = [4,9,15,21,26,30];
        
        this.hexPositionsSmall = this._calculateHexPositions(mapSize,
                                    this.model.rowLengths, 'small');
        this.hexPositionsBig = this._calculateHexPositions(mapSize,
                                    this.model.rowLengths, 'big');
        this.mapSpots = { };
        this._initializeMapSpots();
    },

    _calculateHexPositions: function(mapSize, rowLengths, hexSize) {
        var positions = [];
        if (mapSize === 'small') {
            top = 250; left = 50;
        } else {
            top = 100; left= 100;
        }

        var vOffset, hOffset;
        if (hexSize === 'small') {
            vOffset = MapView.VERT_OFFSET_SMALL;
            hOffset = MapView.HORIZ_OFFSET_SMALL;
        } else {
            vOffset = MapView.VERT_OFFSET_BIG;
            hOffset = MapView.HORIZ_OFFSET_BIG;
        }

        var curRowLength = rowLengths[0];
        var count = 0, curRow = 0;
        for (var i = 0, ilen = this.model.get('hexes').length; i < ilen; i++) {
            if (count == curRowLength) { //go to next row
                var nextRowLength = rowLengths[++curRow];
                var vDiff, hDiff;
                if (nextRowLength > curRowLength) {
                    vDiff = 1; hDiff = -1;
                } else {
                    vDiff = 0; hDiff = -2;
                }
                top -= vOffset * (curRowLength + vDiff);
                left -= hOffset * (curRowLength + hDiff);

                curRowLength = nextRowLength;
                count = 0;
            }

            positions.push({top:top, left:left});
            top += vOffset; left += hOffset;
            count++;
        }
        return positions;
    },

    render: function() {
        var hexMarkup = this._getHexMarkup();
        this.el.html(hexMarkup);

        this.renderBuildings();

        return this;
    },

    _initializeMapSpots: function() {
        //keys will be hex indeces. each key will have an object of the form
        //{N:1, NE:1, SE:1, S:1, SW:1, NW:1}
        //a 1 means available, a 2 means already accounted for (ignore it),
        //a 3 means a building is there, a 4 means a building is adjacent
        var mapSpots = this.mapSpots;

        var rowLengths = this.model.rowLengths;

        //This loop enumerates all possible valid spots, ignoring buildings
        var corner, count = 0;
        var curRow = 0, curRowLength = rowLengths[0], nextRowLength = rowLengths[1];
        this.model.get('hexes').forEach(function(hex, i, list) {
            var doSW = true;
            var swIndex = i + 1, swSpot;
            if (count === curRowLength - 1) {
                swSpot = { }; doSW = false;
            } else {
                swSpot = mapSpots[swIndex] || { };
            }

            if (count === curRowLength) {
                count = 0;
                nextRowLength = rowLengths[++curRow];
                curRowLength = nextRowLength;
            }

            var nwIndex = i + curRowLength, wIndex = nwIndex + 1;
            var swIndex = i + 1;
            var curSpot = mapSpots[i] || { };
            var nwSpot = mapSpots[nwIndex] || { };
            var wSpot = mapSpots[wIndex] || { };

            for (corner in models.SOCHex.CORNERS) {
                curSpot[corner] = curSpot[corner] || 1;
                switch(corner) {
                    case 'N':
                        nwSpot['SW'] = nwSpot['SW'] || 2;
                        break;
                    case 'NE':
                        nwSpot['S'] = nwSpot['S'] || 2;
                        wSpot['NW'] = wSpot['NW'] || 2;
                        break;
                    case 'SE':
                        wSpot['SW'] = wSpot['SW'] || 2;
                        swSpot['N'] = swSpot['N'] || 2;
                        break;
                    case 'S':
                        swSpot['NW'] = swSpot['NW'] || 2;
                        break;
                }
            }

            //update validSpot object as appropriate
            mapSpots[i] = curSpot;
            if (doSW) {
                mapSpots[swIndex] = swSpot;
            }

            if (nwIndex < list.length) {
                mapSpots[nwIndex] = nwSpot;
                if (wIndex < list.length) {
                    mapSpots[wIndex] = wSpot;
                }
            }
            count++;
        }, this); 


        if (DEBUG) {
            var s = true;
            console.warn('checking MapView._getAdjacentCorners for accuracy...');
            for (var index in mapSpots) {
                var hex = mapSpots[index];
                for (var corner in hex) {
                    //console.warn(index, corner, hex[corner]);
                    if (hex[corner] === 2) {continue;}

                    var adjacent = this._getAdjacentCorners(index, corner);
                    for (var j = 0; j < adjacent.length; j++) {
                        var a = adjacent[j];
                        if (mapSpots[a[0]][a[1]] !== 1) {
                            s = false;
                            console.warn("invalid adjacent spot: index = ", index, " corner = ", corner);
                            console.warn(a);
                        }
                    }
                }
            }
            console.warn(s ? 'SUCCESS' : 'FAILURE');
        }
        console.warn(this.mapSpots); 
    },

    renderBuildings: function() {
        this.model.get('placedBuildings').forEach(function(building, index, list) {
            this.renderBuilding(building);
        }, this);
    },

    renderBuilding: function(building) {
        var hexIndex = building.get('hex'), corner = building.get('corner');
        this.mapSpots[hexIndex][corner] = 3;
        _.forEach(this._getAdjacentCorners(hexIndex, corner), function(adjacent, index, list) {
            this.mapSpots[adjacent[0]][adjacent[1]] = 4;
            //TODO: actually render the building!
        }, this);
    },

    _getAdjacentCorners: function(hexIndex, corner) {
        var a = [];
        var m_a = models.SOCMap.SMALL_MAP_ADJACENCY;
        var hex_a = m_a[hexIndex];
        var d = models.SOCMap.SIDES;
        switch(corner) {
            case 'N': //N, SE, SW
                hex_a[d.NW] && a.push([hex_a[d.NW], 'NE']) || hex_a[d.NE] && a.push([hex_a[d.NE], 'NW']);
                a.push([hexIndex, 'NE']);
                hex_a[d.W] && a.push([hex_a[d.W], 'NE']) || a.push([hexIndex, 'NW']);
                break;
            case 'NE': //NW, NE, S
                hex_a[d.NW] && a.push([hex_a[d.NW], 'SE']) || a.push([hexIndex, 'N']);
                hex_a[d.NE] && a.push([hex_a[d.NE], 'SE']) || hex_a[d.E] && a.push([hex_a[d.E], 'N']);
                a.push([hexIndex, 'SE']);
                break;
            case 'SE': //N, SE, SW
                a.push([hexIndex, 'NE']);
                hex_a[d.SW] && a.push([hex_a[d.SW], 'NE']) || hex_a[d.SE] && a.push([hex_a[d.SE], 'NE']);
                hex_a[d.SW] && a.push([hex_a[d.SW], 'NE']) || a.push([hexIndex, 'S']);
                break;
            case 'S': //NE, S, NW
                a.push([hexIndex, 'SE']);
                hex_a[d.SW] && a.push([hex_a[d.SW], 'SE']) || hex_a[d.SE] && a.push([hex_a[d.SE], 'SW']);
                hex_a[d.W] && a.push([hex_a[d.W], 'SE']) || a.push([hexIndex, 'SW']);
                break;
            case 'SW': //N, SE, SW
                hex_a[d.NW] && a.push([hex_a[d.NW], 'S']) || a.push([hexIndex, 'NW']);
                a.push([hexIndex, 'S']);
                hex_a[d.W] && a.push([hex_a[d.W], 'S']) || hex_a[d.SW] && a.push([hex_a[d.SW], 'NW']);
                break;
            case 'NW': //NE, S, NW
                hex_a[d.W] && a.push([hex_a[d.W], 'N']) || hex_a[d.NW] && a.push([hex_a[d.NW], 'SW']);
                hex_a[d.W] && a.push([hex_a[d.W], 'SE']) || hex_a[d.SW] && a.push([hex_a[d.SW], 'N']) || a.push([hexIndex, 'SW']);
                a.push([hexIndex, 'N']);
                break;
        }
        //console.warn(a);
        return a;
    },

    _getCornerSynonyms: function(hex, corner) {
        
    },

    _getHexMarkup: function() {
        var templateStr = document.getElementById('HexTemplate').innerHTML;
        var hexes = this.model.get('hexes').map(function(hex, index, list) {
            var pos = this._getHexPosition(index);
            var hexNum = hex.get('num');
            var context = {
                hexType: hex.getClassName(),
                hexNum: hexNum,
                hexNumClass: MapView.HEX_NUM_CLASS[hexNum],
                hexSize: this.hexSize,
                top: pos.top,
                left: pos.left,
                index:index,
                DEBUG:DEBUG
            };
            var markup = _.template(templateStr, context);
            return markup;
        }, this);
        return hexes.join('\n');
    },

    _getHexPosition: function(i) {
        return this.hexSize === 'small' ? this.hexPositionsSmall[i] : this.hexPositionsBig[i];
    }
}, {
    VERT_OFFSET_SMALL: 80, HORIZ_OFFSET_SMALL: 40,
    VERT_OFFSET_BIG:  120, HORIZ_OFFSET_BIG:   60,
    HEX_NUM_CLASS: { 2:'one', 3:'two', 4:'three', 5:'four', 6:'five', 8:'five',
                     9:'four', 10:'three', 11:'two', 12:'one' }
});
