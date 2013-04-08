var Controller = function() {
    var self = this;

    var init = function() {
        var c = models.Player.COLORS;
        var players = new Backbone.Collection([
            new models.Player({id:1, name:'Abby', color:c.RED, playable:true}),
            new models.Player({id:2, name:'Ben', color:c.BLUE, playable:true}),
            new models.Player({id:3, name:'Chuck', color:c.GREEN, playable:true}),
            new models.Player({id:4, name:'Derek', color:c.ORANGE, playable:false})
        ]);

        gameModel = new models.Game({
            players: players
        });
        //console.warn('MAP: ', gameModel.gameMap.printMap());
        //console.warn('PLAYERS: ', gameModel.get('players').map(function(p){return p.get('name');}));

        //DEBUG
        var buildings = gameModel.get('placedBuildings');
        buildings.add(new models.City({hex:0,corner:'NE'})); 
        //END DEBUG

        var whosFirst = Math.floor(Math.random() * players.length);
        gameModel.set({'whosTurn': whosFirst}, SILENT);

        gameView = new GameView({model: gameModel, el: $('#Game')});

        var a = players.at(0);
        a.get('resources').add(new models.ResourceCard({type:99}));
        a.get('resources').add(new models.ResourceCard({type:99}));
        a.get('devCards').add(new models.DevCard({type:models.DevCard.TYPES.KNIGHT}));

        self.continueGame();
    };

    var gameModel = null, gameView = null;

    //Will pretty much always be the first/only thing called directly after 
    //the controller is made. Will pick up as appropriate if the game is already
    //midway or begin a new game from the placement rounds
    this.continueGame = function() {
        var stage = gameModel.get('gameStage');
        switch (stage) {
            case models.Game.STAGES.PLACEMENT_1:
            case models.Game.STAGES.PLACEMENT_2:
                gameView.promptPlacement();
                break;
        }
    }

    init();
};
