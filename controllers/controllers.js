var Controller = function() {
    var self = this;

    var init = function() {
        var c = models.Player.COLORS;
        var players = new Backbone.Collection([
            new models.Player({name:'Abby', color:c.RED}),
            new models.Player({name:'Ben', color:c.BLUE}),
            new models.Player({name:'Chuck', color:c.GREEN}),
            new models.Player({name:'Derek', color:c.ORANGE})
        ]);

        gameModel = new models.Game({
            players: players,
        });
        console.warn('MAP: ', gameModel.gameMap.printMap());
        console.warn('PLAYERS: ', gameModel.get('players').map(function(p){return p.get('name');}));

        var whosFirst = Math.floor(Math.random() * players.length);
        gameModel.set({'whosTurn': whosFirst}, SILENT);
        console.warn('GOING FIRST: ', gameModel.getCurrentPlayer().get('name'));

        var gameView = new GameView({model: gameModel, el: $('#Game')});
    };

    var gameModel = null;

    init();
};
