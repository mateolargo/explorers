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
        this.hexPositions = [];
        var rowLengths, rowIndexes, top, left;
        if (mapSize === 'small') {
            rowLengths = [3,4,5,4,3];
            rowIndexes = [3,7,12,16,19];
            top = 200; left = 50;
        } else {
            rowLengths = [4,5,6,6,5,4];
            rowIndexes = [4,9,15,21,26,30];
        }
        
        var curRowLength = rowLengths[0];
        var count = 0, curRow = 0;
        for (var i = 0, ilen = this.model.get('hexes').length; i < ilen; i++) {
            if (count == curRowLength) { //go to next row
                var nextRowLength = rowLengths[++curRow];
                if (nextRowLength > curRowLength) {
                    top -= MapView.VERT_OFFSET * (curRowLength+1);
                    left -= MapView.HORIZ_OFFSET * (curRowLength-1);
                } else {
                    top -= MapView.VERT_OFFSET * (curRowLength);
                    left -= MapView.HORIZ_OFFSET * (curRowLength-2);
                }
                curRowLength = nextRowLength;
                count = 0;
            }

            this.hexPositions.push({top:top,left:left});
            top += MapView.VERT_OFFSET;
            left += MapView.HORIZ_OFFSET;
            count++;
        }
    },

    render: function() {
        var hexMarkup = this._getHexMarkup();
        this.el.html(hexMarkup);
    },

    _getHexMarkup: function(hexClass, diceNum) {
        var templateStr = document.getElementById('HexTemplate').innerHTML;
        var hexes = this.model.get('hexes').map(function(hex, index, list) {
            var pos = this._getHexPosition(index);
            var hexNum = hex.get('num');
            var context = {
                hexType: hex.getClassName(),
                hexNum: hexNum,
                hexNumClass: MapView.HEX_NUM_CLASS[hexNum],
                top: pos.top,
                left: pos.left
            };
            var markup = _.template(templateStr, context);
            return markup;
        }, this);
        return hexes.join('\n');
    },

    _getHexPosition: function(index) {
        return this.hexPositions[index];
    }
}, {
    VERT_OFFSET: 80,
    HORIZ_OFFSET: 40,
    HEX_NUM_CLASS: { 2:'one', 3:'two', 4:'three', 5:'four', 6:'five', 8:'five',
                     9:'four', 10:'three', 11:'two', 12:'one' }
});
