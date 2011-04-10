var GameView = Backbone.View.extend({

    initialize: function(options) {
        this.mapView = new MapView({model: this.model.gameMap, el: $('#Map')});
        this.mapView.render();
    },

    render: function() {

    }

});

var MapView = Backbone.View.extend({

    initialize: function(options) {
        var mapSize = this.model.get('mapSize');
        
        //this.hexSize = 'small';
        this.hexSize = 'big';

        this.hexPositionsSmall = this._calculateHexPositions(mapSize, 'small');
        this.hexPositionsBig = this._calculateHexPositions(mapSize, 'big');
    },

    _calculateHexPositions: function(mapSize, hexSize) {
        var positions = [];
        var rowLengths, rowIndexes, top, left;
        if (mapSize === 'small') {
            rowLengths = [3,4,5,4,3];
            rowIndexes = [3,7,12,16,19];
            top = 250; left = 50;
        } else {
            rowLengths = [4,5,6,6,5,4];
            rowIndexes = [4,9,15,21,26,30];
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
                left: pos.left
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
