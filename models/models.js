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
            color: 'pink',
            playable:false,
            unusedRoads: 16,
            unusedBuildings: null, 
            resources: null,
            devCards: null
        },

        initialize: function(options) {
            var numSettlements = 5, numCities = 5;
            var buildings = new Backbone.Collection();
            for (var i = 0; i < numSettlements; i++) {
                buildings.add(new models.Settlement());
            }
            for (var i = 0; i < numCities; i++) {
                buildings.add(new models.City());
            }

            this.set({
                devCards: new Backbone.Collection(),
                resources: new Backbone.Collection(),
                unusedBuildings: buildings
            });
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
            players: null,
            robberLocation: null,
            whosTurn: null,
            gameStage: null,
            devCardDeck: new models.Deck(),
            unusedResourceCards: { },
            placedBuildings: new Backbone.Collection()
        },

        initialize: function(options) {
            this.gameMap = new models.SOCMap({
                mapSize:this.get('mapSize'),
                placedBuildings:this.get('placedBuildings')
            });
            
            if (this.get('gameStage') === null) {
                this.set({gameStage: models.Game.STAGES.PLACEMENT_1});
            }
        },

        getCurrentPlayer: function() {
            return this.get('players').at(this.get('whosTurn'));
        }
    }, {//Static properties
        STAGES: { PLACEMENT_1: 1, PLACEMENT_2: 2, NORMAL: 3 }   
    });

    //=========================================================================
    // SOCMap
    //=========================================================================
    models.SOCMap = Backbone.Model.extend({
        defaults: {
            mapSize: 'small',
            hexes: new models.Deck(),
            ports: []
        },
        initialize: function() {
            this.populate(); //setup objects
            this.generate(); //randomize

            if (this.get('mapSize') === 'small') {
                this.rowLengths = [3,4,5,4,3];
            } else {
                this.rowLengths = [4,5,6,6,5,4];
            }

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
                var nums = [5,2,6,10,9,4,3,8,11,5,8,4,3,6,10,11,12,9];
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
        },

        getHexPosInfo: function(hexIndex) {
            
            var rls = this.rowLengths;
            var prevRL = -1, curRL = rls[0], nextRL = rls[1];
            var sum = curRL, i = 1;
            while (sum < hexIndex+1) {
                prevRL = curRL;
                curRL = nextRL
                nextRL = (i+1) === rls.length ? -1 : rls[++i];
                sum += curRL;
            }
            var rowPos = hexIndex - (sum - curRL);
            return { rowPos: rowPos, prevRL: prevRL, curRL: curRL, nextRL: nextRL };
        },
    }, { //static properties
        SIDES: {NE:0,E:1,SE:2,SW:3,W:4,NW:5},
        SMALL_MAP_ADJACENCY: [ //neighbor lookup: [NE,E,SE,SW,W,NW]
            [3,4,1,null,null,null],
            [4,5,2,null,null,'0'],
            [5,6,null,null,null,1],

            [7,8,4,'0',null,null],
            [8,9,5,1,'0',3],
            [9,10,6,2,1,4],
            [10,11,null,null,2,5],

            [null,12,8,3,null,null],
            [12,13,9,4,3,7],
            [13,14,10,5,4,8],
            [14,15,11,6,5,9],
            [15,null,null,null,6,10],

            [null,16,13,8,7,null],
            [16,17,14,9,8,12],
            [17,18,15,10,9,13],
            [18,null,null,11,10,14],

            [null,null,17,13,12,null],
            [null,null,18,14,13,16],
            [null,null,null,15,14,17]
        ]
    });

    //=========================================================================
    // SOCHex 
    //=========================================================================
    models.SOCHex = Backbone.Model.extend({
        defaults: { type: 0, num: -999 },
        initialize: function(options) {
        },

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
        SIDES: { NE:1, E:2, SE:3, SW:4, W:5, NW:6 },
        CORNERS: { N:1, NE:2, SE:3, S:4, SW:5, NW:6 }
    });
    
    //=========================================================================
    // Building 
    //=========================================================================
    models.Building = Backbone.Model.extend({
        defaults: {
            hex: null,
            corner: null,
            owner: null
        },

        initialize: function(options) {

        }
    });

    //=========================================================================
    // Settlement
    //=========================================================================
    models.Settlement = models.Building.extend({

    });


    //=========================================================================
    // City
    //=========================================================================
    models.City = models.Building.extend({

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
