(function (){
    //console.warn('game.js, models = ', models);
    var server = false, models;
    if (typeof exports !== 'undefined') {
        _ = require('underscore')._;
        Backbone = require('backbone');

        models = exports;
        server = true;
    } else {
        models = this.models = {};
    }
    //console.warn('models = ', models);

    SILENT = {silent:true};

    //=========================================================================
    // Deck
    //=========================================================================
    models.Deck = Backbone.Collection.extend({
        shuffle: function() {
            var o = this.toArray();
            //fisher-yates
            for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            this.refresh(o, SILENT);
        }
    });

    //=========================================================================
    // Player
    //=========================================================================
    models.Player = Backbone.Model.extend({
        defaults: {
            name: 'Anonymous',
            color: 'red',
            unusedBuildings: { },
            resources: new Backbone.Collection(),
            devCards: new Backbone.Collection()
        }
    }, {//Static properties
        COLORS: { RED:'red', BLUE:'blue', GREEN:'green', ORANGE:'orange' } 
    });

    //=========================================================================
    // Game
    //=========================================================================
    models.Game = Backbone.Model.extend({
        defaults: {
            mapSize: 'small',
            players: new Backbone.Collection(),
            robberLocation: null,
            whosTurn: null,
            devCardDeck: new models.Deck(),
            unusedResourceCards: { }
        },

        initialize: function() {
            this.gameMap = new models.SOCMap({mapSize:this.get('mapSize')});
        },

        getCurrentPlayer: function() {
            return this.get('players').at(this.get('whosTurn'));
        }
    });

    //=========================================================================
    // SOCMap
    //=========================================================================
    models.SOCMap = Backbone.Model.extend({
        defaults: {
            mapSize: 'small',
            hexes: new models.Deck(),
            ports: [],
            placedBuildings: new Backbone.Collection()
        },
        initialize: function() {
            this.populate(); //setup objects
            this.generate(); //randomize
        },
        populate: function() {
            var t = models.SOCHex.TYPES;
            var s = models.SOCHex.SIDES;

            //Define map elements
            var hexes, nums, ports;
            if (this.get('mapSize') === 'small') {
                hexes = [[t.WOOD, 4], [t.BRICK, 3], [t.WHEAT, 4], [t.SHEEP, 4], [t.ORE, 3], [t.DESERT, 1]];
                ports = [[1, s.NE, t.WOOD], [2, s.W, t.BRICK],
                         [3, s.NE, t.ANY],  [7, s.NW, t.ANY],
                         [11, s.E, t.ORE],  [11, s.SW, t.SHEEP],
                         [12, s.W, t.WHEAT],[16, s.SW, t.ANY],
                         [18, s.SW, t.ANY] ];
            } else {
                hexes = [[t.WOOD, 4], [t.BRICK, 3], [t.WHEAT, 4], [t.SHEEP, 4], [t.ORE, 3], [t.DESERT, 2]];
                nums = [];
                ports = [];
            }
            
            //Create Hex objects
            var hexDeck = new models.Deck();
            for (var i = 0, ilen = hexes.length; i < ilen; i++) {
                var res = hexes[i];
                var resType = res[0];
                for (var j = 0, jlen = res[1]; j < jlen; j++) {
                    var hex = new models.SOCHex({type: resType});
                    hexDeck.add(hex, SILENT);
                }
            }

            //Assign to map
            this.set({hexes: hexDeck, ports: ports}, SILENT);
        },
        generate: function() {

            //Randomize hexes
            this.get('hexes').shuffle();

            //Assign numbers to hexes
            if (this.get('mapSize') === 'small') {
                var nums = [4,8,10,5,11,6,9,5,3,11,10,6,12,4,2,8,3,9];
            } else {
                var nums = [4,8,10,5,11,6,9,5,3,11,10,6,12,4,2,8,3,9];
            }

            var desertOffset = 0, DESERT = models.SOCHex.TYPES.DESERT;
            this.get('hexes').forEach(function(elem, i, list) {
                if (elem.get('type') == DESERT) {
                    desertOffset++;
                } else {
                    elem.set({'num': nums[i-desertOffset]}, SILENT);
                }
            });
        },
        printMap: function() {
            return this.get('hexes').map(function(hex){ return hex.toString(); }).join(',');
        }

    });

    //=========================================================================
    // SOCHex 
    //=========================================================================
    models.SOCHex = Backbone.Model.extend({
        defaults: { type: 0, num: -999 },
        toString: function() { return '[' + this.get('type') + ', ' + this.get('num') + ']';},
        getClassName: function() {
            var t = models.SOCHex.TYPES;
            switch(this.get('type')) {
                case t.UNKNOWN: return 'unknown';
                case t.WOOD: return 'wood';
                case t.BRICK: return 'brick';
                case t.WHEAT: return 'wheat';
                case t.SHEEP: return 'sheep';
                case t.ORE: return 'ore';
                case t.DESERT: return 'desert';
                case t.ANY: return 'any';
            }
        }
    
    }, {//Static properties
        TYPES: { UNKNOWN:0, WOOD:1, BRICK:2, WHEAT:3, SHEEP:4, ORE:5, DESERT:6, ANY:7 },
        CLASS_NAMES: { },
        SIDES: { NE:1, E:2, SE:3, SW:4, W:5, NW:6 }
    });
    
    //=========================================================================
    // ResourceCard
    //=========================================================================
    models.ResourceCard = Backbone.Model.extend({
        defaults: { type: 0 }
    });

    //=========================================================================
    // DevCard
    //=========================================================================
    models.DevCard = Backbone.Model.extend({
        defaults: { type: 0 }
    
    }, {//Static properties
        TYPES: { UNKNOWN:0, VICTORY_POINT:1, KNIGHT:2, YEAR_OF_PLENTY:3, MONOPOLY:4, ROAD_BUILDING:5 }
    });
    
    

})();
